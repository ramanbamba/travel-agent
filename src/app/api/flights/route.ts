import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchFlights, AmadeusApiError } from "@/lib/amadeus/flights";
import type { ApiResponse, FlightOption } from "@/types";

export async function GET(request: NextRequest) {
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

  const { searchParams } = request.nextUrl;
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const departureDate = searchParams.get("departureDate");
  const adults = searchParams.get("adults");
  const cabinClass = searchParams.get("cabinClass");

  if (!origin || !destination || !departureDate) {
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: "Bad request",
        message: "origin, destination, and departureDate are required",
      },
      { status: 400 }
    );
  }

  try {
    const flights = await searchFlights({
      origin,
      destination,
      departureDate,
      adults: adults ? parseInt(adults) : 1,
      cabinClass: cabinClass as "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST" | undefined,
    });

    return NextResponse.json<ApiResponse<FlightOption[]>>({
      data: flights,
      error: null,
      message: flights.length > 0 ? "Flights found" : "No flights found",
    });
  } catch (err) {
    const message =
      err instanceof AmadeusApiError
        ? err.message
        : "Flight search failed";

    return NextResponse.json<ApiResponse>(
      { data: null, error: message, message: "Flight search error" },
      { status: err instanceof AmadeusApiError ? err.status : 500 }
    );
  }
}
