/**
 * Indian-market mock flight generator for demo mode.
 * Returns realistic IndiGo, Air India, Vistara, SpiceJet, Akasa flights with INR pricing.
 */

export interface DemoFlight {
  offer_id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  departureTime: string; // ISO
  arrivalTime: string; // ISO
  duration: string;
  stops: number;
  cabin: string;
  price: number;
  currency: string;
  compliant: boolean;
  violations: string[];
  seatsLeft?: number;
}

const INDIAN_AIRLINES = [
  { code: "6E", name: "IndiGo" },
  { code: "AI", name: "Air India" },
  { code: "UK", name: "Vistara" },
  { code: "SG", name: "SpiceJet" },
  { code: "QP", name: "Akasa Air" },
];

// Realistic base fares in INR for domestic routes
const PRICE_RANGES: Record<string, { min: number; max: number }> = {
  economy: { min: 3200, max: 8500 },
  premium_economy: { min: 7500, max: 14000 },
  business: { min: 15000, max: 35000 },
};

// Common Indian routes with realistic durations
const ROUTE_DURATIONS: Record<string, { min: number; max: number }> = {
  "BLR-DEL": { min: 150, max: 170 },
  "DEL-BLR": { min: 155, max: 175 },
  "BLR-BOM": { min: 95, max: 115 },
  "BOM-BLR": { min: 100, max: 120 },
  "DEL-BOM": { min: 120, max: 140 },
  "BOM-DEL": { min: 125, max: 145 },
  "BLR-HYD": { min: 70, max: 85 },
  "HYD-BLR": { min: 70, max: 85 },
  "DEL-CCU": { min: 130, max: 150 },
  "CCU-DEL": { min: 135, max: 155 },
  "BLR-MAA": { min: 55, max: 70 },
  "MAA-BLR": { min: 55, max: 70 },
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export function generateDemoFlights(
  origin: string,
  destination: string,
  date: string,
  cabin: string = "economy",
  count: number = 5
): DemoFlight[] {
  const routeKey = `${origin}-${destination}`;
  const routeDuration = ROUTE_DURATIONS[routeKey] ?? { min: 90, max: 180 };
  const priceRange = PRICE_RANGES[cabin] ?? PRICE_RANGES.economy;
  const baseDate = new Date(date + "T00:00:00+05:30");

  const flights: DemoFlight[] = [];
  // Use all airlines for variety, pick `count` of them
  const shuffled = [...INDIAN_AIRLINES].sort(() => Math.random() - 0.5);

  for (let i = 0; i < count; i++) {
    const airline = shuffled[i % shuffled.length];
    const departureHour = randomInt(6, 21);
    const departureMin = randomInt(0, 11) * 5; // Round to 5 minutes
    const durationMin = randomInt(routeDuration.min, routeDuration.max);

    const depTime = new Date(baseDate);
    depTime.setHours(departureHour, departureMin, 0, 0);
    const arrTime = new Date(depTime.getTime() + durationMin * 60 * 1000);

    const price = randomInt(priceRange.min, priceRange.max);
    const stops = durationMin > 150 && Math.random() > 0.7 ? 1 : 0;

    // Simulate policy compliance
    // Most flights compliant, 1-2 out of policy for demo
    const isOutOfPolicy = i >= count - 1 && cabin !== "business";
    const violations: string[] = [];
    if (isOutOfPolicy) {
      if (price > 7000) violations.push("Exceeds per-trip spend limit (₹7,000)");
      if (cabin === "premium_economy") violations.push("Premium economy not allowed for IC level");
    }
    // Business class always out of policy for IC level
    if (cabin === "business" && i > 0) {
      violations.push("Business class requires VP+ approval");
    }

    flights.push({
      offer_id: `demo-${crypto.randomUUID().slice(0, 8)}`,
      airline: airline.name,
      airlineCode: airline.code,
      flightNumber: `${airline.code}${randomInt(100, 9999)}`,
      origin,
      destination,
      departure: formatTime(depTime),
      arrival: formatTime(arrTime),
      departureTime: depTime.toISOString(),
      arrivalTime: arrTime.toISOString(),
      duration: formatDuration(durationMin),
      stops,
      cabin,
      price,
      currency: "INR",
      compliant: violations.length === 0,
      violations,
      seatsLeft: Math.random() > 0.7 ? randomInt(1, 6) : undefined,
    });
  }

  // Sort by price
  flights.sort((a, b) => a.price - b.price);
  return flights;
}

/**
 * Generate a demo booking result
 */
export function generateDemoBooking(flight: DemoFlight) {
  const needsApproval = !flight.compliant;
  return {
    booking_id: `demo-bk-${crypto.randomUUID().slice(0, 8)}`,
    status: needsApproval ? "pending_approval" : "confirmed",
    pnr: needsApproval ? null : `${flight.airlineCode}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    message: needsApproval
      ? "Sent for manager approval — you'll be notified once approved."
      : `Booking confirmed! PNR will be emailed to you shortly.`,
  };
}
