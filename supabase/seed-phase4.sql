-- ============================================================================
-- Phase 4 — Seed Data: Demo Organization
-- Run after 00013_phase4_corporate.sql migration
-- ============================================================================

-- Use fixed UUIDs so we can reference them in foreign keys
-- These are deterministic for repeatability

-- ── 1. Demo Organization ──

INSERT INTO organizations (id, name, slug, domain, industry, employee_count_range, annual_travel_spend_range, gstin, gst_state_code, billing_address, plan, plan_started_at, monthly_booking_limit, onboarding_completed)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Acme Technologies',
  'acme-tech',
  'acmetech.com',
  'it_services',
  '51-200',
  '50l_1cr',
  '29AABCT1234F1ZP',
  '29', -- Karnataka
  '{"line1": "42 MG Road", "line2": "4th Floor, Tower B", "city": "Bengaluru", "state": "Karnataka", "pin": "560001", "country": "India"}'::jsonb,
  'growth',
  '2026-01-01T00:00:00Z',
  100,
  true
);

-- ── 2. Demo Members (5) ──

-- Admin: Priya Sharma
INSERT INTO org_members (id, org_id, full_name, email, phone, department, designation, seniority_level, role, status, joined_at)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Priya Sharma',
  'priya@acmetech.com',
  '+919876543210',
  'Operations',
  'Head of Operations',
  'director',
  'admin',
  'active',
  '2026-01-01T00:00:00Z'
);

-- Travel Manager: Arjun Mehta
INSERT INTO org_members (id, org_id, full_name, email, phone, department, designation, seniority_level, role, reports_to, status, joined_at)
VALUES (
  'b0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'Arjun Mehta',
  'arjun@acmetech.com',
  '+919876543211',
  'Operations',
  'Travel Manager',
  'manager',
  'travel_manager',
  'b0000000-0000-0000-0000-000000000001',
  'active',
  '2026-01-05T00:00:00Z'
);

-- Employee 1 (IC): Raman Kumar
INSERT INTO org_members (id, org_id, full_name, email, phone, whatsapp_registered, department, designation, seniority_level, role, reports_to, status, joined_at)
VALUES (
  'b0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'Raman Kumar',
  'raman@acmetech.com',
  '+919876543212',
  true,
  'Engineering',
  'Senior Engineer',
  'individual_contributor',
  'employee',
  'b0000000-0000-0000-0000-000000000002',
  'active',
  '2026-01-10T00:00:00Z'
);

-- Employee 2 (Manager): Neha Gupta
INSERT INTO org_members (id, org_id, full_name, email, phone, whatsapp_registered, department, designation, seniority_level, role, reports_to, status, joined_at)
VALUES (
  'b0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000001',
  'Neha Gupta',
  'neha@acmetech.com',
  '+919876543213',
  true,
  'Sales',
  'Sales Manager',
  'manager',
  'employee',
  'b0000000-0000-0000-0000-000000000001',
  'active',
  '2026-01-12T00:00:00Z'
);

-- Employee 3 (VP): Vikram Patel
INSERT INTO org_members (id, org_id, full_name, email, phone, department, designation, seniority_level, role, reports_to, status, joined_at)
VALUES (
  'b0000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000001',
  'Vikram Patel',
  'vikram@acmetech.com',
  '+919876543214',
  'Engineering',
  'VP Engineering',
  'vp',
  'employee',
  'b0000000-0000-0000-0000-000000000001',
  'active',
  '2026-01-08T00:00:00Z'
);

-- ── 3. Default Travel Policy ──

INSERT INTO travel_policies (id, org_id, name, is_active, flight_rules, spend_limits, approval_rules, policy_mode)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Acme Standard Travel Policy',
  true,
  '{
    "domestic_cabin_class": {
      "default": "economy",
      "overrides": [
        {"seniority": ["director", "vp", "c_suite"], "allowed": ["economy", "premium_economy", "business"]}
      ]
    },
    "max_flight_price": {
      "domestic": 15000,
      "international": 75000
    },
    "advance_booking_days": {
      "minimum": 1,
      "recommended": 7,
      "early_booking_discount_message": true
    },
    "preferred_airlines": ["6E", "AI", "UK"],
    "blocked_airlines": [],
    "allow_refundable_only": false,
    "max_stops": 1,
    "flight_duration_limit_hours": null
  }'::jsonb,
  '{
    "per_trip_limit": 20000,
    "per_month_limit": 60000,
    "by_seniority": {
      "individual_contributor": 15000,
      "manager": 25000,
      "director": 50000,
      "vp": 75000,
      "c_suite": 100000
    }
  }'::jsonb,
  '{
    "auto_approve_under": 10000,
    "require_approval_over": 10000,
    "out_of_policy_requires": "travel_manager",
    "approval_timeout_hours": 24,
    "auto_escalate_on_timeout": true
  }'::jsonb,
  'soft'
);

-- ── 4. Sample Corp Bookings (5) ──

-- Booking 1: Raman, BLR→DEL, booked, compliant
INSERT INTO corp_bookings (id, org_id, member_id, trip_type, purpose, booking_channel, pnr, status, flight_details, origin, destination, departure_date, cabin_class, airline_code, airline_name, policy_compliant, total_amount, currency, payment_method, gst_amount, gst_itc_eligible, approval_status, created_at)
VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000003',
  'one_way',
  'client_meeting',
  'whatsapp',
  'ABC123',
  'booked',
  '{"airline": "IndiGo", "flight_number": "6E-234", "departure": "06:15", "arrival": "09:00", "duration": "2h 45m", "stops": 0}'::jsonb,
  'BLR', 'DEL',
  '2026-02-23',
  'economy',
  '6E', 'IndiGo',
  true,
  4850.00, 'INR', 'corporate_card',
  582.00, true,
  'auto_approved',
  '2026-02-15T10:30:00Z'
);

-- Booking 2: Neha, BOM→DEL, booked, compliant
INSERT INTO corp_bookings (id, org_id, member_id, trip_type, purpose, booking_channel, pnr, status, flight_details, origin, destination, departure_date, cabin_class, airline_code, airline_name, policy_compliant, total_amount, currency, payment_method, gst_amount, gst_itc_eligible, approval_status, created_at)
VALUES (
  'd0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000004',
  'round_trip',
  'conference',
  'web',
  'DEF456',
  'booked',
  '{"airline": "Air India", "flight_number": "AI-505", "departure": "08:30", "arrival": "10:30", "duration": "2h 00m", "stops": 0}'::jsonb,
  'BOM', 'DEL',
  '2026-02-20',
  'economy',
  'AI', 'Air India',
  true,
  7200.00, 'INR', 'corporate_card',
  864.00, true,
  'auto_approved',
  '2026-02-10T14:00:00Z'
);

-- Booking 3: Vikram, BLR→BOM, booked, business class (VP allowed)
INSERT INTO corp_bookings (id, org_id, member_id, trip_type, purpose, booking_channel, pnr, status, flight_details, origin, destination, departure_date, cabin_class, airline_code, airline_name, policy_compliant, total_amount, currency, payment_method, gst_amount, gst_itc_eligible, approval_status, created_at)
VALUES (
  'd0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000005',
  'one_way',
  'internal',
  'whatsapp',
  'GHI789',
  'booked',
  '{"airline": "Vistara", "flight_number": "UK-821", "departure": "07:00", "arrival": "08:50", "duration": "1h 50m", "stops": 0}'::jsonb,
  'BLR', 'BOM',
  '2026-02-25',
  'business',
  'UK', 'Vistara',
  true,
  12400.00, 'INR', 'corporate_card',
  1488.00, true,
  'auto_approved',
  '2026-02-12T09:00:00Z'
);

-- Booking 4: Raman, BLR→HYD, pending approval (over limit)
INSERT INTO corp_bookings (id, org_id, member_id, trip_type, purpose, booking_channel, status, flight_details, origin, destination, departure_date, cabin_class, airline_code, airline_name, policy_compliant, policy_violations, total_amount, currency, gst_itc_eligible, approval_status, created_at)
VALUES (
  'd0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000003',
  'one_way',
  'training',
  'whatsapp',
  'pending_approval',
  '{"airline": "IndiGo", "flight_number": "6E-512", "departure": "14:00", "arrival": "15:30", "duration": "1h 30m", "stops": 0}'::jsonb,
  'BLR', 'HYD',
  '2026-03-05',
  'economy',
  '6E', 'IndiGo',
  false,
  '[{"rule": "spend_limit", "message": "Booking amount exceeds monthly limit for individual contributor"}]'::jsonb,
  11500.00, 'INR',
  true,
  'pending',
  '2026-02-17T16:00:00Z'
);

-- Booking 5: Neha, DEL→BLR, cancelled
INSERT INTO corp_bookings (id, org_id, member_id, trip_type, purpose, booking_channel, pnr, status, flight_details, origin, destination, departure_date, cabin_class, airline_code, airline_name, policy_compliant, total_amount, currency, payment_method, gst_amount, gst_itc_eligible, approval_status, created_at)
VALUES (
  'd0000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000004',
  'one_way',
  'client_meeting',
  'web',
  'JKL012',
  'cancelled',
  '{"airline": "SpiceJet", "flight_number": "SG-123", "departure": "10:00", "arrival": "12:30", "duration": "2h 30m", "stops": 0}'::jsonb,
  'DEL', 'BLR',
  '2026-02-18',
  'economy',
  'SG', 'SpiceJet',
  true,
  5300.00, 'INR', 'corporate_card',
  636.00, true,
  'auto_approved',
  '2026-02-05T11:00:00Z'
);

-- ── Approval request for booking 4 ──

INSERT INTO approval_requests (id, org_id, booking_id, requester_id, approver_id, status, message, expires_at, notified_via)
VALUES (
  'e0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000004',
  'b0000000-0000-0000-0000-000000000003', -- Raman
  'b0000000-0000-0000-0000-000000000002', -- Arjun (travel manager)
  'pending',
  'Training in Hyderabad — mandatory team offsite',
  '2026-02-18T16:00:00Z',
  'whatsapp'
);

-- ── 5. Sample GST Invoices (3) ──

-- Invoice for booking 1 (IndiGo, BLR→DEL, intra-state would be IGST since DEL is different state)
INSERT INTO gst_invoices (id, org_id, booking_id, invoice_number, invoice_date, vendor_name, vendor_gstin, base_amount, cgst_amount, sgst_amount, igst_amount, total_gst, total_amount, itc_eligible, sac_code, source)
VALUES (
  'f0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'INV-6E-2026-00421',
  '2026-02-15',
  'IndiGo (InterGlobe Aviation Ltd)',
  '07AABCI1234H1ZD',
  4268.00,
  0, 0, 582.00,
  582.00,
  4850.00,
  true,
  '996411',
  'auto'
);

-- Invoice for booking 2 (Air India, BOM→DEL, IGST)
INSERT INTO gst_invoices (id, org_id, booking_id, invoice_number, invoice_date, vendor_name, vendor_gstin, base_amount, cgst_amount, sgst_amount, igst_amount, total_gst, total_amount, itc_eligible, sac_code, source)
VALUES (
  'f0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000002',
  'INV-AI-2026-08834',
  '2026-02-10',
  'Air India Ltd',
  '27AAACI5611E1Z8',
  6336.00,
  0, 0, 864.00,
  864.00,
  7200.00,
  true,
  '996411',
  'auto'
);

-- Invoice for booking 3 (Vistara, BLR→BOM, IGST)
INSERT INTO gst_invoices (id, org_id, booking_id, invoice_number, invoice_date, vendor_name, vendor_gstin, base_amount, cgst_amount, sgst_amount, igst_amount, total_gst, total_amount, itc_eligible, sac_code, source)
VALUES (
  'f0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000003',
  'INV-UK-2026-05512',
  '2026-02-12',
  'Tata SIA Airlines Ltd (Vistara)',
  '27AABCV1234H1Z5',
  10912.00,
  0, 0, 1488.00,
  1488.00,
  12400.00,
  true,
  '996411',
  'auto'
);

-- ── 6. Traveler Preferences ──

INSERT INTO traveler_preferences (org_id, member_id, preferred_airlines, preferred_departure_window, seat_preference, price_sensitivity, frequent_routes, total_bookings, preference_confidence)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003',
   '["6E", "AI"]'::jsonb, 'morning', 'aisle', 0.7,
   '[{"origin": "BLR", "destination": "DEL", "count": 8}, {"origin": "BLR", "destination": "HYD", "count": 3}]'::jsonb,
   11, 0.6),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004',
   '["AI", "UK"]'::jsonb, 'afternoon', 'window', 0.4,
   '[{"origin": "BOM", "destination": "DEL", "count": 5}]'::jsonb,
   5, 0.4),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005',
   '["UK"]'::jsonb, 'morning', 'aisle', 0.2,
   '[{"origin": "BLR", "destination": "BOM", "count": 4}, {"origin": "BLR", "destination": "DEL", "count": 6}]'::jsonb,
   10, 0.7);

-- ── 7. Booking Analytics (current month) ──

INSERT INTO booking_analytics (org_id, period, period_type, total_bookings, total_spend, avg_booking_value, policy_compliance_rate, avg_advance_booking_days, gst_itc_recovered, estimated_savings, top_routes, top_airlines, spend_by_department, bookings_by_channel)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '2026-02',
  'month',
  5,
  41250.00,
  8250.00,
  0.80,
  6.2,
  2934.00,
  3500.00,
  '[{"origin": "BLR", "destination": "DEL", "count": 2, "total_spend": 17250}, {"origin": "BOM", "destination": "DEL", "count": 1, "total_spend": 7200}, {"origin": "BLR", "destination": "BOM", "count": 1, "total_spend": 12400}]'::jsonb,
  '[{"code": "6E", "name": "IndiGo", "count": 2}, {"code": "AI", "name": "Air India", "count": 1}, {"code": "UK", "name": "Vistara", "count": 1}, {"code": "SG", "name": "SpiceJet", "count": 1}]'::jsonb,
  '{"Engineering": 28750, "Sales": 12500}'::jsonb,
  '{"whatsapp": 3, "web": 2}'::jsonb
);
