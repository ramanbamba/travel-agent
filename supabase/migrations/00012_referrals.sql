-- ============================================================================
-- Migration 00012: Referral system for growth loop
-- ============================================================================

-- Add referral_code to user_profiles (unique per user)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES user_profiles(id);

-- Referrals tracking table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id),
  referred_id UUID REFERENCES auth.users(id),
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'signed_up', 'booked', 'rewarded')),
  fee_waiver_applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  converted_at TIMESTAMPTZ,
  first_booking_at TIMESTAMPTZ
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_code ON user_profiles(referral_code);

-- RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Users can see their own referrals (as referrer)
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id);

-- Users can see referrals where they are the referred user
CREATE POLICY "Users can view referrals they received"
  ON referrals FOR SELECT
  USING (auth.uid() = referred_id);

-- Service role can do everything (for API routes)
CREATE POLICY "Service role full access on referrals"
  ON referrals FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Fee waiver counter view (how many users have received fee waivers)
CREATE OR REPLACE VIEW referral_stats AS
SELECT
  COUNT(*) FILTER (WHERE fee_waiver_applied = TRUE) AS total_fee_waivers,
  COUNT(*) FILTER (WHERE status = 'booked') AS total_converted,
  COUNT(*) AS total_referrals
FROM referrals;
