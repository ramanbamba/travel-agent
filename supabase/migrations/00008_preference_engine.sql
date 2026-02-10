-- ============================================================================
-- Migration: Preference Engine tables
-- user_travel_preferences, booking_patterns, route_familiarity, abandoned_searches
-- ============================================================================

-- 1. Core preferences learned over time
CREATE TABLE IF NOT EXISTS user_travel_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  home_airport TEXT DEFAULT 'BLR',
  preferred_airlines JSONB DEFAULT '[]',
  -- Ranked list: [{"code": "6E", "name": "IndiGo", "score": 0.85}, ...]
  preferred_departure_windows JSONB DEFAULT '{}',
  -- By day: {"monday": "early_morning", "friday": "late_evening"}
  seat_preference TEXT DEFAULT 'aisle',
  cabin_class TEXT DEFAULT 'economy',
  meal_preference TEXT,
  bag_preference TEXT DEFAULT 'cabin_only',
  price_sensitivity FLOAT DEFAULT 0.5,
  -- 0.0 = always cheapest, 0.5 = balanced, 1.0 = ignores price
  advance_booking_days_avg FLOAT DEFAULT 7,
  communication_style TEXT DEFAULT 'balanced',
  -- 'concise', 'balanced', 'detailed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Every booking creates a pattern entry
CREATE TABLE IF NOT EXISTS booking_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  route TEXT NOT NULL,
  -- Format: 'BLR-DEL' (ORIGIN-DESTINATION)
  airline_code TEXT,
  airline_name TEXT,
  flight_number TEXT,
  departure_time TIME,
  arrival_time TIME,
  day_of_week INTEGER,
  -- 0=Sunday, 1=Monday, ... 6=Saturday
  price_paid DECIMAL(10,2),
  currency TEXT DEFAULT 'INR',
  cabin_class TEXT DEFAULT 'economy',
  seat_selected TEXT,
  seat_type TEXT,
  bags_added INTEGER DEFAULT 0,
  days_before_departure INTEGER,
  booking_source TEXT DEFAULT 'chat',
  duffel_offer_id TEXT,
  duffel_order_id TEXT,
  booking_completed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Aggregated per-route intelligence
CREATE TABLE IF NOT EXISTS route_familiarity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  route TEXT NOT NULL,
  times_booked INTEGER DEFAULT 0,
  last_booked_at TIMESTAMPTZ,
  avg_price_paid DECIMAL(10,2),
  min_price_paid DECIMAL(10,2),
  max_price_paid DECIMAL(10,2),
  preferred_airline_code TEXT,
  preferred_airline_name TEXT,
  preferred_flight_number TEXT,
  preferred_departure_window TEXT,
  avg_days_before_departure FLOAT,
  familiarity_level TEXT DEFAULT 'discovery',
  -- 'discovery' (0-2), 'learning' (3-5), 'autopilot' (6+)
  UNIQUE(user_id, route),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tracks what users searched but didn't book (negative signal)
CREATE TABLE IF NOT EXISTS abandoned_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  route TEXT,
  search_date DATE,
  offers_shown INTEGER,
  time_spent_seconds INTEGER,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable RLS on all tables
ALTER TABLE user_travel_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_familiarity ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandoned_searches ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies: users can only see/modify their own data
CREATE POLICY "Users manage own preferences" ON user_travel_preferences
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own patterns" ON booking_patterns
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own familiarity" ON route_familiarity
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own searches" ON abandoned_searches
  FOR ALL USING (auth.uid() = user_id);

-- Service role insert policies (for API routes)
CREATE POLICY "Service insert patterns" ON booking_patterns
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert familiarity" ON route_familiarity
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update familiarity" ON route_familiarity
  FOR UPDATE USING (true);
CREATE POLICY "Service insert preferences" ON user_travel_preferences
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update preferences" ON user_travel_preferences
  FOR UPDATE USING (true);

-- 7. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_booking_patterns_user_route
  ON booking_patterns(user_id, route);
CREATE INDEX IF NOT EXISTS idx_route_familiarity_user_route
  ON route_familiarity(user_id, route);
CREATE INDEX IF NOT EXISTS idx_booking_patterns_created
  ON booking_patterns(created_at DESC);
