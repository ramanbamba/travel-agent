import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recordReferralSignup } from "@/lib/referrals";
import type { ApiResponse } from "@/types";

/**
 * POST /api/referrals/apply — apply a referral code to the current user.
 * Called during direct signup (when email confirmation is disabled).
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

  const { referralCode } = body as { referralCode?: string };

  if (!referralCode || typeof referralCode !== "string") {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Bad request", message: "referralCode is required" },
      { status: 400 }
    );
  }

  const normalized = referralCode.toUpperCase().trim();

  if (normalized.length !== 6) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Bad request", message: "Invalid referral code format" },
      { status: 400 }
    );
  }

  try {
    const result = await recordReferralSignup(supabase, normalized, user.id);

    return NextResponse.json<ApiResponse>({
      data: {
        applied: result.referrerId !== null,
        feeWaiverEligible: result.feeWaiverEligible,
      },
      error: null,
      message: result.referrerId
        ? "Referral applied successfully"
        : "Referral code not found or invalid",
    });
  } catch (err) {
    console.error("[referrals/apply] Error:", err);
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: "Failed to apply referral",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
