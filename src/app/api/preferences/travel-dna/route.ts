import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PreferenceEngine } from "@/lib/intelligence/preference-engine";
import { PreferenceScorer } from "@/lib/intelligence/preference-scoring";
import type { ApiResponse } from "@/types";

export async function GET() {
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

  const engine = new PreferenceEngine(supabase);
  const scorer = new PreferenceScorer(supabase);

  try {
    const [dna, preferences, p3Prefs] = await Promise.all([
      engine.getTravelDNA(user.id),
      engine.getPreferences(user.id),
      scorer.getUserPreferences(user.id),
    ]);

    return NextResponse.json<ApiResponse>({
      data: {
        dna,
        preferences,
        // Phase 3 taste profile data
        tasteProfile: {
          confidenceScores: p3Prefs.confidence_scores,
          temporalPrefs: p3Prefs.temporal_prefs,
          airlinePrefs: p3Prefs.airline_prefs,
          comfortPrefs: p3Prefs.comfort_prefs,
          priceSensitivity: p3Prefs.price_sensitivity,
          contextPatterns: p3Prefs.context_patterns,
          totalBookings: p3Prefs.total_bookings,
          lastBookingAt: p3Prefs.last_booking_at,
        },
      },
      error: null,
      message: "OK",
    });
  } catch (err) {
    console.error("[travel-dna] Error:", err);
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: "Failed to load travel DNA",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
