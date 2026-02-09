import type { FlightSupplier } from "./supplier.interface";
import type {
  FlightOffer,
  SupplySearchParams,
  SupplySearchResult,
  SupplierName,
} from "./types";
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
