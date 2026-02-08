import type { FlightOption, FlightSegment } from "@/types/flights";

const airlines = [
  { code: "BA", name: "British Airways" },
  { code: "AA", name: "American Airlines" },
  { code: "UA", name: "United Airlines" },
  { code: "DL", name: "Delta Air Lines" },
  { code: "VS", name: "Virgin Atlantic" },
];

const cabins: FlightSegment["cabin"][] = [
  "economy",
  "premium_economy",
  "business",
  "first",
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateFlightNumber(airlineCode: string): string {
  return `${airlineCode}${randomInt(100, 9999)}`;
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

export function generateMockFlights(
  origin: string,
  destination: string,
  departureDate?: string
): FlightOption[] {
  const baseDate = departureDate
    ? new Date(departureDate)
    : addHours(new Date(), 24 * 7); // default: 1 week from now

  const count = randomInt(3, 5);
  const flights: FlightOption[] = [];

  for (let i = 0; i < count; i++) {
    const airline = airlines[randomInt(0, airlines.length - 1)];
    const cabin = cabins[randomInt(0, 1)]; // mostly economy/premium
    const durationHours = randomInt(3, 12) + Math.random();
    const departureOffset = randomInt(6, 22); // departure hour of day

    const departureTime = new Date(baseDate);
    departureTime.setHours(departureOffset, randomInt(0, 59), 0, 0);
    const arrivalTime = addHours(departureTime, durationHours);

    const stops = Math.random() > 0.6 ? 1 : 0;
    const basePrice =
      cabin === "economy"
        ? randomInt(250, 800)
        : cabin === "premium_economy"
          ? randomInt(600, 1400)
          : randomInt(1500, 4000);

    const segment: FlightSegment = {
      id: `seg-${crypto.randomUUID().slice(0, 8)}`,
      airline: airline.name,
      airlineCode: airline.code,
      flightNumber: generateFlightNumber(airline.code),
      departure: {
        airport: `${origin} International`,
        airportCode: origin.toUpperCase(),
        time: departureTime.toISOString(),
      },
      arrival: {
        airport: `${destination} International`,
        airportCode: destination.toUpperCase(),
        time: arrivalTime.toISOString(),
      },
      duration: formatDuration(durationHours),
      cabin,
    };

    flights.push({
      id: `flight-${crypto.randomUUID().slice(0, 8)}`,
      segments: [segment],
      totalDuration: formatDuration(durationHours),
      stops,
      price: {
        amount: basePrice,
        currency: "USD",
      },
      seatsRemaining: Math.random() > 0.7 ? randomInt(1, 5) : undefined,
    });
  }

  // Sort by price
  flights.sort((a, b) => a.price.amount - b.price.amount);
  return flights;
}
