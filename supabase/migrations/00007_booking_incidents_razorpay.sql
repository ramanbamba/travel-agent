-- ============================================================================
-- Migration: Booking incidents table + Razorpay payment columns
-- ============================================================================

-- 1. Booking incidents table for tracking payment-booking mismatches
CREATE TABLE IF NOT EXISTS booking_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  user_id UUID REFERENCES auth.users(id),
  incident_type TEXT NOT NULL,
  -- Types: 'payment_booking_mismatch', 'db_save_failed',
  -- 'duffel_timeout', 'refund_failed'
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  duffel_order_id TEXT,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'INR',
  error_message TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add Razorpay columns to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;

-- 3. Enable RLS on booking_incidents
ALTER TABLE booking_incidents ENABLE ROW LEVEL SECURITY;

-- Policy: users can read their own incidents
CREATE POLICY "Users read own incidents"
  ON booking_incidents FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: service role (API routes) can insert
CREATE POLICY "Service can insert incidents"
  ON booking_incidents FOR INSERT
  WITH CHECK (true);

-- Policy: admin can manage all (via service_role)
CREATE POLICY "Service can update incidents"
  ON booking_incidents FOR UPDATE
  USING (true);

-- 4. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_booking_incidents_user
  ON booking_incidents(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_booking_incidents_unresolved
  ON booking_incidents(resolved, created_at DESC)
  WHERE resolved = FALSE;
