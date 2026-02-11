-- ============================================================================
-- Migration 00010: Phase 3 — Preference Engine Schema
-- New tables: user_preferences, onboarding_responses, flight_dna,
--             booking_feedback, failed_intents
-- ============================================================================

-- ============================================================================
-- 1. user_preferences — Living taste profile (THE MOAT)
--    JSON fields per category with confidence scores (0.0–1.0)
--    Mirrors PRD Section 3.2 / 5.2
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Temporal preferences
  -- { "departure_windows": { "monday": "early_morning", "friday": "late_evening" },
  --   "booking_lead_time_avg": 9,
  --   "preferred_trip_duration_days": 4 }
  temporal_prefs JSONB NOT NULL DEFAULT '{}',

  -- Airline preferences
  -- { "preferred": [{ "code": "6E", "name": "IndiGo", "score": 0.85 }],
  --   "avoided": [{ "code": "AI", "reason": "frequent delays" }],
  --   "loyalty_programs": ["6E"] }
  airline_prefs  JSONB NOT NULL DEFAULT '{}',

  -- Comfort preferences
  -- { "seat_type": "aisle", "cabin_class": "economy",
  --   "meal_preference": "vegetarian", "baggage": "cabin_only",
  --   "wifi_important": true }
  comfort_prefs  JSONB NOT NULL DEFAULT '{}',

  -- Price sensitivity
  -- { "sensitivity_score": 0.5, "premium_willingness": false,
  --   "price_anchors": { "BLR-DEL": 5000, "BLR-MUM": 4500 } }
  price_sensitivity JSONB NOT NULL DEFAULT '{}',

  -- Context patterns (business vs leisure, seasonal)
  -- { "primary_mode": "business",
  --   "day_patterns": { "monday": "business", "saturday": "leisure" },
  --   "seasonal_patterns": {} }
  context_patterns JSONB NOT NULL DEFAULT '{}',

  -- Confidence scores per category (0.0–1.0)
  -- { "temporal": 0.0, "airline": 0.0, "comfort": 0.0,
  --   "price": 0.0, "context": 0.0, "overall": 0.0 }
  confidence_scores JSONB NOT NULL DEFAULT '{"temporal": 0.0, "airline": 0.0, "comfort": 0.0, "price": 0.0, "context": 0.0, "overall": 0.0}',

  -- Aggregated metadata
  total_bookings    INTEGER NOT NULL DEFAULT 0,
  last_booking_at   TIMESTAMPTZ,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. onboarding_responses — Initial 5-question preference questionnaire
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.onboarding_responses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_key  TEXT NOT NULL,        -- e.g. 'time_vs_price', 'airline_loyalty', 'frequency', 'seat_pref', 'baggage'
  response      JSONB NOT NULL,       -- flexible: could be string, object, array
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, question_key)       -- one answer per question per user
);

-- ============================================================================
-- 3. flight_dna — Rich product data per flight/route
--    Manually curated for ICP routes (Routehappy equivalent)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.flight_dna (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airline_code   TEXT NOT NULL,        -- IATA carrier code: '6E', 'AI', 'UK'
  route          TEXT NOT NULL,        -- 'BLR-DEL', 'BLR-MUM'
  flight_number  TEXT,                 -- '6E-302', 'AI-505'
  aircraft_type  TEXT,                 -- 'A320neo', 'B737-800'
  seat_pitch     INTEGER,             -- inches, e.g. 30
  wifi           BOOLEAN DEFAULT FALSE,
  ontime_pct     FLOAT,               -- 0.0–100.0, e.g. 95.2
  food_rating    FLOAT,               -- 1.0–5.0 stars
  power_outlets  BOOLEAN DEFAULT FALSE,
  entertainment  TEXT,                 -- 'personal_screen', 'streaming', 'none'
  baggage_included TEXT,               -- 'cabin_only', '15kg', '25kg'
  notes          TEXT,                 -- any extra info
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(airline_code, route, flight_number)
);

-- ============================================================================
-- 4. booking_feedback — Post-booking preference signals
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.booking_feedback (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_type   TEXT NOT NULL,         -- 'accepted_recommendation', 'rejected_recommendation', 'chose_different_airline', 'price_objection'
  signal_value  JSONB DEFAULT '{}',    -- { "reason": "too expensive", "chosen_alternative": "6E-303" }
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. failed_intents — What users tried that we couldn't do
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.failed_intents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  raw_input       TEXT NOT NULL,
  parsed_intent   JSONB,
  failure_reason  TEXT NOT NULL,        -- 'no_flights', 'unsupported_route', 'parse_error', 'supplier_error'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 6. ROW-LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.user_preferences    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_dna          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_feedback    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failed_intents      ENABLE ROW LEVEL SECURITY;

-- user_preferences: users own their data
CREATE POLICY "Users manage own preferences (p3)"
  ON public.user_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Service role can upsert preferences (API routes)
CREATE POLICY "Service role manages preferences (p3)"
  ON public.user_preferences FOR ALL
  USING (true) WITH CHECK (true);

-- onboarding_responses: users own their data
CREATE POLICY "Users manage own onboarding responses"
  ON public.onboarding_responses FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages onboarding responses"
  ON public.onboarding_responses FOR ALL
  USING (true) WITH CHECK (true);

-- flight_dna: read-only for all authenticated users (curated data)
CREATE POLICY "Authenticated users can read flight DNA"
  ON public.flight_dna FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service role manages flight DNA"
  ON public.flight_dna FOR ALL
  USING (true) WITH CHECK (true);

-- booking_feedback: users own their data
CREATE POLICY "Users manage own booking feedback"
  ON public.booking_feedback FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages booking feedback"
  ON public.booking_feedback FOR ALL
  USING (true) WITH CHECK (true);

-- failed_intents: users can see their own, service role manages all
CREATE POLICY "Users can view own failed intents"
  ON public.failed_intents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages failed intents"
  ON public.failed_intents FOR ALL
  USING (true) WITH CHECK (true);

-- ============================================================================
-- 7. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id
  ON public.user_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_responses_user_id
  ON public.onboarding_responses(user_id);

CREATE INDEX IF NOT EXISTS idx_flight_dna_route
  ON public.flight_dna(route);

CREATE INDEX IF NOT EXISTS idx_flight_dna_airline_route
  ON public.flight_dna(airline_code, route);

CREATE INDEX IF NOT EXISTS idx_flight_dna_flight_number
  ON public.flight_dna(flight_number) WHERE flight_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_booking_feedback_user_id
  ON public.booking_feedback(user_id);

CREATE INDEX IF NOT EXISTS idx_booking_feedback_order_id
  ON public.booking_feedback(order_id) WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_failed_intents_user_id
  ON public.failed_intents(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_failed_intents_created
  ON public.failed_intents(created_at DESC);

-- ============================================================================
-- 8. AUTO-UPDATE updated_at TRIGGERS
-- ============================================================================

CREATE TRIGGER handle_updated_at_user_preferences
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

CREATE TRIGGER handle_updated_at_flight_dna
  BEFORE UPDATE ON public.flight_dna
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);
