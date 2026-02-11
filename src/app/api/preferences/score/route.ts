import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PreferenceScorer } from "@/lib/intelligence/preference-scoring";
import type { FlightOffer } from "@/lib/supply/types";
import type { ApiResponse } from "@/types";
import type { P3Recommendation } from "@/lib/intelligence/preference-scoring";

/**
 * POST /api/preferences/score
 *
 * Score and rank flight offers against the user's preference vector + Flight DNA.
 * Body: { route: "BLR-DEL", offers: FlightOffer[] }
 * Returns: P3Recommendation with ranked offers, scores, and confidence %.
 */
export async function POST(request: NextRequest) {
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

  let body: { route?: string; offers?: FlightOffer[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Invalid JSON", message: "Request body must be valid JSON" },
      { status: 400 }
    );
  }

  const { route, offers } = body;
  if (!route || !offers || !Array.isArray(offers) || offers.length === 0) {
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: "Bad request",
        message: "route (string) and offers (non-empty array) are required",
      },
      { status: 400 }
    );
  }

  try {
    const scorer = new PreferenceScorer(supabase);
    const recommendation = await scorer.scoreOffers(user.id, route, offers);

    return NextResponse.json<ApiResponse<P3Recommendation>>({
      data: recommendation,
      error: null,
      message: `Scored ${recommendation.totalScored} offers, returning top ${recommendation.offers.length}`,
    });
  } catch (err) {
    console.error("[preferences/score] Error:", err);
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: "Scoring failed",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
