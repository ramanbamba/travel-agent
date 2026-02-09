import type {
  FlightOffer,
  SupplyFlightSegment,
  PriceBreakdown,
  FareConditions,
  BaggageAllowance,
  CabinClass,
  SupplyBooking,
  SupplyPassenger,
} from "../../types";

// ── Duffel SDK types (imported as value-level references) ────────────────────
// We type these loosely to avoid coupling to Duffel SDK internals.
// The actual objects come from `@duffel/api` at runtime.

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Duration helpers ────────────────────────────────────────────────────────

/** Compute "Xh Ym" from two ISO datetime strings */
export function computeDuration(departureAt: string, arrivalAt: string): string {
  const ms = new Date(arrivalAt).getTime() - new Date(departureAt).getTime();
  const totalMinutes = Math.max(0, Math.round(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/** Parse ISO 8601 duration (e.g. "PT7H30M") to "Xh Ym" */
function parseIsoDuration(iso: string | null): string | null {
  if (!iso) return null;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return null;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  if (hours === 0 && minutes === 0) return null;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

// ── Offer → FlightOffer ─────────────────────────────────────────────────────

export function mapDuffelOfferToFlightOffer(offer: any): FlightOffer {
  const segments: SupplyFlightSegment[] = [];
  let totalSlices = 0;
  let totalSegments = 0;

  for (const slice of offer.slices ?? []) {
    totalSlices++;
    for (const seg of slice.segments ?? []) {
      totalSegments++;
      segments.push(mapSegment(seg));
    }
  }

  const stops = Math.max(0, totalSegments - totalSlices);

  // Total duration: use first slice's duration if single-slice, otherwise compute from endpoints
  let totalDuration = "N/A";
  if (offer.slices?.length === 1 && offer.slices[0].duration) {
    totalDuration = parseIsoDuration(offer.slices[0].duration) ?? "N/A";
  } else if (segments.length > 0) {
    totalDuration = computeDuration(
      segments[0].departure.time,
      segments[segments.length - 1].arrival.time
    );
  }

  const price = mapPrice(offer);
  const conditions = mapConditions(offer.conditions);
  const baggage = mapBaggage(offer.slices);

  return {
    id: `duffel-${offer.id}`,
    supplierName: "duffel",
    supplierId: offer.id,
    segments,
    totalDuration,
    stops,
    price,
    seatsRemaining: undefined, // Duffel doesn't expose this on offers
    expiresAt: offer.expires_at ?? undefined,
    conditions,
    baggageIncluded: baggage,
  };
}

function mapSegment(seg: any): SupplyFlightSegment {
  const carrier = seg.operating_carrier ?? seg.marketing_carrier ?? {};
  const airlineCode = carrier.iata_code ?? "";
  const flightNumber = seg.operating_carrier_flight_number
    ? `${airlineCode}${seg.operating_carrier_flight_number}`
    : seg.marketing_carrier_flight_number
      ? `${seg.marketing_carrier?.iata_code ?? airlineCode}${seg.marketing_carrier_flight_number}`
      : "N/A";

  // Determine cabin class from passenger info
  let cabin: CabinClass = "economy";
  if (seg.passengers?.[0]?.cabin_class) {
    cabin = seg.passengers[0].cabin_class as CabinClass;
  }

  const duration = parseIsoDuration(seg.duration) ??
    computeDuration(seg.departing_at, seg.arriving_at);

  return {
    id: seg.id,
    airline: carrier.name ?? "Unknown Airline",
    airlineCode,
    flightNumber,
    departure: {
      airport: seg.origin?.name ?? seg.origin?.city_name ?? "Unknown",
      airportCode: seg.origin?.iata_code ?? "",
      time: seg.departing_at,
      terminal: seg.origin_terminal ?? undefined,
    },
    arrival: {
      airport: seg.destination?.name ?? seg.destination?.city_name ?? "Unknown",
      airportCode: seg.destination?.iata_code ?? "",
      time: seg.arriving_at,
      terminal: seg.destination_terminal ?? undefined,
    },
    duration,
    cabin,
    aircraft: seg.aircraft?.name ?? undefined,
  };
}

function mapPrice(offer: any): PriceBreakdown {
  const total = parseFloat(offer.total_amount ?? "0");
  const base = parseFloat(offer.base_amount ?? "0");
  const tax = parseFloat(offer.tax_amount ?? "0");
  return {
    baseFare: base,
    taxesAndFees: tax,
    total,
    currency: offer.total_currency ?? offer.base_currency ?? "USD",
  };
}

function mapConditions(conditions: any): FareConditions | undefined {
  if (!conditions) return undefined;

  const change = conditions.change_before_departure;
  const refund = conditions.refund_before_departure;

  return {
    changeable: change?.allowed === true,
    refundable: refund?.allowed === true,
    changePenalty: change?.allowed && change?.penalty_amount
      ? parseFloat(change.penalty_amount)
      : undefined,
    cancelPenalty: refund?.allowed && refund?.penalty_amount
      ? parseFloat(refund.penalty_amount)
      : undefined,
  };
}

function mapBaggage(slices: any[]): BaggageAllowance | undefined {
  // Aggregate baggage from the first segment's first passenger
  const firstSeg = slices?.[0]?.segments?.[0];
  const passengerBaggage = firstSeg?.passengers?.[0]?.baggages;
  if (!passengerBaggage || !Array.isArray(passengerBaggage)) return undefined;

  let carryOn = 0;
  let checked = 0;
  for (const bag of passengerBaggage) {
    if (bag.type === "carry_on") carryOn += bag.quantity ?? 0;
    if (bag.type === "checked") checked += bag.quantity ?? 0;
  }

  return { carryOn, checked };
}

// ── Passenger mapping (our → Duffel) ───────────────────────────────────────

export function mapPassengerToDuffel(
  passenger: SupplyPassenger,
  passengerId: string
): any {
  const title = passenger.gender === "male" ? "mr" : "ms";
  const gender = passenger.gender === "male" ? "m" : "f";

  const duffelPassenger: any = {
    id: passengerId,
    given_name: passenger.firstName,
    family_name: passenger.lastName,
    born_on: passenger.dateOfBirth ?? "1990-01-01",
    gender,
    title,
    email: passenger.email,
    phone_number: passenger.phone ?? "+10000000000",
  };

  // Add passport as identity document if provided
  if (passenger.passportNumber && passenger.nationality) {
    duffelPassenger.identity_documents = [
      {
        type: "passport",
        unique_identifier: passenger.passportNumber,
        issuing_country_code: passenger.nationality,
        expires_on: passenger.passportExpiry ?? "2030-01-01",
      },
    ];
  }

  return duffelPassenger;
}

// ── Order → SupplyBooking ──────────────────────────────────────────────────

export function mapDuffelOrderToBooking(order: any): SupplyBooking {
  // Reuse offer mapping logic for flight details
  const segments: SupplyFlightSegment[] = [];
  let totalSlices = 0;
  let totalSegments = 0;

  for (const slice of order.slices ?? []) {
    totalSlices++;
    for (const seg of slice.segments ?? []) {
      totalSegments++;
      segments.push(mapSegment(seg));
    }
  }

  const stops = Math.max(0, totalSegments - totalSlices);
  let totalDuration = "N/A";
  if (segments.length > 0) {
    totalDuration = computeDuration(
      segments[0].departure.time,
      segments[segments.length - 1].arrival.time
    );
  }

  const price: PriceBreakdown = {
    baseFare: parseFloat(order.base_amount ?? "0"),
    taxesAndFees: parseFloat(order.tax_amount ?? "0"),
    total: parseFloat(order.total_amount ?? "0"),
    currency: order.total_currency ?? "USD",
  };

  const passengers: SupplyPassenger[] = (order.passengers ?? []).map(
    (p: any) => ({
      firstName: p.given_name ?? "",
      lastName: p.family_name ?? "",
      email: p.email ?? "",
      phone: p.phone_number,
      dateOfBirth: p.born_on,
      gender: p.gender === "m" ? "male" : p.gender === "f" ? "female" : undefined,
    })
  );

  return {
    id: `duffel-${order.id}`,
    supplierName: "duffel",
    supplierBookingId: order.id,
    confirmationCode: order.booking_reference ?? order.id,
    status: order.cancelled_at ? "cancelled" : "confirmed",
    offer: {
      id: `duffel-${order.id}`,
      supplierName: "duffel",
      supplierId: order.id,
      segments,
      totalDuration,
      stops,
      price,
    },
    passengers,
    totalPrice: price,
    bookedAt: order.created_at ?? new Date().toISOString(),
  };
}

// ── Cabin class mapping ────────────────────────────────────────────────────

/** Map our CabinClass to Duffel's cabin class (they use the same values) */
export function mapCabinClass(cabin?: CabinClass): string | undefined {
  return cabin; // Duffel uses "economy", "premium_economy", "business", "first" — same as ours
}
