import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PreferenceEngine } from "@/lib/intelligence/preference-engine";
import type { ApiResponse } from "@/types";

/**
 * Seed initial preferences from onboarding data.
 * Called once when user completes onboarding.
 */
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

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Bad request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { homeAirport, seatPreference, loyaltyAirlines } = body as {
    homeAirport?: string;
    seatPreference?: string;
    loyaltyAirlines?: Array<{ code: string; name: string }>;
  };

  const engine = new PreferenceEngine(supabase);

  try {
    await engine.seedFromOnboarding(user.id, {
      homeAirport,
      seatPreference,
      loyaltyAirlines,
    });

    return NextResponse.json<ApiResponse>({
      data: { seeded: true },
      error: null,
      message: "Preferences seeded",
    });
  } catch (err) {
    console.error("[preferences/seed] Error:", err);
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: "Failed to seed preferences",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
