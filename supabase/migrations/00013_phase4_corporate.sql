-- ============================================================================
-- Phase 4 — Corporate Multi-Tenant Foundation
-- Adds: organizations, org_members, travel_policies, corp_bookings,
--        approval_requests, gst_invoices, traveler_preferences,
--        whatsapp_sessions, booking_analytics, whatsapp_message_log
-- ============================================================================

-- ============================================================
-- ORGANIZATION & MULTI-TENANCY
-- ============================================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT,
  logo_url TEXT,
  industry TEXT,
  employee_count_range TEXT,
  annual_travel_spend_range TEXT,
  -- GST Details
  gstin TEXT,
  gst_state_code TEXT,
  billing_address JSONB,
  -- Settings
  default_currency TEXT DEFAULT 'INR',
  timezone TEXT DEFAULT 'Asia/Kolkata',
  -- Subscription
  plan TEXT DEFAULT 'free',
  plan_started_at TIMESTAMPTZ,
  monthly_booking_limit INTEGER DEFAULT 20,
  -- Meta
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Profile
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  whatsapp_registered BOOLEAN DEFAULT FALSE,
  employee_id TEXT,
  department TEXT,
  designation TEXT,
  seniority_level TEXT DEFAULT 'individual_contributor',
  -- Org role
  role TEXT DEFAULT 'employee',
  reports_to UUID REFERENCES org_members(id),
  -- Status
  status TEXT DEFAULT 'invited',
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, email)
);

-- ============================================================
-- TRAVEL POLICY ENGINE
-- ============================================================

CREATE TABLE travel_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Default Policy',
  is_active BOOLEAN DEFAULT TRUE,
  -- Flight rules
  flight_rules JSONB DEFAULT '{
    "domestic_cabin_class": {
      "default": "economy",
      "overrides": [
        {"seniority": ["director", "vp", "c_suite"], "allowed": ["economy", "premium_economy", "business"]}
      ]
    },
    "max_flight_price": {
      "domestic": null,
      "international": null
    },
    "advance_booking_days": {
      "minimum": 0,
      "recommended": 7,
      "early_booking_discount_message": true
    },
    "preferred_airlines": [],
    "blocked_airlines": [],
    "allow_refundable_only": false,
    "max_stops": 1,
    "flight_duration_limit_hours": null
  }',
  -- Hotel rules (future)
  hotel_rules JSONB DEFAULT '{}',
  -- Spend limits
  spend_limits JSONB DEFAULT '{
    "per_trip_limit": null,
    "per_month_limit": null,
    "by_seniority": {}
  }',
  -- Approval rules
  approval_rules JSONB DEFAULT '{
    "auto_approve_under": null,
    "require_approval_over": 0,
    "out_of_policy_requires": "travel_manager",
    "approval_timeout_hours": 24,
    "auto_escalate_on_timeout": true
  }',
  -- Behavior
  policy_mode TEXT DEFAULT 'soft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CORPORATE BOOKINGS
-- ============================================================

CREATE TABLE corp_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES org_members(id) NOT NULL,
  booked_by UUID REFERENCES org_members(id),
  -- Trip details
  trip_type TEXT DEFAULT 'one_way',
  purpose TEXT,
  purpose_note TEXT,
  project_code TEXT,
  cost_center TEXT,
  -- Booking details
  booking_channel TEXT DEFAULT 'whatsapp',
  duffel_order_id TEXT,
  pnr TEXT,
  status TEXT DEFAULT 'pending',
  -- Flight details
  flight_details JSONB NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE,
  cabin_class TEXT,
  airline_code TEXT,
  airline_name TEXT,
  -- Policy compliance
  policy_compliant BOOLEAN DEFAULT TRUE,
  policy_violations JSONB DEFAULT '[]',
  policy_override_reason TEXT,
  policy_override_by UUID REFERENCES org_members(id),
  -- Financial
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  payment_method TEXT,
  payment_id TEXT,
  -- GST
  gst_invoice_number TEXT,
  gst_invoice_url TEXT,
  gst_amount DECIMAL(10,2),
  gst_itc_eligible BOOLEAN DEFAULT TRUE,
  -- Approval
  approval_status TEXT DEFAULT 'auto_approved',
  approved_by UUID REFERENCES org_members(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approval requests
CREATE TABLE approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES corp_bookings(id) NOT NULL,
  requester_id UUID REFERENCES org_members(id) NOT NULL,
  approver_id UUID REFERENCES org_members(id) NOT NULL,
  status TEXT DEFAULT 'pending',
  message TEXT,
  response_message TEXT,
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  notified_via TEXT DEFAULT 'whatsapp',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GST COMPLIANCE
-- ============================================================

CREATE TABLE gst_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES corp_bookings(id),
  -- Invoice details
  invoice_number TEXT,
  invoice_date DATE,
  vendor_name TEXT NOT NULL,
  vendor_gstin TEXT,
  -- Amounts
  base_amount DECIMAL(10,2),
  cgst_amount DECIMAL(10,2) DEFAULT 0,
  sgst_amount DECIMAL(10,2) DEFAULT 0,
  igst_amount DECIMAL(10,2) DEFAULT 0,
  total_gst DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  -- ITC
  itc_eligible BOOLEAN DEFAULT TRUE,
  itc_claimed BOOLEAN DEFAULT FALSE,
  itc_claim_period TEXT,
  -- SAC code
  sac_code TEXT DEFAULT '996411',
  -- Source
  source TEXT DEFAULT 'auto',
  raw_invoice_url TEXT,
  -- Reconciliation
  reconciled BOOLEAN DEFAULT FALSE,
  reconciled_with TEXT,
  exported_to TEXT,
  exported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRAVELER PREFERENCES (org-scoped, Phase 4)
-- ============================================================

CREATE TABLE traveler_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES org_members(id) ON DELETE CASCADE NOT NULL,
  -- Preferences
  preferred_airlines JSONB DEFAULT '[]',
  preferred_departure_window TEXT DEFAULT 'morning',
  seat_preference TEXT DEFAULT 'no_preference',
  meal_preference TEXT,
  bag_preference TEXT DEFAULT 'cabin_only',
  price_sensitivity FLOAT DEFAULT 0.5,
  -- Learned patterns
  frequent_routes JSONB DEFAULT '[]',
  booking_lead_time_avg FLOAT,
  -- Confidence
  total_bookings INTEGER DEFAULT 0,
  preference_confidence FLOAT DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, member_id)
);

-- ============================================================
-- WHATSAPP SESSION MANAGEMENT
-- ============================================================

CREATE TABLE whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  org_id UUID REFERENCES organizations(id),
  member_id UUID REFERENCES org_members(id),
  -- Session state
  state TEXT DEFAULT 'idle',
  context JSONB DEFAULT '{}',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  -- Binding
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(phone_number)
);

-- ============================================================
-- ANALYTICS & REPORTING
-- ============================================================

CREATE TABLE booking_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  period TEXT NOT NULL,
  period_type TEXT NOT NULL,
  -- Metrics
  total_bookings INTEGER DEFAULT 0,
  total_spend DECIMAL(12,2) DEFAULT 0,
  avg_booking_value DECIMAL(10,2) DEFAULT 0,
  policy_compliance_rate FLOAT DEFAULT 0,
  avg_advance_booking_days FLOAT DEFAULT 0,
  gst_itc_recovered DECIMAL(10,2) DEFAULT 0,
  -- Savings
  estimated_savings DECIMAL(10,2) DEFAULT 0,
  savings_vs_last_period DECIMAL(10,2) DEFAULT 0,
  -- Breakdown
  top_routes JSONB DEFAULT '[]',
  top_airlines JSONB DEFAULT '[]',
  spend_by_department JSONB DEFAULT '{}',
  bookings_by_channel JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, period, period_type)
);

-- ============================================================
-- WHATSAPP MESSAGE LOG
-- ============================================================

CREATE TABLE whatsapp_message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  direction TEXT NOT NULL, -- 'inbound', 'outbound'
  message_type TEXT NOT NULL, -- 'text', 'interactive', 'template', 'document'
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_org_members_org_email ON org_members(org_id, email);
CREATE INDEX idx_org_members_phone ON org_members(phone);
CREATE INDEX idx_org_members_user_id ON org_members(user_id);
CREATE INDEX idx_corp_bookings_org_member ON corp_bookings(org_id, member_id);
CREATE INDEX idx_corp_bookings_org_status ON corp_bookings(org_id, status);
CREATE INDEX idx_corp_bookings_departure ON corp_bookings(departure_date);
CREATE INDEX idx_whatsapp_sessions_phone ON whatsapp_sessions(phone_number);
CREATE INDEX idx_gst_invoices_org_reconciled ON gst_invoices(org_id, reconciled);
CREATE INDEX idx_approval_requests_approver ON approval_requests(approver_id, status);
CREATE INDEX idx_approval_requests_booking ON approval_requests(booking_id);
CREATE INDEX idx_travel_policies_org ON travel_policies(org_id, is_active);
CREATE INDEX idx_traveler_prefs_org_member ON traveler_preferences(org_id, member_id);
CREATE INDEX idx_booking_analytics_org_period ON booking_analytics(org_id, period_type);
CREATE INDEX idx_whatsapp_log_phone ON whatsapp_message_log(phone_number, created_at);
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_domain ON organizations(domain);

-- ============================================================
-- UPDATED_AT TRIGGERS (using moddatetime)
-- ============================================================

CREATE TRIGGER set_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER set_org_members_updated_at
  BEFORE UPDATE ON org_members
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER set_travel_policies_updated_at
  BEFORE UPDATE ON travel_policies
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER set_corp_bookings_updated_at
  BEFORE UPDATE ON corp_bookings
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER set_traveler_preferences_updated_at
  BEFORE UPDATE ON traveler_preferences
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Helper: get all org_ids the current user belongs to
-- (Used in RLS policies below)

-- ── Organizations ──
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their own org"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT om.org_id FROM org_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY "Admins can update their org"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT om.org_id FROM org_members om
      WHERE om.user_id = auth.uid() AND om.role = 'admin' AND om.status = 'active'
    )
  );

CREATE POLICY "Anyone can insert orgs (signup)"
  ON organizations FOR INSERT
  WITH CHECK (true);

-- ── Org Members ──
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members see own org members"
  ON org_members FOR SELECT
  USING (
    org_id IN (
      SELECT om.org_id FROM org_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY "Admins can insert members"
  ON org_members FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT om.org_id FROM org_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'travel_manager') AND om.status = 'active'
    )
    OR
    -- Allow self-insert during signup (no existing membership yet)
    NOT EXISTS (
      SELECT 1 FROM org_members om WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update members"
  ON org_members FOR UPDATE
  USING (
    org_id IN (
      SELECT om.org_id FROM org_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'travel_manager') AND om.status = 'active'
    )
    OR
    -- Members can update their own record
    user_id = auth.uid()
  );

-- ── Travel Policies ──
ALTER TABLE travel_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org policies"
  ON travel_policies FOR SELECT
  USING (
    org_id IN (
      SELECT om.org_id FROM org_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY "Admins/TMs can manage policies"
  ON travel_policies FOR ALL
  USING (
    org_id IN (
      SELECT om.org_id FROM org_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'travel_manager') AND om.status = 'active'
    )
  );

-- ── Corp Bookings ──
ALTER TABLE corp_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees see own bookings, admins see all"
  ON corp_bookings FOR SELECT
  USING (
    -- Admins/TMs see all org bookings
    org_id IN (
      SELECT om.org_id FROM org_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'travel_manager') AND om.status = 'active'
    )
    OR
    -- Employees see only their own
    member_id IN (
      SELECT om.id FROM org_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY "Members can insert bookings"
  ON corp_bookings FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT om.org_id FROM org_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY "Admins can update bookings"
  ON corp_bookings FOR UPDATE
  USING (
    org_id IN (
      SELECT om.org_id FROM org_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'travel_manager') AND om.status = 'active'
    )
    OR
    member_id IN (
      SELECT om.id FROM org_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

-- ── Approval Requests ──
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approvers and requesters can view"
  ON approval_requests FOR SELECT
  USING (
    org_id IN (
      SELECT om.org_id FROM org_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'travel_manager') AND om.status = 'active'
    )
    OR
    requester_id IN (
      SELECT om.id FROM org_members om WHERE om.user_id = auth.uid()
    )
    OR
    approver_id IN (
      SELECT om.id FROM org_members om WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert approval requests"
  ON approval_requests FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT om.org_id FROM org_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY "Approvers can update approval requests"
  ON approval_requests FOR UPDATE
  USING (
    approver_id IN (
      SELECT om.id FROM org_members om WHERE om.user_id = auth.uid()
    )
    OR
    org_id IN (
      SELECT om.org_id FROM org_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'travel_manager') AND om.status = 'active'
    )
  );

-- ── GST Invoices ──
ALTER TABLE gst_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/TMs can view GST invoices"
  ON gst_invoices FOR SELECT
  USING (
    org_id IN (
      SELECT om.org_id FROM org_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'travel_manager') AND om.status = 'active'
    )
  );

CREATE POLICY "System can insert GST invoices"
  ON gst_invoices FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT om.org_id FROM org_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY "Admins can update GST invoices"
  ON gst_invoices FOR UPDATE
  USING (
    org_id IN (
      SELECT om.org_id FROM org_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'travel_manager') AND om.status = 'active'
    )
  );

-- ── Traveler Preferences ──
ALTER TABLE traveler_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members see own preferences, admins see all"
  ON traveler_preferences FOR SELECT
  USING (
    member_id IN (
      SELECT om.id FROM org_members om WHERE om.user_id = auth.uid()
    )
    OR
    org_id IN (
      SELECT om.org_id FROM org_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'travel_manager') AND om.status = 'active'
    )
  );

CREATE POLICY "Members can manage own preferences"
  ON traveler_preferences FOR ALL
  USING (
    member_id IN (
      SELECT om.id FROM org_members om WHERE om.user_id = auth.uid()
    )
  );

-- ── WhatsApp Sessions ──
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members see own session"
  ON whatsapp_sessions FOR SELECT
  USING (
    member_id IN (
      SELECT om.id FROM org_members om WHERE om.user_id = auth.uid()
    )
  );

-- WhatsApp sessions are primarily managed by the service role (webhook handler)
-- so we keep RLS minimal — the API routes use service role key

-- ── Booking Analytics ──
ALTER TABLE booking_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/TMs can view analytics"
  ON booking_analytics FOR SELECT
  USING (
    org_id IN (
      SELECT om.org_id FROM org_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'travel_manager') AND om.status = 'active'
    )
  );

-- ── WhatsApp Message Log ──
ALTER TABLE whatsapp_message_log ENABLE ROW LEVEL SECURITY;

-- Message log is only accessed via service role (API routes)
-- No direct user access needed

CREATE POLICY "Admins can view message logs"
  ON whatsapp_message_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid() AND om.role = 'admin' AND om.status = 'active'
    )
  );
