import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateMockFlights } from "@/lib/mock/flights";
import type { ApiResponse, ParsedIntent, FlightOption } from "@/types";

// Common airport code mapping for keyword-based parsing
const airportMap: Record<string, string> = {
  "new york": "JFK",
  nyc: "JFK",
  jfk: "JFK",
  lga: "LGA",
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
};

function parseIntent(query: string): ParsedIntent {
  const lower = query.toLowerCase();

  // Check if this is a flight search
  const isFlightSearch =
    /\b(book|fly|flight|travel|trip|go to|head to|from .* to)\b/.test(lower);

  if (!isFlightSearch) {
    return { type: "general", rawQuery: query };
  }

  // Extract origin and destination
  let origin: string | undefined;
  let destination: string | undefined;

  // Pattern: "from X to Y"
  const fromToMatch = lower.match(/from\s+(\w[\w\s]*?)\s+to\s+(\w[\w\s]*?)(?:\s|$|,|\.)/);
  if (fromToMatch) {
    origin = airportMap[fromToMatch[1].trim()] ?? fromToMatch[1].trim().toUpperCase().slice(0, 3);
    destination = airportMap[fromToMatch[2].trim()] ?? fromToMatch[2].trim().toUpperCase().slice(0, 3);
  }

  // Pattern: "to Y" without origin
  if (!destination) {
    const toMatch = lower.match(/(?:to|go to|head to|fly to)\s+(\w[\w\s]*?)(?:\s|$|,|\.)/);
    if (toMatch) {
      destination = airportMap[toMatch[1].trim()] ?? toMatch[1].trim().toUpperCase().slice(0, 3);
    }
  }

  return {
    type: "flight_search",
    origin,
    destination,
    rawQuery: query,
  };
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Unauthorized", message: "You must be logged in" },
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
          "I can help you book flights! Try saying something like \"Book a flight from JFK to London\" or \"Find me a flight to Tokyo.\"",
      },
      error: null,
      message: "Intent parsed",
    });
  }

  // Look up user's home airport as fallback origin
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

  // Generate mock flights — origin and destination are guaranteed set at this point
  const flights = generateMockFlights(
    intent.origin!,
    intent.destination!,
    intent.departureDate
  );

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
      reply: `I found ${flights.length} flights from ${intent.origin} to ${intent.destination}. Here are your options:`,
    },
    error: null,
    message: "Flights found",
  });
}
