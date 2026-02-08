import { amadeusGet, amadeusPost, AmadeusApiError } from "./client";
import type { FlightOption, FlightSegment } from "@/types/flights";

// ── Amadeus response types (subset we actually use) ─────────────────────────

interface AmadeusFlightOffer {
  type: string;
  id: string;
  source: string;
  numberOfBookableSeats?: number;
  itineraries: AmadeusItinerary[];
  price: {
    currency: string;
    total: string;
    base: string;
    grandTotal: string;
  };
  travelerPricings: {
    fareDetailsBySegment: {
      segmentId: string;
      cabin: string;
      class: string;
    }[];
  }[];
}

interface AmadeusItinerary {
  duration: string; // ISO 8601 duration, e.g. "PT7H30M"
  segments: AmadeusSegment[];
}

interface AmadeusSegment {
  departure: { iataCode: string; terminal?: string; at: string };
  arrival: { iataCode: string; terminal?: string; at: string };
  carrierCode: string;
  number: string;
  aircraft: { code: string };
  duration: string;
  id: string;
  numberOfStops: number;
}

interface AmadeusFlightResponse {
  meta: { count: number };
  data: AmadeusFlightOffer[];
  dictionaries?: {
    carriers?: Record<string, string>;
    aircraft?: Record<string, string>;
  };
}

interface AmadeusPricingResponse {
  data: {
    flightOffers: AmadeusFlightOffer[];
  };
}

// ── Airline names fallback (for when dictionaries is missing) ───────────────

const AIRLINE_NAMES: Record<string, string> = {
  AA: "American Airlines",
  BA: "British Airways",
  DL: "Delta Air Lines",
  UA: "United Airlines",
  VS: "Virgin Atlantic",
  AF: "Air France",
  LH: "Lufthansa",
  EK: "Emirates",
  QR: "Qatar Airways",
  SQ: "Singapore Airlines",
  CX: "Cathay Pacific",
  QF: "Qantas",
  JL: "Japan Airlines",
  NH: "ANA",
  TK: "Turkish Airlines",
  EY: "Etihad Airways",
  KL: "KLM",
  IB: "Iberia",
  AY: "Finnair",
  SK: "SAS",
  LX: "Swiss",
  OS: "Austrian Airlines",
  TP: "TAP Portugal",
  AC: "Air Canada",
  WN: "Southwest Airlines",
  B6: "JetBlue",
  AS: "Alaska Airlines",
  NK: "Spirit Airlines",
  F9: "Frontier Airlines",
  G4: "Allegiant Air",
  HA: "Hawaiian Airlines",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert ISO 8601 duration (PT7H30M) to readable string (7h 30m) */
function formatIsoDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return iso;
  const h = match[1] ? `${match[1]}h` : "";
  const m = match[2] ? ` ${match[2]}m` : "";
  return (h + m).trim() || "0m";
}

/** Map Amadeus cabin string to our cabin type */
function mapCabin(
  amCabin: string
): FlightSegment["cabin"] {
  switch (amCabin?.toUpperCase()) {
    case "FIRST":
      return "first";
    case "BUSINESS":
      return "business";
    case "PREMIUM_ECONOMY":
      return "premium_economy";
    default:
      return "economy";
  }
}

/** Map Amadeus airport code to a readable name */
function airportName(code: string): string {
  // The Amadeus API doesn't return airport names in flight-offers,
  // so we use the code itself. The flight card shows airportCode prominently anyway.
  return `${code}`;
}

// ── Transform ───────────────────────────────────────────────────────────────

function transformOffer(
  offer: AmadeusFlightOffer,
  carriers?: Record<string, string>,
  aircraftDict?: Record<string, string>
): FlightOption {
  const itin = offer.itineraries[0]; // outbound itinerary
  const cabinMap = new Map<string, string>();

  // Build segment→cabin lookup from travelerPricings
  if (offer.travelerPricings?.[0]) {
    for (const fd of offer.travelerPricings[0].fareDetailsBySegment) {
      cabinMap.set(fd.segmentId, fd.cabin);
    }
  }

  const segments: FlightSegment[] = itin.segments.map((seg) => {
    const airlineName =
      carriers?.[seg.carrierCode] ??
      AIRLINE_NAMES[seg.carrierCode] ??
      seg.carrierCode;
    const aircraftName =
      aircraftDict?.[seg.aircraft.code] ?? seg.aircraft.code;
    const cabin = mapCabin(cabinMap.get(seg.id) ?? "ECONOMY");

    return {
      id: `seg-${offer.id}-${seg.id}`,
      airline: airlineName,
      airlineCode: seg.carrierCode,
      flightNumber: `${seg.carrierCode}${seg.number}`,
      departure: {
        airport: airportName(seg.departure.iataCode),
        airportCode: seg.departure.iataCode,
        time: seg.departure.at,
        terminal: seg.departure.terminal,
      },
      arrival: {
        airport: airportName(seg.arrival.iataCode),
        airportCode: seg.arrival.iataCode,
        time: seg.arrival.at,
        terminal: seg.arrival.terminal,
      },
      duration: formatIsoDuration(seg.duration),
      cabin,
      aircraft: aircraftName,
    };
  });

  const totalStops = segments.length - 1;

  return {
    id: `amadeus-${offer.id}`,
    segments,
    totalDuration: formatIsoDuration(itin.duration),
    stops: totalStops,
    price: {
      amount: parseFloat(offer.price.grandTotal),
      currency: offer.price.currency,
    },
    seatsRemaining: offer.numberOfBookableSeats,
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

export interface SearchFlightsParams {
  origin: string;
  destination: string;
  departureDate: string; // YYYY-MM-DD
  adults?: number;
  cabinClass?: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
  maxResults?: number;
}

/**
 * Search flights via Amadeus Flight Offers Search.
 * Returns our FlightOption[] type.
 */
export async function searchFlights(
  params: SearchFlightsParams
): Promise<FlightOption[]> {
  const queryParams: Record<string, string> = {
    originLocationCode: params.origin,
    destinationLocationCode: params.destination,
    departureDate: params.departureDate,
    adults: String(params.adults ?? 1),
    max: String(params.maxResults ?? 10),
    currencyCode: "USD",
  };

  if (params.cabinClass) {
    queryParams.travelClass = params.cabinClass;
  }

  const response = await amadeusGet<AmadeusFlightResponse>(
    "/v2/shopping/flight-offers",
    queryParams
  );

  if (!response.data || response.data.length === 0) {
    return [];
  }

  const carriers = response.dictionaries?.carriers;
  const aircraft = response.dictionaries?.aircraft;

  return response.data.map((offer) =>
    transformOffer(offer, carriers, aircraft)
  );
}

/**
 * Get confirmed pricing for a flight offer.
 * Returns updated FlightOption with verified price.
 */
export async function getFlightPrice(
  offer: AmadeusFlightOffer
): Promise<FlightOption> {
  const response = await amadeusPost<AmadeusPricingResponse>(
    "/v1/shopping/flight-offers/pricing",
    {
      data: {
        type: "flight-offers-pricing",
        flightOffers: [offer],
      },
    }
  );

  const pricedOffer = response.data.flightOffers[0];
  return transformOffer(pricedOffer);
}

export { AmadeusApiError };
