import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchFlightsCompat } from "@/lib/supply";
import type { ApiResponse, ParsedIntent, FlightOption } from "@/types";

// ── Simple in-memory cache (5 min TTL) ──────────────────────────────────────

interface CacheEntry {
  flights: FlightOption[];
  timestamp: number;
}

const flightCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCacheKey(origin: string, destination: string, date: string): string {
  return `${origin}-${destination}-${date}`;
}

function getCached(key: string): FlightOption[] | null {
  const entry = flightCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    flightCache.delete(key);
    return null;
  }
  return entry.flights;
}

function setCache(key: string, flights: FlightOption[]) {
  // Cap cache size
  if (flightCache.size > 100) {
    const oldest = flightCache.keys().next().value;
    if (oldest) flightCache.delete(oldest);
  }
  flightCache.set(key, { flights, timestamp: Date.now() });
}

// ── Airport code mapping ────────────────────────────────────────────────────

const airportMap: Record<string, string> = {
  "new york": "JFK",
  nyc: "JFK",
  jfk: "JFK",
  lga: "LGA",
  ewr: "EWR",
  london: "LHR",
  lhr: "LHR",
  heathrow: "LHR",
  "los angeles": "LAX",
  la: "LAX",
  lax: "LAX",
  "san francisco": "SFO",
  sfo: "SFO",
  chicago: "ORD",
  ord: "ORD",
  miami: "MIA",
  mia: "MIA",
  tokyo: "NRT",
  nrt: "NRT",
  hnd: "HND",
  paris: "CDG",
  cdg: "CDG",
  dubai: "DXB",
  dxb: "DXB",
  singapore: "SIN",
  sin: "SIN",
  sydney: "SYD",
  syd: "SYD",
  boston: "BOS",
  bos: "BOS",
  seattle: "SEA",
  sea: "SEA",
  atlanta: "ATL",
  atl: "ATL",
  denver: "DEN",
  den: "DEN",
  dallas: "DFW",
  dfw: "DFW",
  "washington": "IAD",
  iad: "IAD",
  dca: "DCA",
  orlando: "MCO",
  mco: "MCO",
  "las vegas": "LAS",
  las: "LAS",
  toronto: "YYZ",
  yyz: "YYZ",
  frankfurt: "FRA",
  fra: "FRA",
  amsterdam: "AMS",
  ams: "AMS",
  madrid: "MAD",
  mad: "MAD",
  rome: "FCO",
  fco: "FCO",
  "hong kong": "HKG",
  hkg: "HKG",
  mumbai: "BOM",
  bom: "BOM",
  delhi: "DEL",
  del: "DEL",
  bangkok: "BKK",
  bkk: "BKK",
};

// ── Date parsing ────────────────────────────────────────────────────────────

function parseDate(query: string): string | undefined {
  const lower = query.toLowerCase();

  // Explicit date formats: "march 15", "15 march", "3/15", "2026-03-15"
  const monthNames: Record<string, number> = {
    january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3,
    april: 4, apr: 4, may: 5, june: 6, jun: 6, july: 7, jul: 7,
    august: 8, aug: 8, september: 9, sep: 9, october: 10, oct: 10,
    november: 11, nov: 11, december: 12, dec: 12,
  };

  // "march 15" or "march 15th"
  const monthDayMatch = lower.match(
    /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|october|oct|november|nov|december|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\b/
  );
  if (monthDayMatch) {
    const month = monthNames[monthDayMatch[1]];
    const day = parseInt(monthDayMatch[2]);
    const year = new Date().getFullYear();
    const date = new Date(year, month - 1, day);
    // If the date is in the past, assume next year
    if (date < new Date()) date.setFullYear(year + 1);
    return date.toISOString().split("T")[0];
  }

  // "15 march" or "15th march"
  const dayMonthMatch = lower.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|october|oct|november|nov|december|dec)\b/
  );
  if (dayMonthMatch) {
    const day = parseInt(dayMonthMatch[1]);
    const month = monthNames[dayMonthMatch[2]];
    const year = new Date().getFullYear();
    const date = new Date(year, month - 1, day);
    if (date < new Date()) date.setFullYear(year + 1);
    return date.toISOString().split("T")[0];
  }

  // Relative dates
  if (/\btomorrow\b/.test(lower)) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }
  if (/\bnext week\b/.test(lower)) {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  }
  if (/\bnext month\b/.test(lower)) {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split("T")[0];
  }

  // "in X days"
  const inDaysMatch = lower.match(/\bin\s+(\d+)\s+days?\b/);
  if (inDaysMatch) {
    const d = new Date();
    d.setDate(d.getDate() + parseInt(inDaysMatch[1]));
    return d.toISOString().split("T")[0];
  }

  return undefined;
}

// ── Intent parsing ──────────────────────────────────────────────────────────

function parseIntent(query: string): ParsedIntent {
  const lower = query.toLowerCase();

  const isFlightSearch =
    /\b(book|fly|flight|travel|trip|go to|head to|from .* to|ticket)\b/.test(lower);

  if (!isFlightSearch) {
    return { type: "general", rawQuery: query };
  }

  let origin: string | undefined;
  let destination: string | undefined;

  // "from X to Y"
  const fromToMatch = lower.match(
    /from\s+(\w[\w\s]*?)\s+to\s+(\w[\w\s]*?)(?:\s|$|,|\.)/
  );
  if (fromToMatch) {
    origin =
      airportMap[fromToMatch[1].trim()] ??
      fromToMatch[1].trim().toUpperCase().slice(0, 3);
    destination =
      airportMap[fromToMatch[2].trim()] ??
      fromToMatch[2].trim().toUpperCase().slice(0, 3);
  }

  // "to Y" without origin
  if (!destination) {
    const toMatch = lower.match(
      /(?:to|go to|head to|fly to)\s+(\w[\w\s]*?)(?:\s|$|,|\.)/
    );
    if (toMatch) {
      destination =
        airportMap[toMatch[1].trim()] ??
        toMatch[1].trim().toUpperCase().slice(0, 3);
    }
  }

  const departureDate = parseDate(query);

  return {
    type: "flight_search",
    origin,
    destination,
    departureDate,
    rawQuery: query,
  };
}

// ── Suggest nearby dates helper ─────────────────────────────────────────────

function suggestNearbyDates(dateStr: string): string[] {
  const d = new Date(dateStr);
  const suggestions: string[] = [];
  for (const offset of [-1, 1, -2, 2]) {
    const nd = new Date(d);
    nd.setDate(nd.getDate() + offset);
    if (nd > new Date()) {
      suggestions.push(nd.toISOString().split("T")[0]);
    }
  }
  return suggestions.slice(0, 2);
}

// ── Route handler ───────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: "Unauthorized",
        message: "You must be logged in",
      },
      { status: 401 }
    );
  }

  const body = await request.json();
  const message = body.message as string;

  if (!message || typeof message !== "string") {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Bad request", message: "Message is required" },
      { status: 400 }
    );
  }

  const intent = parseIntent(message);

  if (intent.type === "general") {
    return NextResponse.json<
      ApiResponse<{ intent: ParsedIntent; reply: string }>
    >({
      data: {
        intent,
        reply:
          'I can help you book flights! Try saying something like "Book a flight from JFK to London" or "Find me a flight to Tokyo next week."',
      },
      error: null,
      message: "Intent parsed",
    });
  }

  // Resolve origin from profile if not specified
  if (!intent.origin) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("home_airport")
      .eq("id", user.id)
      .single();

    intent.origin = profile?.home_airport ?? "JFK";
  }

  if (!intent.destination) {
    return NextResponse.json<
      ApiResponse<{ intent: ParsedIntent; reply: string }>
    >({
      data: {
        intent,
        reply:
          "I'd love to help! Where would you like to fly to? Just name a city or airport.",
      },
      error: null,
      message: "Need destination",
    });
  }

  // At this point, origin and destination are guaranteed set
  const origin = intent.origin!;
  const destination = intent.destination!;

  // Default to 1 week from now if no date parsed
  const departureDate =
    intent.departureDate ??
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

  // Check cache
  const cacheKey = getCacheKey(origin, destination, departureDate);
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json<
      ApiResponse<{
        intent: ParsedIntent;
        flights: FlightOption[];
        reply: string;
      }>
    >({
      data: {
        intent,
        flights: cached,
        reply: `I found ${cached.length} flight${cached.length !== 1 ? "s" : ""} from ${origin} to ${destination} on ${departureDate}:`,
      },
      error: null,
      message: "Flights found (cached)",
    });
  }

  // Search via supply layer (handles fallback automatically)
  const { flights, source } = await searchFlightsCompat({
    origin,
    destination,
    departureDate,
    adults: intent.passengers ?? 1,
  });

  if (flights.length > 0) {
    setCache(cacheKey, flights);
  }

  // No flights found — suggest nearby dates
  if (flights.length === 0) {
    const nearby = suggestNearbyDates(departureDate);
    const suggestion =
      nearby.length > 0
        ? ` Try nearby dates: ${nearby.join(" or ")}.`
        : " Try a different date or route.";

    return NextResponse.json<
      ApiResponse<{ intent: ParsedIntent; reply: string }>
    >({
      data: {
        intent,
        reply: `No flights found from ${origin} to ${destination} on ${departureDate}.${suggestion}`,
      },
      error: null,
      message: "No flights found",
    });
  }

  const dateLabel = departureDate;
  const sourceNote = source === "mock" ? " (sample results — live search temporarily unavailable)" : "";

  return NextResponse.json<
    ApiResponse<{
      intent: ParsedIntent;
      flights: FlightOption[];
      reply: string;
    }>
  >({
    data: {
      intent,
      flights,
      reply: `I found ${flights.length} flight${flights.length !== 1 ? "s" : ""} from ${origin} to ${destination} on ${dateLabel}${sourceNote}:`,
    },
    error: null,
    message: "Flights found",
  });
}
