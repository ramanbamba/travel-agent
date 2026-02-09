-- ============================================================================
-- Travel Agent — Pricing rules table + booking cost breakdown columns
-- ============================================================================

-- ── Pricing rules table ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL DEFAULT 'Default',
  is_active boolean NOT NULL DEFAULT true,

  -- Markup (hidden in displayed fare)
  markup_type text NOT NULL DEFAULT 'percentage' CHECK (markup_type IN ('percentage', 'fixed')),
  markup_value numeric(10,4) NOT NULL DEFAULT 1.5,       -- 1.5% or $1.50
  markup_cap numeric(10,2),                               -- max markup in currency units (null = no cap)

  -- Service fee (visible to customer)
  service_fee_type text NOT NULL DEFAULT 'fixed' CHECK (service_fee_type IN ('percentage', 'fixed')),
  service_fee_value numeric(10,4) NOT NULL DEFAULT 12.00, -- $12 flat or 2%

  -- Concierge fee (optional premium)
  concierge_fee numeric(10,2) NOT NULL DEFAULT 0,

  -- Floor: minimum total (markup + service_fee) we charge
  min_total_fee numeric(10,2) NOT NULL DEFAULT 5.00,

  -- Routing: which flights this rule applies to (null = all)
  -- JSONB shape: { "airlines": ["BA"], "routes": ["LHR-JFK"], "cabins": ["business"] }
  applies_to jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default pricing rule
INSERT INTO public.pricing_rules (name, is_active, markup_type, markup_value, markup_cap, service_fee_type, service_fee_value, min_total_fee)
VALUES ('Default', true, 'percentage', 1.5, 50.00, 'fixed', 12.00, 5.00);

-- RLS: authenticated users can read pricing rules (needed by API routes)
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read pricing rules"
  ON public.pricing_rules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage pricing rules"
  ON public.pricing_rules
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Booking cost breakdown columns ──────────────────────────────────────────

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS supplier_cost_cents integer;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS markup_cents integer;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS service_fee_cents integer;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS our_revenue_cents integer;
