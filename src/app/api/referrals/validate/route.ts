import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";

/**
 * GET /api/referrals/validate?code=XXXXXX — validate a referral code.
 * Used on the signup page to verify the code before creating an account.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.trim().toUpperCase();

  if (!code || code.length !== 6) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Invalid code", message: "Referral code must be 6 characters" },
      { status: 400 }
    );
  }

  const supabase = createClient();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("first_name")
    .eq("referral_code", code)
    .single();

  if (!profile) {
    return NextResponse.json<ApiResponse>(
      { data: { valid: false }, error: null, message: "Invalid referral code" }
    );
  }

  return NextResponse.json<ApiResponse>({
    data: {
      valid: true,
      referrerName: profile.first_name,
    },
    error: null,
    message: "Valid referral code",
  });
}
