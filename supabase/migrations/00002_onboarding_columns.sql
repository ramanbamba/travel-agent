-- ============================================================================
-- Travel Agent — Onboarding Wizard: Add missing profile columns
-- ============================================================================

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS middle_name text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS redress_number text;
