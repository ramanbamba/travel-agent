import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PreferenceEngine } from "@/lib/intelligence/preference-engine";
import { PreferenceScorer } from "@/lib/intelligence/preference-scoring";
import type { ApiResponse } from "@/types";

/**
 * POST /api/preferences/seed
 *
 * Seed initial preferences from onboarding data.
 * Called once when user completes onboarding.
 * Seeds both Phase 2 (user_travel_preferences) and Phase 3 (user_preferences).
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

  const { homeAirport, seatPreference, loyaltyAirlines, chatResponses } =
    body as {
      homeAirport?: string;
      seatPreference?: string;
      loyaltyAirlines?: Array<{ code: string; name: string }>;
      /** Phase 3: onboarding chat responses */
      chatResponses?: Record<string, string>;
    };

  try {
    // Phase 2: seed user_travel_preferences
    const engine = new PreferenceEngine(supabase);
    await engine.seedFromOnboarding(user.id, {
      homeAirport,
      seatPreference,
      loyaltyAirlines,
    });

    // Phase 3: seed user_preferences from chat onboarding (P3-05)
    if (chatResponses) {
      const scorer = new PreferenceScorer(supabase);
      await scorer.seedFromOnboarding(user.id, {
        responses: {
          time_vs_price: chatResponses.time_vs_price ?? "balanced",
          airline_loyalty: chatResponses.airline_loyalty ?? "any",
          frequency: chatResponses.frequency ?? "monthly",
          seat_pref: chatResponses.seat_pref ?? "no_preference",
          baggage: chatResponses.baggage ?? "cabin_only",
        },
        loyaltyAirlines,
        homeAirport,
      });
    } else {
      // No chat responses — read from onboarding_responses table (if saved by P3-04)
      const { data: savedResponses } = await supabase
        .from("onboarding_responses")
        .select("question_key, response")
        .eq("user_id", user.id);

      if (savedResponses && savedResponses.length > 0) {
        const responseMap: Record<string, string> = {};
        for (const row of savedResponses) {
          // response is stored as JSON string
          try {
            responseMap[row.question_key] = JSON.parse(row.response);
          } catch {
            responseMap[row.question_key] = String(row.response);
          }
        }

        const scorer = new PreferenceScorer(supabase);
        await scorer.seedFromOnboarding(user.id, {
          responses: {
            time_vs_price: responseMap.time_vs_price ?? "balanced",
            airline_loyalty: responseMap.airline_loyalty ?? "any",
            frequency: responseMap.frequency ?? "monthly",
            seat_pref: responseMap.seat_pref ?? seatPreference ?? "no_preference",
            baggage: responseMap.baggage ?? "cabin_only",
          },
          loyaltyAirlines,
          homeAirport,
        });
      }
    }

    return NextResponse.json<ApiResponse>({
      data: { seeded: true },
      error: null,
      message: "Preferences seeded (Phase 2 + Phase 3)",
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
