import type { SupabaseClient } from "@supabase/supabase-js";

/** Maximum number of users eligible for fee waiver */
const FEE_WAIVER_CAP = 100;

/**
 * Generate a unique referral code for a user.
 * Format: 6 alphanumeric chars, easy to type and share.
 */
export function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 for readability
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Get or create a referral code for a user.
 */
export async function getOrCreateReferralCode(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  // Check if user already has a referral code
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("referral_code")
    .eq("id", userId)
    .single();

  if (profile?.referral_code) return profile.referral_code;

  // Generate a unique code with retry
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode();
    const { error } = await supabase
      .from("user_profiles")
      .update({ referral_code: code })
      .eq("id", userId);

    if (!error) return code;

    // Unique constraint violation — retry with a new code
    if (error.code === "23505") continue;
    throw error;
  }

  throw new Error("Failed to generate unique referral code after 5 attempts");
}

/**
 * Record that a new user signed up via a referral link.
 */
export async function recordReferralSignup(
  supabase: SupabaseClient,
  referralCode: string,
  referredUserId: string
): Promise<{ referrerId: string | null; feeWaiverEligible: boolean }> {
  // Find the referrer
  const { data: referrer } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("referral_code", referralCode)
    .single();

  if (!referrer) return { referrerId: null, feeWaiverEligible: false };

  // Don't allow self-referral
  if (referrer.id === referredUserId) return { referrerId: null, feeWaiverEligible: false };

  // Mark referred_by on the new user's profile
  await supabase
    .from("user_profiles")
    .update({ referred_by: referrer.id })
    .eq("id", referredUserId);

  // Check fee waiver eligibility (first N users)
  const feeWaiverEligible = await checkFeeWaiverEligibility(supabase);

  // Create referral record
  await supabase.from("referrals").insert({
    referrer_id: referrer.id,
    referred_id: referredUserId,
    referral_code: referralCode,
    status: "signed_up",
    converted_at: new Date().toISOString(),
    fee_waiver_applied: feeWaiverEligible,
  });

  return { referrerId: referrer.id, feeWaiverEligible };
}

/**
 * Mark a referral as converted (referred user made their first booking).
 */
export async function recordReferralBooking(
  supabase: SupabaseClient,
  referredUserId: string
): Promise<void> {
  await supabase
    .from("referrals")
    .update({
      status: "booked",
      first_booking_at: new Date().toISOString(),
    })
    .eq("referred_id", referredUserId)
    .eq("status", "signed_up");
}

/**
 * Check if a user is eligible for a fee waiver (was referred + under the cap).
 */
export async function checkFeeWaiverEligibility(
  supabase: SupabaseClient
): Promise<boolean> {
  const { count } = await supabase
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("fee_waiver_applied", true);

  return (count ?? 0) < FEE_WAIVER_CAP;
}

/**
 * Check if a specific user has a fee waiver.
 */
export async function userHasFeeWaiver(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("referrals")
    .select("fee_waiver_applied")
    .eq("referred_id", userId)
    .eq("fee_waiver_applied", true)
    .limit(1);

  return (data?.length ?? 0) > 0;
}

/**
 * Get referral stats for a user (how many people they've referred).
 */
export async function getUserReferralStats(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  referralCode: string;
  totalReferred: number;
  totalConverted: number;
  totalFeeWaiversGiven: number;
}> {
  const [codeResult, statsResult] = await Promise.all([
    getOrCreateReferralCode(supabase, userId),
    supabase
      .from("referrals")
      .select("status, fee_waiver_applied")
      .eq("referrer_id", userId),
  ]);

  const referrals = statsResult.data ?? [];

  return {
    referralCode: codeResult,
    totalReferred: referrals.length,
    totalConverted: referrals.filter((r) => r.status === "booked").length,
    totalFeeWaiversGiven: referrals.filter((r) => r.fee_waiver_applied).length,
  };
}

/**
 * Build the share text for a booking confirmation.
 */
export function buildShareText(params: {
  route: string;
  bookingTimeSec?: number;
  referralCode: string;
  appUrl: string;
}): string {
  const timeText = params.bookingTimeSec
    ? `Booked in ${params.bookingTimeSec} seconds`
    : "Just booked";
  const referralUrl = `${params.appUrl}/r/${params.referralCode}`;
  return `${timeText} on SkySwift! ✈️ ${params.route}\n\nTry it — first 100 users get zero fees:\n${referralUrl}`;
}

/**
 * Build a WhatsApp share URL.
 */
export function buildWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
