import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";
import type { FlightDNARow } from "@/types/preferences";

/**
 * GET /api/flights/dna?route=BLR-DEL
 *
 * Returns curated Flight DNA data for a route.
 * Used to enrich flight search results with product intelligence:
 * aircraft type, seat pitch, Wi-Fi, on-time %, food rating, etc.
 *
 * Optional query params:
 *   - route: "BLR-DEL" (required)
 *   - airline: "6E" (optional filter)
 *   - flight: "6E-302" (optional filter for specific flight)
 */
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

  const { searchParams } = new URL(request.url);
  const route = searchParams.get("route");
  const airline = searchParams.get("airline");
  const flight = searchParams.get("flight");

  if (!route) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Bad request", message: "route query param is required (e.g. BLR-DEL)" },
      { status: 400 }
    );
  }

  try {
    let query = supabase
      .from("flight_dna")
      .select("*")
      .eq("route", route.toUpperCase());

    if (airline) {
      query = query.eq("airline_code", airline.toUpperCase());
    }

    if (flight) {
      query = query.eq("flight_number", flight);
    }

    const { data, error } = await query.order("ontime_pct", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json<ApiResponse<FlightDNARow[]>>({
      data: (data as FlightDNARow[]) ?? [],
      error: null,
      message: `Found ${data?.length ?? 0} Flight DNA entries for ${route}`,
    });
  } catch (err) {
    console.error("[flights/dna] Error:", err);
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: "Failed to fetch Flight DNA",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
