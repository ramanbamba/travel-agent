import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserReferralStats } from "@/lib/referrals";
import type { ApiResponse } from "@/types";

/**
 * GET /api/referrals — get current user's referral code + stats.
 */
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

  try {
    const stats = await getUserReferralStats(supabase, user.id);

    return NextResponse.json<ApiResponse>({
      data: stats,
      error: null,
      message: "OK",
    });
  } catch (err) {
    console.error("[referrals] Error:", err);
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: "Failed to load referral data",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
