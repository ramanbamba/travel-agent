-- ============================================================================
-- Travel Agent — Add Stripe customer ID to user profiles
-- ============================================================================

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;
