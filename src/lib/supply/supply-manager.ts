import type { FlightSupplier } from "./supplier.interface";
import type {
  FlightOffer,
  SupplySearchParams,
  SupplySearchResult,
  SupplierName,
  SupplyPassenger,
  SupplyPaymentInfo,
  SupplyBooking,
  SupplyCancellationResult,
} from "./types";
import { SupplyError } from "./types";
import { resolveSuppliers } from "./rules-engine";
import { AmadeusSupplier } from "./suppliers/amadeus/amadeus-supplier";
import { MockSupplier } from "./suppliers/mock/mock-supplier";
import { DuffelSupplier } from "./suppliers/duffel/duffel-supplier";
import { applyPricingToOffer } from "@/lib/pricing/pricing-engine";
import type { FlightOption } from "@/types/flights";

// ── Supplier registry ────────────────────────────────────────────────────────

type SupplierFactory = () => FlightSupplier;

const supplierFactories = new Map<string, SupplierFactory>();
const supplierInstances = new Map<string, FlightSupplier>();

function getSupplier(name: string): FlightSupplier | null {
  let instance = supplierInstances.get(name);
  if (instance) return instance;

  const factory = supplierFactories.get(name);
  if (!factory) return null;

  instance = factory();
  supplierInstances.set(name, instance);
  return instance;
}

/**
 * Register a supplier factory. The supplier is lazily instantiated on first use.
 * Use this to add NDC suppliers without modifying core code.
 */
export function registerSupplier(name: string, factory: SupplierFactory): void {
  supplierFactories.set(name, factory);
  // Clear cached instance so new factory takes effect
  supplierInstances.delete(name);
}

// ── Default registrations ────────────────────────────────────────────────────

registerSupplier("amadeus", () => new AmadeusSupplier());
registerSupplier("mock", () => new MockSupplier());

registerSupplier("duffel", () => new DuffelSupplier());

// ── Search: fallback chain ───────────────────────────────────────────────────

/**
 * Search for flights using the rules engine to determine supplier order.
 * Tries suppliers in order; on failure or empty results, falls to next.
 */
export async function searchFlights(
  params: SupplySearchParams
): Promise<SupplySearchResult> {
  const supplierNames = resolveSuppliers(params);

  for (const name of supplierNames) {
    const supplier = getSupplier(name);
    if (!supplier) continue;

    try {
      if (!supplier.isAvailable()) continue;

      const offers = await supplier.searchFlights(params);
      if (offers.length > 0) {
        return { offers, source: name };
      }
    } catch (err) {
      console.error(
        `[supply] ${name} search failed:`,
        err instanceof Error ? err.message : err
      );
      // Continue to next supplier in the chain
    }
  }

  // All suppliers exhausted
  return { offers: [], source: supplierNames[supplierNames.length - 1] ?? "unknown" };
}

// ── Search: parallel multi-supplier ──────────────────────────────────────────

/**
 * Query multiple suppliers in parallel and merge results.
 * Deduplicates by flight number + departure time.
 * Useful when an NDC supplier covers one airline while a GDS covers the rest.
 */
export async function searchFlightsParallel(
  params: SupplySearchParams,
  supplierNames: string[]
): Promise<FlightOffer[]> {
  const promises = supplierNames.map(async (name) => {
    const supplier = getSupplier(name);
    if (!supplier || !supplier.isAvailable()) return [];

    try {
      return await supplier.searchFlights(params);
    } catch (err) {
      console.error(
        `[supply] ${name} parallel search failed:`,
        err instanceof Error ? err.message : err
      );
      return [];
    }
  });

  const results = await Promise.all(promises);
  const allOffers = results.flat();

  // Deduplicate by flight number + departure time
  const seen = new Set<string>();
  return allOffers.filter((offer) => {
    const firstSeg = offer.segments[0];
    if (!firstSeg) return true;
    const key = `${firstSeg.flightNumber}-${firstSeg.departure.time}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Backward-compat mapper ───────────────────────────────────────────────────

/** Convert a FlightOffer to the existing FlightOption type (zero UI changes) */
export function toFlightOption(offer: FlightOffer): FlightOption {
  return {
    id: offer.id,
    segments: offer.segments.map((seg) => ({
      id: seg.id,
      airline: seg.airline,
      airlineCode: seg.airlineCode,
      flightNumber: seg.flightNumber,
      departure: { ...seg.departure },
      arrival: { ...seg.arrival },
      duration: seg.duration,
      cabin: seg.cabin,
      aircraft: seg.aircraft,
    })),
    totalDuration: offer.totalDuration,
    stops: offer.stops,
    price: {
      amount: offer.price.total,
      currency: offer.price.currency,
      serviceFee: offer.price.serviceFee,
      markup: offer.price.markup,
    },
    seatsRemaining: offer.seatsRemaining,
  };
}

// ── Convenience: returns FlightOption[] for existing routes ───────────────────

/**
 * Search flights and return FlightOption[] for backward compatibility.
 * Drop-in replacement for existing route handlers.
 */
export async function searchFlightsCompat(
  params: SupplySearchParams
): Promise<{ flights: FlightOption[]; source: SupplierName }> {
  const result = await searchFlights(params);
  return {
    flights: result.offers.map((offer) =>
      toFlightOption(applyPricingToOffer(offer))
    ),
    source: result.source,
  };
}

// ── Booking: supplier resolution ────────────────────────────────────────────

/** Suppliers that support createBooking (not just search). */
const BOOKABLE_SUPPLIERS = new Set(["duffel", "mock"]);

/**
 * Parse the composite offer ID to determine which supplier owns it.
 * Offer IDs are prefixed: "duffel-off_xxx", "amadeus-xxx", "mock-xxx".
 */
export function resolveSupplierFromOfferId(offerId: string): SupplierName {
  const dash = offerId.indexOf("-");
  if (dash === -1) return "mock";
  const prefix = offerId.slice(0, dash);
  if (supplierFactories.has(prefix)) return prefix;
  return "mock";
}

/**
 * Create a booking with the appropriate supplier.
 * Resolves the supplier from the offer ID, validates it's bookable,
 * and delegates to supplier.createBooking().
 */
export async function createSupplyBooking(
  offerId: string,
  passengers: SupplyPassenger[],
  payment: SupplyPaymentInfo
): Promise<SupplyBooking> {
  const supplierName = resolveSupplierFromOfferId(offerId);

  if (!BOOKABLE_SUPPLIERS.has(supplierName)) {
    throw new SupplyError(
      `Supplier "${supplierName}" does not support booking`,
      supplierName,
      "NOT_SUPPORTED",
      501
    );
  }

  const supplier = getSupplier(supplierName);
  if (!supplier || !supplier.isAvailable()) {
    throw new SupplyError(
      `Supplier "${supplierName}" is not available`,
      supplierName,
      "SUPPLIER_UNAVAILABLE",
      503
    );
  }

  return supplier.createBooking(offerId, passengers, payment);
}

/**
 * Validate that an offer is still available and the price hasn't changed significantly.
 * Returns the current price if valid, or throws if expired/unavailable.
 * Used as a pre-booking safety check before charging the customer.
 */
export async function validateOfferFreshness(
  offerId: string,
  expectedPriceCents: number,
  currency: string
): Promise<{ valid: boolean; currentPriceCents: number; priceChanged: boolean }> {
  const supplierName = resolveSupplierFromOfferId(offerId);

  if (!BOOKABLE_SUPPLIERS.has(supplierName)) {
    // Non-bookable suppliers can't be validated — assume OK
    return { valid: true, currentPriceCents: expectedPriceCents, priceChanged: false };
  }

  const supplier = getSupplier(supplierName);
  if (!supplier || !supplier.isAvailable()) {
    throw new SupplyError(
      `Supplier "${supplierName}" is not available`,
      supplierName,
      "SUPPLIER_UNAVAILABLE",
      503
    );
  }

  try {
    const offer = await supplier.getOfferDetails(offerId);
    const currentPriceCents = Math.round(offer.price.total * 100);
    const priceChanged = currentPriceCents !== expectedPriceCents;

    return {
      valid: true,
      currentPriceCents,
      priceChanged,
    };
  } catch (err) {
    if (err instanceof SupplyError && err.status === 410) {
      throw err; // Offer expired — re-throw
    }
    // Other errors (network, etc.) — log but don't block
    console.error(`[supply] Offer validation failed for ${supplierName}:`, err);
    return { valid: true, currentPriceCents: expectedPriceCents, priceChanged: false };
  }
}

/**
 * Cancel a booking with the named supplier.
 */
export async function cancelSupplyBooking(
  supplierName: string,
  supplierBookingId: string
): Promise<SupplyCancellationResult> {
  const supplier = getSupplier(supplierName);
  if (!supplier || !supplier.isAvailable()) {
    throw new SupplyError(
      `Supplier "${supplierName}" is not available for cancellation`,
      supplierName,
      "SUPPLIER_UNAVAILABLE",
      503
    );
  }

  return supplier.cancelBooking(supplierBookingId);
}
