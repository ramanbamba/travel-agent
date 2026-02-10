import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PreferenceEngine } from "@/lib/intelligence/preference-engine";
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

  try {
    const [dna, preferences] = await Promise.all([
      engine.getTravelDNA(user.id),
      engine.getPreferences(user.id),
    ]);

    return NextResponse.json<ApiResponse>({
      data: { dna, preferences },
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
