import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";
import type { OnboardingQuestionKey } from "@/types/preferences";

/**
 * POST /api/preferences/onboarding
 *
 * Saves the 5-question conversational onboarding responses.
 * Body: { responses: Record<OnboardingQuestionKey, string> }
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

  let body: { responses?: Record<string, string> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Invalid JSON", message: "Request body must be valid JSON" },
      { status: 400 }
    );
  }

  const { responses } = body;
  if (!responses || typeof responses !== "object") {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Bad request", message: "responses object is required" },
      { status: 400 }
    );
  }

  const validKeys: OnboardingQuestionKey[] = [
    "time_vs_price",
    "airline_loyalty",
    "frequency",
    "seat_pref",
    "baggage",
  ];

  try {
    // Upsert each response (unique on user_id + question_key)
    const rows = Object.entries(responses)
      .filter(([key]) => validKeys.includes(key as OnboardingQuestionKey))
      .map(([key, value]) => ({
        user_id: user.id,
        question_key: key,
        response: JSON.stringify(value),
      }));

    if (rows.length > 0) {
      const { error } = await supabase
        .from("onboarding_responses")
        .upsert(rows, { onConflict: "user_id,question_key" });

      if (error) {
        console.error("[preferences/onboarding] Upsert error:", error.message);
        return NextResponse.json<ApiResponse>(
          { data: null, error: error.message, message: "Failed to save responses" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json<ApiResponse>({
      data: { saved: rows.length },
      error: null,
      message: `Saved ${rows.length} onboarding responses`,
    });
  } catch (err) {
    console.error("[preferences/onboarding] Error:", err);
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: "Server error",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
