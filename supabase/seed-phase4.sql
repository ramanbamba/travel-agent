-- ============================================================================
-- Phase 4 — Seed Data: Demo Organization (Ultra-Realistic)
-- Run after 00013_phase4_corporate.sql migration
-- 8 members, 60 bookings, matching GST invoices, 3 months analytics
-- ============================================================================

-- Clean slate (idempotent re-run)
DELETE FROM booking_analytics WHERE org_id = 'a0000000-0000-0000-0000-000000000001';
DELETE FROM traveler_preferences WHERE org_id = 'a0000000-0000-0000-0000-000000000001';
DELETE FROM gst_invoices WHERE org_id = 'a0000000-0000-0000-0000-000000000001';
DELETE FROM approval_requests WHERE org_id = 'a0000000-0000-0000-0000-000000000001';
DELETE FROM corp_bookings WHERE org_id = 'a0000000-0000-0000-0000-000000000001';
DELETE FROM travel_policies WHERE org_id = 'a0000000-0000-0000-0000-000000000001';
DELETE FROM org_members WHERE org_id = 'a0000000-0000-0000-0000-000000000001';
DELETE FROM organizations WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- ══════════════════════════════════════════════════════════════════════════
-- 1. ORGANIZATION
-- ══════════════════════════════════════════════════════════════════════════

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
  '29',
  '{"line1": "42 MG Road", "line2": "4th Floor, Tower B", "city": "Bengaluru", "state": "Karnataka", "pin": "560001", "country": "India"}'::jsonb,
  'growth',
  '2025-11-01T00:00:00Z',
  100,
  true
);

-- ══════════════════════════════════════════════════════════════════════════
-- 2. MEMBERS (8)
-- ══════════════════════════════════════════════════════════════════════════

-- Vikram Patel — Admin/Founder
INSERT INTO org_members (id, org_id, full_name, email, phone, department, designation, seniority_level, role, status, joined_at)
VALUES ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
  'Vikram Patel', 'vikram@acmetech.com', '+919876543201', 'Leadership', 'Founder & CEO', 'c_suite', 'admin', 'active', '2025-11-01T00:00:00Z');

-- Priya Singh — Travel Manager
INSERT INTO org_members (id, org_id, full_name, email, phone, whatsapp_registered, department, designation, seniority_level, role, reports_to, status, joined_at)
VALUES ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
  'Priya Singh', 'priya@acmetech.com', '+919876543202', true, 'Operations', 'Travel Manager', 'manager', 'travel_manager', 'b0000000-0000-0000-0000-000000000001', 'active', '2025-11-05T00:00:00Z');

-- Ravi Kumar — Sales Director
INSERT INTO org_members (id, org_id, full_name, email, phone, whatsapp_registered, department, designation, seniority_level, role, reports_to, status, joined_at)
VALUES ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001',
  'Ravi Kumar', 'ravi@acmetech.com', '+919876543203', true, 'Sales', 'Sales Director', 'director', 'employee', 'b0000000-0000-0000-0000-000000000001', 'active', '2025-11-08T00:00:00Z');

-- Anita Sharma — Engineer, IC
INSERT INTO org_members (id, org_id, full_name, email, phone, whatsapp_registered, department, designation, seniority_level, role, reports_to, status, joined_at)
VALUES ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001',
  'Anita Sharma', 'anita@acmetech.com', '+919876543204', true, 'Engineering', 'Senior Engineer', 'individual_contributor', 'employee', 'b0000000-0000-0000-0000-000000000002', 'active', '2025-11-10T00:00:00Z');

-- Deepak Gupta — Consultant, IC
INSERT INTO org_members (id, org_id, full_name, email, phone, whatsapp_registered, department, designation, seniority_level, role, reports_to, status, joined_at)
VALUES ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001',
  'Deepak Gupta', 'deepak@acmetech.com', '+919876543205', true, 'Engineering', 'Technical Consultant', 'individual_contributor', 'employee', 'b0000000-0000-0000-0000-000000000002', 'active', '2025-11-12T00:00:00Z');

-- Megha Iyer — Marketing Manager
INSERT INTO org_members (id, org_id, full_name, email, phone, whatsapp_registered, department, designation, seniority_level, role, reports_to, status, joined_at)
VALUES ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001',
  'Megha Iyer', 'megha@acmetech.com', '+919876543206', true, 'Marketing', 'Marketing Manager', 'manager', 'employee', 'b0000000-0000-0000-0000-000000000001', 'active', '2025-11-15T00:00:00Z');

-- Arjun Reddy — Sales Rep, IC
INSERT INTO org_members (id, org_id, full_name, email, phone, whatsapp_registered, department, designation, seniority_level, role, reports_to, status, joined_at)
VALUES ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001',
  'Arjun Reddy', 'arjun@acmetech.com', '+919876543207', true, 'Sales', 'Sales Representative', 'individual_contributor', 'employee', 'b0000000-0000-0000-0000-000000000003', 'active', '2025-11-18T00:00:00Z');

-- Sneha Nair — HR Lead
INSERT INTO org_members (id, org_id, full_name, email, phone, department, designation, seniority_level, role, reports_to, status, joined_at)
VALUES ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001',
  'Sneha Nair', 'sneha@acmetech.com', '+919876543208', 'HR', 'HR Lead', 'manager', 'employee', 'b0000000-0000-0000-0000-000000000001', 'active', '2025-11-20T00:00:00Z');

-- ══════════════════════════════════════════════════════════════════════════
-- 3. TRAVEL POLICY
-- ══════════════════════════════════════════════════════════════════════════

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
    "max_flight_price": { "domestic": 15000, "international": 80000 },
    "advance_booking_days": { "minimum": 3, "recommended": 7, "early_booking_discount_message": true },
    "preferred_airlines": ["6E", "AI"],
    "blocked_airlines": [],
    "allow_refundable_only": false,
    "max_stops": 1,
    "flight_duration_limit_hours": null
  }'::jsonb,
  '{
    "per_trip_limit": 15000,
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
    "auto_approve_under": 8000,
    "require_approval_over": 8000,
    "out_of_policy_requires": "travel_manager",
    "approval_timeout_hours": 24,
    "auto_escalate_on_timeout": true
  }'::jsonb,
  'soft'
);

-- ══════════════════════════════════════════════════════════════════════════
-- 4. CORP BOOKINGS (60 across Dec 2025, Jan 2026, Feb 2026)
-- Distribution: 70% BLR↔DEL, 15% BLR↔BOM, 10% BLR↔HYD, 5% other
-- Cabin: 85% economy, 10% premium_economy, 5% business
-- Compliance: 90% compliant, 7% approved exception, 3% violation
-- Channel: 70% whatsapp, 20% web, 10% admin
-- ══════════════════════════════════════════════════════════════════════════

-- Helper abbreviations:
-- ORG = a0000000-0000-0000-0000-000000000001
-- Members: b...01=Vikram, b...02=Priya, b...03=Ravi, b...04=Anita, b...05=Deepak, b...06=Megha, b...07=Arjun, b...08=Sneha

-- ── DECEMBER 2025 (15 bookings) ──

INSERT INTO corp_bookings (id, org_id, member_id, trip_type, purpose, booking_channel, pnr, status, flight_details, origin, destination, departure_date, cabin_class, airline_code, airline_name, policy_compliant, total_amount, currency, payment_method, gst_amount, gst_itc_eligible, approval_status, created_at) VALUES
('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'one_way', 'client_meeting', 'whatsapp', 'IND001', 'booked', '{"airline":"IndiGo","flight_number":"6E-2134","departure":"06:15","arrival":"09:00","duration":"2h 45m","stops":0}'::jsonb, 'BLR','DEL','2025-12-03','economy','6E','IndiGo', true, 4850, 'INR','corporate_card', 582, true, 'auto_approved', '2025-11-28T10:30:00Z'),
('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000007', 'one_way', 'client_meeting', 'whatsapp', 'IND002', 'booked', '{"airline":"Air India","flight_number":"AI-505","departure":"08:30","arrival":"11:15","duration":"2h 45m","stops":0}'::jsonb, 'BLR','DEL','2025-12-05','economy','AI','Air India', true, 5200, 'INR','corporate_card', 624, true, 'auto_approved', '2025-11-30T14:00:00Z'),
('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'round_trip', 'training', 'whatsapp', 'IND003', 'booked', '{"airline":"IndiGo","flight_number":"6E-891","departure":"14:00","arrival":"16:30","duration":"2h 30m","stops":0}'::jsonb, 'BLR','DEL','2025-12-08','economy','6E','IndiGo', true, 4200, 'INR','corporate_card', 504, true, 'auto_approved', '2025-12-01T09:00:00Z'),
('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'one_way', 'conference', 'web', 'IND004', 'booked', '{"airline":"Vistara","flight_number":"UK-821","departure":"07:00","arrival":"09:30","duration":"2h 30m","stops":0}'::jsonb, 'BLR','BOM','2025-12-10','business','UK','Vistara', true, 18500, 'INR','corporate_card', 2220, true, 'auto_approved', '2025-12-03T11:00:00Z'),
('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006', 'one_way', 'conference', 'whatsapp', 'IND005', 'booked', '{"airline":"Air India","flight_number":"AI-812","departure":"10:30","arrival":"13:00","duration":"2h 30m","stops":0}'::jsonb, 'BLR','DEL','2025-12-11','economy','AI','Air India', true, 5800, 'INR','corporate_card', 696, true, 'auto_approved', '2025-12-04T16:00:00Z'),
('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'one_way', 'internal', 'whatsapp', 'IND006', 'booked', '{"airline":"IndiGo","flight_number":"6E-345","departure":"16:00","arrival":"17:15","duration":"1h 15m","stops":0}'::jsonb, 'BLR','HYD','2025-12-12','economy','6E','IndiGo', true, 3400, 'INR','corporate_card', 408, true, 'auto_approved', '2025-12-06T08:00:00Z'),
('d0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000007', 'round_trip', 'client_meeting', 'whatsapp', 'IND007', 'booked', '{"airline":"IndiGo","flight_number":"6E-2201","departure":"06:45","arrival":"09:30","duration":"2h 45m","stops":0}'::jsonb, 'BLR','DEL','2025-12-15','economy','6E','IndiGo', true, 4600, 'INR','corporate_card', 552, true, 'auto_approved', '2025-12-08T10:00:00Z'),
('d0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'one_way', 'training', 'web', 'IND008', 'booked', '{"airline":"Air India","flight_number":"AI-678","departure":"12:00","arrival":"14:45","duration":"2h 45m","stops":0}'::jsonb, 'BLR','DEL','2025-12-16','economy','AI','Air India', true, 6100, 'INR','corporate_card', 732, true, 'auto_approved', '2025-12-09T15:00:00Z'),
('d0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000008', 'one_way', 'internal', 'admin', 'IND009', 'booked', '{"airline":"IndiGo","flight_number":"6E-456","departure":"09:00","arrival":"11:30","duration":"2h 30m","stops":0}'::jsonb, 'BLR','DEL','2025-12-18','economy','6E','IndiGo', true, 5100, 'INR','corporate_card', 612, true, 'auto_approved', '2025-12-11T09:00:00Z'),
('d0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'one_way', 'client_meeting', 'whatsapp', 'IND010', 'booked', '{"airline":"IndiGo","flight_number":"6E-1023","departure":"07:30","arrival":"10:15","duration":"2h 45m","stops":0}'::jsonb, 'BLR','DEL','2025-12-20','economy','6E','IndiGo', true, 4400, 'INR','corporate_card', 528, true, 'auto_approved', '2025-12-13T11:00:00Z'),
('d0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006', 'one_way', 'conference', 'whatsapp', 'IND011', 'booked', '{"airline":"Vistara","flight_number":"UK-535","departure":"08:00","arrival":"10:00","duration":"2h 0m","stops":0}'::jsonb, 'BLR','BOM','2025-12-22','economy','UK','Vistara', true, 5500, 'INR','corporate_card', 660, true, 'auto_approved', '2025-12-15T14:00:00Z'),
('d0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000007', 'one_way', 'client_meeting', 'whatsapp', 'IND012', 'booked', '{"airline":"Air India","flight_number":"AI-901","departure":"15:00","arrival":"17:45","duration":"2h 45m","stops":0}'::jsonb, 'DEL','BLR','2025-12-23','economy','AI','Air India', true, 5300, 'INR','corporate_card', 636, true, 'auto_approved', '2025-12-16T10:00:00Z'),
-- Approved exception: Anita, premium economy
('d0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'one_way', 'client_meeting', 'whatsapp', 'IND013', 'booked', '{"airline":"Vistara","flight_number":"UK-840","departure":"06:00","arrival":"08:50","duration":"2h 50m","stops":0}'::jsonb, 'BLR','DEL','2025-12-26','premium_economy','UK','Vistara', false, 9800, 'INR','corporate_card', 1176, true, 'approved', '2025-12-18T09:00:00Z'),
('d0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'one_way', 'internal', 'whatsapp', 'IND014', 'booked', '{"airline":"IndiGo","flight_number":"6E-778","departure":"11:00","arrival":"12:10","duration":"1h 10m","stops":0}'::jsonb, 'BLR','HYD','2025-12-28','economy','6E','IndiGo', true, 3200, 'INR','corporate_card', 384, true, 'auto_approved', '2025-12-20T16:00:00Z'),
-- Policy violation: Arjun booked last minute
('d0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000007', 'one_way', 'client_meeting', 'whatsapp', NULL, 'booked', '{"airline":"IndiGo","flight_number":"6E-3312","departure":"18:00","arrival":"20:45","duration":"2h 45m","stops":0}'::jsonb, 'BLR','DEL','2025-12-30','economy','6E','IndiGo', false, 8200, 'INR','corporate_card', 984, true, 'approved', '2025-12-29T20:00:00Z');

-- ── JANUARY 2026 (20 bookings) ──

INSERT INTO corp_bookings (id, org_id, member_id, trip_type, purpose, booking_channel, pnr, status, flight_details, origin, destination, departure_date, cabin_class, airline_code, airline_name, policy_compliant, total_amount, currency, payment_method, gst_amount, gst_itc_eligible, approval_status, created_at) VALUES
('d0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'one_way', 'client_meeting', 'whatsapp', 'JAN001', 'booked', '{"airline":"IndiGo","flight_number":"6E-2134","departure":"06:15","arrival":"09:00","duration":"2h 45m","stops":0}'::jsonb, 'BLR','DEL','2026-01-06','economy','6E','IndiGo', true, 4700, 'INR','corporate_card', 564, true, 'auto_approved', '2026-01-02T10:00:00Z'),
('d0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000007', 'round_trip', 'client_meeting', 'whatsapp', 'JAN002', 'booked', '{"airline":"Air India","flight_number":"AI-801","departure":"08:00","arrival":"10:45","duration":"2h 45m","stops":0}'::jsonb, 'BLR','DEL','2026-01-08','economy','AI','Air India', true, 5400, 'INR','corporate_card', 648, true, 'auto_approved', '2026-01-03T14:00:00Z'),
('d0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'one_way', 'conference', 'web', 'JAN003', 'booked', '{"airline":"Vistara","flight_number":"UK-821","departure":"07:00","arrival":"08:50","duration":"1h 50m","stops":0}'::jsonb, 'BLR','BOM','2026-01-10','premium_economy','UK','Vistara', true, 11200, 'INR','corporate_card', 1344, true, 'auto_approved', '2026-01-05T09:00:00Z'),
('d0000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'one_way', 'training', 'whatsapp', 'JAN004', 'booked', '{"airline":"IndiGo","flight_number":"6E-512","departure":"14:00","arrival":"16:30","duration":"2h 30m","stops":0}'::jsonb, 'BLR','DEL','2026-01-12','economy','6E','IndiGo', true, 4300, 'INR','corporate_card', 516, true, 'auto_approved', '2026-01-06T11:00:00Z'),
('d0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006', 'one_way', 'conference', 'whatsapp', 'JAN005', 'booked', '{"airline":"Air India","flight_number":"AI-619","departure":"10:30","arrival":"13:15","duration":"2h 45m","stops":0}'::jsonb, 'BLR','DEL','2026-01-13','economy','AI','Air India', true, 5600, 'INR','corporate_card', 672, true, 'auto_approved', '2026-01-07T16:00:00Z'),
('d0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'one_way', 'internal', 'whatsapp', 'JAN006', 'booked', '{"airline":"IndiGo","flight_number":"6E-345","departure":"16:00","arrival":"17:15","duration":"1h 15m","stops":0}'::jsonb, 'BLR','HYD','2026-01-14','economy','6E','IndiGo', true, 3500, 'INR','corporate_card', 420, true, 'auto_approved', '2026-01-08T08:00:00Z'),
('d0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000007', 'one_way', 'client_meeting', 'whatsapp', 'JAN007', 'booked', '{"airline":"IndiGo","flight_number":"6E-2201","departure":"06:45","arrival":"09:30","duration":"2h 45m","stops":0}'::jsonb, 'BLR','DEL','2026-01-16','economy','6E','IndiGo', true, 4800, 'INR','corporate_card', 576, true, 'auto_approved', '2026-01-10T10:00:00Z'),
('d0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000008', 'one_way', 'internal', 'admin', 'JAN008', 'booked', '{"airline":"Air India","flight_number":"AI-234","departure":"09:00","arrival":"10:10","duration":"1h 10m","stops":0}'::jsonb, 'BLR','MAA','2026-01-17','economy','AI','Air India', true, 3100, 'INR','corporate_card', 372, true, 'auto_approved', '2026-01-11T09:00:00Z'),
('d0000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'one_way', 'client_meeting', 'web', 'JAN009', 'booked', '{"airline":"IndiGo","flight_number":"6E-1023","departure":"07:30","arrival":"10:15","duration":"2h 45m","stops":0}'::jsonb, 'BLR','DEL','2026-01-20','economy','6E','IndiGo', true, 4500, 'INR','corporate_card', 540, true, 'auto_approved', '2026-01-13T11:00:00Z'),
('d0000000-0000-0000-0000-000000000025', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'one_way', 'client_meeting', 'whatsapp', 'JAN010', 'booked', '{"airline":"Vistara","flight_number":"UK-815","departure":"17:00","arrival":"19:45","duration":"2h 45m","stops":0}'::jsonb, 'BLR','DEL','2026-01-21','business','UK','Vistara', true, 22000, 'INR','corporate_card', 2640, true, 'auto_approved', '2026-01-14T15:00:00Z'),
('d0000000-0000-0000-0000-000000000026', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'round_trip', 'training', 'whatsapp', 'JAN011', 'booked', '{"airline":"IndiGo","flight_number":"6E-891","departure":"14:00","arrival":"16:30","duration":"2h 30m","stops":0}'::jsonb, 'DEL','BLR','2026-01-22','economy','6E','IndiGo', true, 4900, 'INR','corporate_card', 588, true, 'auto_approved', '2026-01-15T10:00:00Z'),
('d0000000-0000-0000-0000-000000000027', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006', 'one_way', 'conference', 'whatsapp', 'JAN012', 'booked', '{"airline":"Air India","flight_number":"AI-412","departure":"08:00","arrival":"10:00","duration":"2h 0m","stops":0}'::jsonb, 'BLR','BOM','2026-01-23','economy','AI','Air India', true, 5100, 'INR','corporate_card', 612, true, 'auto_approved', '2026-01-16T14:00:00Z'),
('d0000000-0000-0000-0000-000000000028', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000007', 'one_way', 'client_meeting', 'whatsapp', 'JAN013', 'booked', '{"airline":"IndiGo","flight_number":"6E-678","departure":"12:00","arrival":"14:45","duration":"2h 45m","stops":0}'::jsonb, 'BLR','DEL','2026-01-24','economy','6E','IndiGo', true, 4600, 'INR','corporate_card', 552, true, 'auto_approved', '2026-01-17T09:00:00Z'),
-- Approved exception: Deepak, over spend limit
('d0000000-0000-0000-0000-000000000029', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'round_trip', 'conference', 'whatsapp', 'JAN014', 'booked', '{"airline":"Vistara","flight_number":"UK-535","departure":"08:00","arrival":"10:00","duration":"2h 0m","stops":0}'::jsonb, 'BLR','BOM','2026-01-26','premium_economy','UK','Vistara', false, 12500, 'INR','corporate_card', 1500, true, 'approved', '2026-01-19T11:00:00Z'),
('d0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'one_way', 'internal', 'whatsapp', 'JAN015', 'booked', '{"airline":"IndiGo","flight_number":"6E-2134","departure":"06:15","arrival":"09:00","duration":"2h 45m","stops":0}'::jsonb, 'BLR','DEL','2026-01-27','economy','6E','IndiGo', true, 4400, 'INR','corporate_card', 528, true, 'auto_approved', '2026-01-20T10:00:00Z'),
('d0000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000008', 'one_way', 'internal', 'web', 'JAN016', 'booked', '{"airline":"Air India","flight_number":"AI-901","departure":"15:00","arrival":"17:45","duration":"2h 45m","stops":0}'::jsonb, 'DEL','BLR','2026-01-28','economy','AI','Air India', true, 5200, 'INR','corporate_card', 624, true, 'auto_approved', '2026-01-21T15:00:00Z'),
('d0000000-0000-0000-0000-000000000032', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000007', 'one_way', 'client_meeting', 'whatsapp', 'JAN017', 'booked', '{"airline":"IndiGo","flight_number":"6E-456","departure":"09:00","arrival":"11:30","duration":"2h 30m","stops":0}'::jsonb, 'BLR','DEL','2026-01-29','economy','6E','IndiGo', true, 4300, 'INR','corporate_card', 516, true, 'auto_approved', '2026-01-22T08:00:00Z'),
-- Policy violation: Megha, premium economy without approval
('d0000000-0000-0000-0000-000000000033', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006', 'one_way', 'conference', 'web', NULL, 'booked', '{"airline":"Vistara","flight_number":"UK-840","departure":"06:00","arrival":"08:50","duration":"2h 50m","stops":0}'::jsonb, 'BLR','DEL','2026-01-30','premium_economy','UK','Vistara', false, 10200, 'INR','corporate_card', 1224, true, 'approved', '2026-01-28T18:00:00Z'),
('d0000000-0000-0000-0000-000000000034', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'one_way', 'training', 'whatsapp', 'JAN019', 'booked', '{"airline":"IndiGo","flight_number":"6E-778","departure":"11:00","arrival":"12:10","duration":"1h 10m","stops":0}'::jsonb, 'BLR','HYD','2026-01-30','economy','6E','IndiGo', true, 3300, 'INR','corporate_card', 396, true, 'auto_approved', '2026-01-23T16:00:00Z'),
('d0000000-0000-0000-0000-000000000035', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'one_way', 'client_meeting', 'whatsapp', 'JAN020', 'booked', '{"airline":"Air India","flight_number":"AI-678","departure":"12:00","arrival":"14:45","duration":"2h 45m","stops":0}'::jsonb, 'BLR','DEL','2026-01-31','economy','AI','Air India', true, 5500, 'INR','corporate_card', 660, true, 'auto_approved', '2026-01-24T11:00:00Z');

-- ── FEBRUARY 2026 (25 bookings — upward trend) ──

INSERT INTO corp_bookings (id, org_id, member_id, trip_type, purpose, booking_channel, pnr, status, flight_details, origin, destination, departure_date, cabin_class, airline_code, airline_name, policy_compliant, total_amount, currency, payment_method, gst_amount, gst_itc_eligible, approval_status, created_at) VALUES
('d0000000-0000-0000-0000-000000000036', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'one_way', 'client_meeting', 'whatsapp', 'FEB001', 'booked', '{"airline":"IndiGo","flight_number":"6E-2134","departure":"06:15","arrival":"09:00","duration":"2h 45m","stops":0}'::jsonb, 'BLR','DEL','2026-02-03','economy','6E','IndiGo', true, 4600, 'INR','corporate_card', 552, true, 'auto_approved', '2026-01-28T10:00:00Z'),
('d0000000-0000-0000-0000-000000000037', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000007', 'round_trip', 'client_meeting', 'whatsapp', 'FEB002', 'booked', '{"airline":"Air India","flight_number":"AI-505","departure":"08:30","arrival":"11:15","duration":"2h 45m","stops":0}'::jsonb, 'BLR','DEL','2026-02-04','economy','AI','Air India', true, 5300, 'INR','corporate_card', 636, true, 'auto_approved', '2026-01-29T14:00:00Z'),
('d0000000-0000-0000-0000-000000000038', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'one_way', 'training', 'whatsapp', 'FEB003', 'booked', '{"airline":"IndiGo","flight_number":"6E-891","departure":"14:00","arrival":"16:30","duration":"2h 30m","stops":0}'::jsonb, 'BLR','DEL','2026-02-05','economy','6E','IndiGo', true, 4200, 'INR','corporate_card', 504, true, 'auto_approved', '2026-01-30T09:00:00Z'),
('d0000000-0000-0000-0000-000000000039', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'one_way', 'conference', 'web', 'FEB004', 'booked', '{"airline":"Vistara","flight_number":"UK-821","departure":"07:00","arrival":"08:50","duration":"1h 50m","stops":0}'::jsonb, 'BLR','BOM','2026-02-06','business','UK','Vistara', true, 19500, 'INR','corporate_card', 2340, true, 'auto_approved', '2026-01-30T11:00:00Z'),
('d0000000-0000-0000-0000-000000000040', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006', 'one_way', 'conference', 'whatsapp', 'FEB005', 'booked', '{"airline":"Air India","flight_number":"AI-812","departure":"10:30","arrival":"13:00","duration":"2h 30m","stops":0}'::jsonb, 'BLR','DEL','2026-02-07','economy','AI','Air India', true, 5700, 'INR','corporate_card', 684, true, 'auto_approved', '2026-02-01T16:00:00Z'),
('d0000000-0000-0000-0000-000000000041', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'one_way', 'internal', 'whatsapp', 'FEB006', 'booked', '{"airline":"IndiGo","flight_number":"6E-345","departure":"16:00","arrival":"17:15","duration":"1h 15m","stops":0}'::jsonb, 'BLR','HYD','2026-02-08','economy','6E','IndiGo', true, 3400, 'INR','corporate_card', 408, true, 'auto_approved', '2026-02-02T08:00:00Z'),
('d0000000-0000-0000-0000-000000000042', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000008', 'one_way', 'internal', 'whatsapp', 'FEB007', 'booked', '{"airline":"IndiGo","flight_number":"6E-2201","departure":"06:45","arrival":"09:30","duration":"2h 45m","stops":0}'::jsonb, 'BLR','DEL','2026-02-10','economy','6E','IndiGo', true, 4500, 'INR','corporate_card', 540, true, 'auto_approved', '2026-02-03T10:00:00Z'),
('d0000000-0000-0000-0000-000000000043', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'one_way', 'client_meeting', 'whatsapp', 'FEB008', 'booked', '{"airline":"Air India","flight_number":"AI-678","departure":"12:00","arrival":"14:45","duration":"2h 45m","stops":0}'::jsonb, 'BLR','DEL','2026-02-11','economy','AI','Air India', true, 5800, 'INR','corporate_card', 696, true, 'auto_approved', '2026-02-04T15:00:00Z'),
('d0000000-0000-0000-0000-000000000044', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000007', 'one_way', 'client_meeting', 'whatsapp', 'FEB009', 'booked', '{"airline":"IndiGo","flight_number":"6E-1023","departure":"07:30","arrival":"10:15","duration":"2h 45m","stops":0}'::jsonb, 'BLR','DEL','2026-02-12','economy','6E','IndiGo', true, 4400, 'INR','corporate_card', 528, true, 'auto_approved', '2026-02-05T11:00:00Z'),
('d0000000-0000-0000-0000-000000000045', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006', 'one_way', 'conference', 'web', 'FEB010', 'booked', '{"airline":"Vistara","flight_number":"UK-535","departure":"08:00","arrival":"10:00","duration":"2h 0m","stops":0}'::jsonb, 'BLR','BOM','2026-02-13','economy','UK','Vistara', true, 5400, 'INR','corporate_card', 648, true, 'auto_approved', '2026-02-06T14:00:00Z'),
('d0000000-0000-0000-0000-000000000046', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'round_trip', 'training', 'whatsapp', 'FEB011', 'booked', '{"airline":"IndiGo","flight_number":"6E-456","departure":"09:00","arrival":"11:30","duration":"2h 30m","stops":0}'::jsonb, 'DEL','BLR','2026-02-14','economy','6E','IndiGo', true, 4900, 'INR','corporate_card', 588, true, 'auto_approved', '2026-02-07T09:00:00Z'),
('d0000000-0000-0000-0000-000000000047', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'one_way', 'internal', 'whatsapp', 'FEB012', 'booked', '{"airline":"Air India","flight_number":"AI-412","departure":"08:00","arrival":"10:00","duration":"2h 0m","stops":0}'::jsonb, 'BLR','BOM','2026-02-15','economy','AI','Air India', true, 5100, 'INR','corporate_card', 612, true, 'auto_approved', '2026-02-08T14:00:00Z'),
('d0000000-0000-0000-0000-000000000048', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000007', 'one_way', 'client_meeting', 'whatsapp', 'FEB013', 'booked', '{"airline":"IndiGo","flight_number":"6E-678","departure":"12:00","arrival":"14:45","duration":"2h 45m","stops":0}'::jsonb, 'BLR','DEL','2026-02-17','economy','6E','IndiGo', true, 4700, 'INR','corporate_card', 564, true, 'auto_approved', '2026-02-10T09:00:00Z'),
('d0000000-0000-0000-0000-000000000049', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'one_way', 'client_meeting', 'whatsapp', 'FEB014', 'booked', '{"airline":"IndiGo","flight_number":"6E-2134","departure":"06:15","arrival":"09:00","duration":"2h 45m","stops":0}'::jsonb, 'BLR','DEL','2026-02-18','economy','6E','IndiGo', true, 4500, 'INR','corporate_card', 540, true, 'auto_approved', '2026-02-11T10:00:00Z'),
-- Approved exception: Arjun, over per-trip limit
('d0000000-0000-0000-0000-000000000050', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000007', 'round_trip', 'conference', 'whatsapp', 'FEB015', 'booked', '{"airline":"Vistara","flight_number":"UK-815","departure":"17:00","arrival":"19:45","duration":"2h 45m","stops":0}'::jsonb, 'BLR','DEL','2026-02-19','premium_economy','UK','Vistara', false, 11800, 'INR','corporate_card', 1416, true, 'approved', '2026-02-12T15:00:00Z'),
('d0000000-0000-0000-0000-000000000051', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000008', 'one_way', 'internal', 'admin', 'FEB016', 'booked', '{"airline":"Air India","flight_number":"AI-901","departure":"15:00","arrival":"17:45","duration":"2h 45m","stops":0}'::jsonb, 'DEL','BLR','2026-02-19','economy','AI','Air India', true, 5200, 'INR','corporate_card', 624, true, 'auto_approved', '2026-02-12T09:00:00Z'),
('d0000000-0000-0000-0000-000000000052', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'one_way', 'training', 'whatsapp', 'FEB017', 'booked', '{"airline":"IndiGo","flight_number":"6E-778","departure":"11:00","arrival":"12:10","duration":"1h 10m","stops":0}'::jsonb, 'BLR','HYD','2026-02-20','economy','6E','IndiGo', true, 3300, 'INR','corporate_card', 396, true, 'auto_approved', '2026-02-13T16:00:00Z'),
('d0000000-0000-0000-0000-000000000053', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006', 'one_way', 'conference', 'whatsapp', 'FEB018', 'booked', '{"airline":"Air India","flight_number":"AI-619","departure":"10:30","arrival":"13:15","duration":"2h 45m","stops":0}'::jsonb, 'BLR','DEL','2026-02-21','economy','AI','Air India', true, 5600, 'INR','corporate_card', 672, true, 'auto_approved', '2026-02-14T14:00:00Z'),
('d0000000-0000-0000-0000-000000000054', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'one_way', 'internal', 'whatsapp', 'FEB019', 'booked', '{"airline":"IndiGo","flight_number":"6E-891","departure":"14:00","arrival":"16:30","duration":"2h 30m","stops":0}'::jsonb, 'BLR','DEL','2026-02-22','economy','6E','IndiGo', true, 4300, 'INR','corporate_card', 516, true, 'auto_approved', '2026-02-15T10:00:00Z'),
('d0000000-0000-0000-0000-000000000055', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000007', 'one_way', 'client_meeting', 'whatsapp', 'FEB020', 'booked', '{"airline":"IndiGo","flight_number":"6E-3312","departure":"18:00","arrival":"20:45","duration":"2h 45m","stops":0}'::jsonb, 'BLR','DEL','2026-02-23','economy','6E','IndiGo', true, 4800, 'INR','corporate_card', 576, true, 'auto_approved', '2026-02-16T10:00:00Z'),
-- Pending approval
('d0000000-0000-0000-0000-000000000056', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'one_way', 'conference', 'whatsapp', NULL, 'pending_approval', '{"airline":"Vistara","flight_number":"UK-840","departure":"06:00","arrival":"08:50","duration":"2h 50m","stops":0}'::jsonb, 'BLR','DEL','2026-02-26','premium_economy','UK','Vistara', false, 10500, 'INR', NULL, 1260, true, 'pending', '2026-02-18T09:00:00Z'),
('d0000000-0000-0000-0000-000000000057', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'one_way', 'conference', 'whatsapp', 'FEB022', 'booked', '{"airline":"Air India","flight_number":"AI-812","departure":"10:30","arrival":"13:00","duration":"2h 30m","stops":0}'::jsonb, 'BLR','DEL','2026-02-24','economy','AI','Air India', true, 5400, 'INR','corporate_card', 648, true, 'auto_approved', '2026-02-17T16:00:00Z'),
('d0000000-0000-0000-0000-000000000058', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'one_way', 'client_meeting', 'whatsapp', 'FEB023', 'booked', '{"airline":"IndiGo","flight_number":"6E-2201","departure":"06:45","arrival":"09:30","duration":"2h 45m","stops":0}'::jsonb, 'BLR','DEL','2026-02-25','economy','6E','IndiGo', true, 4700, 'INR','corporate_card', 564, true, 'auto_approved', '2026-02-18T10:00:00Z'),
-- Cancelled
('d0000000-0000-0000-0000-000000000059', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000008', 'one_way', 'internal', 'web', 'FEB024', 'cancelled', '{"airline":"SpiceJet","flight_number":"SG-423","departure":"10:00","arrival":"12:30","duration":"2h 30m","stops":0}'::jsonb, 'DEL','BLR','2026-02-20','economy','SG','SpiceJet', true, 3800, 'INR','corporate_card', 456, false, 'auto_approved', '2026-02-13T11:00:00Z'),
('d0000000-0000-0000-0000-000000000060', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006', 'one_way', 'conference', 'whatsapp', 'FEB025', 'booked', '{"airline":"IndiGo","flight_number":"6E-1023","departure":"07:30","arrival":"10:15","duration":"2h 45m","stops":0}'::jsonb, 'BLR','DEL','2026-02-27','economy','6E','IndiGo', true, 4600, 'INR','corporate_card', 552, true, 'auto_approved', '2026-02-20T11:00:00Z');

-- ══════════════════════════════════════════════════════════════════════════
-- 5. APPROVAL REQUESTS
-- ══════════════════════════════════════════════════════════════════════════

-- Pending approval for booking 56
INSERT INTO approval_requests (id, org_id, booking_id, requester_id, approver_id, status, message, expires_at, notified_via) VALUES
('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000056', 'b0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'pending', 'Conference in Delhi — need premium economy for back-to-back meetings', '2026-02-19T09:00:00Z', 'whatsapp'),
-- Approved exception for booking 13
('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'approved', 'Important client meeting — need early morning premium economy', '2025-12-19T09:00:00Z', 'whatsapp'),
-- Approved exception for booking 29
('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000029', 'b0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'approved', 'Industry conference — customer presentation', '2026-01-20T11:00:00Z', 'whatsapp'),
-- Approved exception for booking 50
('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000050', 'b0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000002', 'approved', 'Sales conference — bringing customer along', '2026-02-13T15:00:00Z', 'whatsapp');

-- ══════════════════════════════════════════════════════════════════════════
-- 6. GST INVOICES (for all booked bookings — 56 invoices)
-- SAC 996411 = Passenger transport by air (domestic)
-- All inter-state → IGST @ 12% (BLR is KA=29, DEL=07, BOM=27, HYD=36, MAA=33)
-- ══════════════════════════════════════════════════════════════════════════

-- Generate invoices for bookings 1-15 (Dec), 16-35 (Jan), 36-60 (Feb)
-- Only for booked/cancelled bookings (not pending_approval without PNR)

INSERT INTO gst_invoices (id, org_id, booking_id, invoice_number, invoice_date, vendor_name, vendor_gstin, base_amount, cgst_amount, sgst_amount, igst_amount, total_gst, total_amount, itc_eligible, reconciled, sac_code, source) VALUES
-- December invoices
('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'INV-6E-2025-12001', '2025-12-03', 'IndiGo (InterGlobe Aviation Ltd)', '07AABCI1234H1ZD', 4268, 0, 0, 582, 582, 4850, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'INV-AI-2025-12002', '2025-12-05', 'Air India Ltd', '07AAACI5611E1Z8', 4576, 0, 0, 624, 624, 5200, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'INV-6E-2025-12003', '2025-12-08', 'IndiGo (InterGlobe Aviation Ltd)', '07AABCI1234H1ZD', 3696, 0, 0, 504, 504, 4200, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 'INV-UK-2025-12004', '2025-12-10', 'Tata SIA Airlines Ltd (Vistara)', '27AABCV1234H1Z5', 16280, 0, 0, 2220, 2220, 18500, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 'INV-AI-2025-12005', '2025-12-11', 'Air India Ltd', '07AAACI5611E1Z8', 5104, 0, 0, 696, 696, 5800, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000006', 'INV-6E-2025-12006', '2025-12-12', 'IndiGo (InterGlobe Aviation Ltd)', '36AABCI1234H1ZD', 2992, 0, 0, 408, 408, 3400, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000007', 'INV-6E-2025-12007', '2025-12-15', 'IndiGo (InterGlobe Aviation Ltd)', '07AABCI1234H1ZD', 4048, 0, 0, 552, 552, 4600, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000008', 'INV-AI-2025-12008', '2025-12-16', 'Air India Ltd', '07AAACI5611E1Z8', 5368, 0, 0, 732, 732, 6100, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000009', 'INV-6E-2025-12009', '2025-12-18', 'IndiGo (InterGlobe Aviation Ltd)', '07AABCI1234H1ZD', 4488, 0, 0, 612, 612, 5100, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000010', 'INV-6E-2025-12010', '2025-12-20', 'IndiGo (InterGlobe Aviation Ltd)', '07AABCI1234H1ZD', 3872, 0, 0, 528, 528, 4400, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000011', 'INV-UK-2025-12011', '2025-12-22', 'Tata SIA Airlines Ltd (Vistara)', '27AABCV1234H1Z5', 4840, 0, 0, 660, 660, 5500, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000012', 'INV-AI-2025-12012', '2025-12-23', 'Air India Ltd', '29AAACI5611E1Z8', 4664, 0, 0, 636, 636, 5300, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000013', 'INV-UK-2025-12013', '2025-12-26', 'Tata SIA Airlines Ltd (Vistara)', '07AABCV1234H1Z5', 8624, 0, 0, 1176, 1176, 9800, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000014', 'INV-6E-2025-12014', '2025-12-28', 'IndiGo (InterGlobe Aviation Ltd)', '36AABCI1234H1ZD', 2816, 0, 0, 384, 384, 3200, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000015', 'INV-6E-2025-12015', '2025-12-30', 'IndiGo (InterGlobe Aviation Ltd)', '07AABCI1234H1ZD', 7216, 0, 0, 984, 984, 8200, true, true, '996411', 'auto'),
-- January invoices (20)
('f0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000016', 'INV-6E-2026-01001', '2026-01-06', 'IndiGo (InterGlobe Aviation Ltd)', '07AABCI1234H1ZD', 4136, 0, 0, 564, 564, 4700, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000017', 'INV-AI-2026-01002', '2026-01-08', 'Air India Ltd', '07AAACI5611E1Z8', 4752, 0, 0, 648, 648, 5400, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000018', 'INV-UK-2026-01003', '2026-01-10', 'Tata SIA Airlines Ltd (Vistara)', '27AABCV1234H1Z5', 9856, 0, 0, 1344, 1344, 11200, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000019', 'INV-6E-2026-01004', '2026-01-12', 'IndiGo (InterGlobe Aviation Ltd)', '07AABCI1234H1ZD', 3784, 0, 0, 516, 516, 4300, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000020', 'INV-AI-2026-01005', '2026-01-13', 'Air India Ltd', '07AAACI5611E1Z8', 4928, 0, 0, 672, 672, 5600, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000021', 'INV-6E-2026-01006', '2026-01-14', 'IndiGo (InterGlobe Aviation Ltd)', '36AABCI1234H1ZD', 3080, 0, 0, 420, 420, 3500, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000022', 'INV-6E-2026-01007', '2026-01-16', 'IndiGo (InterGlobe Aviation Ltd)', '07AABCI1234H1ZD', 4224, 0, 0, 576, 576, 4800, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000023', 'INV-AI-2026-01008', '2026-01-17', 'Air India Ltd', '33AAACI5611E1Z8', 2728, 0, 0, 372, 372, 3100, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000024', 'INV-6E-2026-01009', '2026-01-20', 'IndiGo (InterGlobe Aviation Ltd)', '07AABCI1234H1ZD', 3960, 0, 0, 540, 540, 4500, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000025', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000025', 'INV-UK-2026-01010', '2026-01-21', 'Tata SIA Airlines Ltd (Vistara)', '07AABCV1234H1Z5', 19360, 0, 0, 2640, 2640, 22000, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000026', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000026', 'INV-6E-2026-01011', '2026-01-22', 'IndiGo (InterGlobe Aviation Ltd)', '29AABCI1234H1ZD', 4312, 0, 0, 588, 588, 4900, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000027', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000027', 'INV-AI-2026-01012', '2026-01-23', 'Air India Ltd', '27AAACI5611E1Z8', 4488, 0, 0, 612, 612, 5100, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000028', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000028', 'INV-6E-2026-01013', '2026-01-24', 'IndiGo (InterGlobe Aviation Ltd)', '07AABCI1234H1ZD', 4048, 0, 0, 552, 552, 4600, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000029', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000029', 'INV-UK-2026-01014', '2026-01-26', 'Tata SIA Airlines Ltd (Vistara)', '27AABCV1234H1Z5', 11000, 0, 0, 1500, 1500, 12500, true, false, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000030', 'INV-6E-2026-01015', '2026-01-27', 'IndiGo (InterGlobe Aviation Ltd)', '07AABCI1234H1ZD', 3872, 0, 0, 528, 528, 4400, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000031', 'INV-AI-2026-01016', '2026-01-28', 'Air India Ltd', '29AAACI5611E1Z8', 4576, 0, 0, 624, 624, 5200, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000032', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000032', 'INV-6E-2026-01017', '2026-01-29', 'IndiGo (InterGlobe Aviation Ltd)', '07AABCI1234H1ZD', 3784, 0, 0, 516, 516, 4300, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000033', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000033', 'INV-UK-2026-01018', '2026-01-30', 'Tata SIA Airlines Ltd (Vistara)', '07AABCV1234H1Z5', 8976, 0, 0, 1224, 1224, 10200, true, false, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000034', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000034', 'INV-6E-2026-01019', '2026-01-30', 'IndiGo (InterGlobe Aviation Ltd)', '36AABCI1234H1ZD', 2904, 0, 0, 396, 396, 3300, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000035', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000035', 'INV-AI-2026-01020', '2026-01-31', 'Air India Ltd', '07AAACI5611E1Z8', 4840, 0, 0, 660, 660, 5500, true, true, '996411', 'auto'),
-- February invoices (for booked ones, skip 56=pending, 59=cancelled gets one too)
('f0000000-0000-0000-0000-000000000036', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000036', 'INV-6E-2026-02001', '2026-02-03', 'IndiGo (InterGlobe Aviation Ltd)', '07AABCI1234H1ZD', 4048, 0, 0, 552, 552, 4600, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000037', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000037', 'INV-AI-2026-02002', '2026-02-04', 'Air India Ltd', '07AAACI5611E1Z8', 4664, 0, 0, 636, 636, 5300, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000038', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000038', 'INV-6E-2026-02003', '2026-02-05', 'IndiGo (InterGlobe Aviation Ltd)', '07AABCI1234H1ZD', 3696, 0, 0, 504, 504, 4200, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000039', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000039', 'INV-UK-2026-02004', '2026-02-06', 'Tata SIA Airlines Ltd (Vistara)', '27AABCV1234H1Z5', 17160, 0, 0, 2340, 2340, 19500, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000040', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000040', 'INV-AI-2026-02005', '2026-02-07', 'Air India Ltd', '07AAACI5611E1Z8', 5016, 0, 0, 684, 684, 5700, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000041', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000041', 'INV-6E-2026-02006', '2026-02-08', 'IndiGo (InterGlobe Aviation Ltd)', '36AABCI1234H1ZD', 2992, 0, 0, 408, 408, 3400, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000042', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000042', 'INV-6E-2026-02007', '2026-02-10', 'IndiGo (InterGlobe Aviation Ltd)', '07AABCI1234H1ZD', 3960, 0, 0, 540, 540, 4500, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000043', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000043', 'INV-AI-2026-02008', '2026-02-11', 'Air India Ltd', '07AAACI5611E1Z8', 5104, 0, 0, 696, 696, 5800, true, false, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000044', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000044', 'INV-6E-2026-02009', '2026-02-12', 'IndiGo (InterGlobe Aviation Ltd)', '07AABCI1234H1ZD', 3872, 0, 0, 528, 528, 4400, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000045', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000045', 'INV-UK-2026-02010', '2026-02-13', 'Tata SIA Airlines Ltd (Vistara)', '27AABCV1234H1Z5', 4752, 0, 0, 648, 648, 5400, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000046', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000046', 'INV-6E-2026-02011', '2026-02-14', 'IndiGo (InterGlobe Aviation Ltd)', '29AABCI1234H1ZD', 4312, 0, 0, 588, 588, 4900, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000047', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000047', 'INV-AI-2026-02012', '2026-02-15', 'Air India Ltd', '27AAACI5611E1Z8', 4488, 0, 0, 612, 612, 5100, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000048', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000048', 'INV-6E-2026-02013', '2026-02-17', 'IndiGo (InterGlobe Aviation Ltd)', '07AABCI1234H1ZD', 4136, 0, 0, 564, 564, 4700, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000049', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000049', 'INV-6E-2026-02014', '2026-02-18', 'IndiGo (InterGlobe Aviation Ltd)', '07AABCI1234H1ZD', 3960, 0, 0, 540, 540, 4500, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000050', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000050', 'INV-UK-2026-02015', '2026-02-19', 'Tata SIA Airlines Ltd (Vistara)', '07AABCV1234H1Z5', 10384, 0, 0, 1416, 1416, 11800, true, false, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000051', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000051', 'INV-AI-2026-02016', '2026-02-19', 'Air India Ltd', '29AAACI5611E1Z8', 4576, 0, 0, 624, 624, 5200, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000052', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000052', 'INV-6E-2026-02017', '2026-02-20', 'IndiGo (InterGlobe Aviation Ltd)', '36AABCI1234H1ZD', 2904, 0, 0, 396, 396, 3300, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000053', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000053', 'INV-AI-2026-02018', '2026-02-21', 'Air India Ltd', '07AAACI5611E1Z8', 4928, 0, 0, 672, 672, 5600, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000054', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000054', 'INV-6E-2026-02019', '2026-02-22', 'IndiGo (InterGlobe Aviation Ltd)', '07AABCI1234H1ZD', 3784, 0, 0, 516, 516, 4300, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000055', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000055', 'INV-6E-2026-02020', '2026-02-23', 'IndiGo (InterGlobe Aviation Ltd)', '07AABCI1234H1ZD', 4224, 0, 0, 576, 576, 4800, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000057', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000057', 'INV-AI-2026-02022', '2026-02-24', 'Air India Ltd', '07AAACI5611E1Z8', 4752, 0, 0, 648, 648, 5400, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000058', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000058', 'INV-6E-2026-02023', '2026-02-25', 'IndiGo (InterGlobe Aviation Ltd)', '07AABCI1234H1ZD', 4136, 0, 0, 564, 564, 4700, true, true, '996411', 'auto'),
('f0000000-0000-0000-0000-000000000060', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000060', 'INV-6E-2026-02025', '2026-02-27', 'IndiGo (InterGlobe Aviation Ltd)', '07AABCI1234H1ZD', 4048, 0, 0, 552, 552, 4600, true, true, '996411', 'auto');

-- ══════════════════════════════════════════════════════════════════════════
-- 7. TRAVELER PREFERENCES
-- ══════════════════════════════════════════════════════════════════════════

INSERT INTO traveler_preferences (org_id, member_id, preferred_airlines, preferred_departure_window, seat_preference, price_sensitivity, frequent_routes, total_bookings, preference_confidence) VALUES
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', '["6E", "AI"]'::jsonb, 'morning', 'aisle', 0.7, '[{"origin":"BLR","destination":"DEL","count":14},{"origin":"BLR","destination":"HYD","count":3}]'::jsonb, 17, 0.85),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000007', '["6E", "AI"]'::jsonb, 'morning', 'window', 0.8, '[{"origin":"BLR","destination":"DEL","count":12}]'::jsonb, 12, 0.75),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', '["6E", "AI"]'::jsonb, 'afternoon', 'aisle', 0.6, '[{"origin":"BLR","destination":"DEL","count":6},{"origin":"BLR","destination":"HYD","count":3},{"origin":"BLR","destination":"BOM","count":2}]'::jsonb, 11, 0.7),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006', '["AI", "UK"]'::jsonb, 'morning', 'window', 0.5, '[{"origin":"BLR","destination":"DEL","count":6},{"origin":"BLR","destination":"BOM","count":3}]'::jsonb, 9, 0.65),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', '["UK", "AI"]'::jsonb, 'morning', 'aisle', 0.2, '[{"origin":"BLR","destination":"BOM","count":3},{"origin":"BLR","destination":"DEL","count":3}]'::jsonb, 6, 0.6),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000008', '["AI", "6E"]'::jsonb, 'morning', 'window', 0.5, '[{"origin":"BLR","destination":"DEL","count":2},{"origin":"BLR","destination":"MAA","count":1}]'::jsonb, 4, 0.4);

-- ══════════════════════════════════════════════════════════════════════════
-- 8. BOOKING ANALYTICS (3 months — upward trend)
-- ══════════════════════════════════════════════════════════════════════════

INSERT INTO booking_analytics (org_id, period, period_type, total_bookings, total_spend, avg_booking_value, policy_compliance_rate, avg_advance_booking_days, gst_itc_recovered, estimated_savings, top_routes, top_airlines, spend_by_department, bookings_by_channel) VALUES
-- December 2025
('a0000000-0000-0000-0000-000000000001', '2025-12', 'month', 15, 91650, 6110, 0.87, 4.8, 10524, 8200,
 '[{"origin":"BLR","destination":"DEL","count":7,"total_spend":38550},{"origin":"BLR","destination":"BOM","count":2,"total_spend":24000},{"origin":"BLR","destination":"HYD","count":2,"total_spend":6600},{"origin":"DEL","destination":"BLR","count":1,"total_spend":5300}]'::jsonb,
 '[{"code":"6E","name":"IndiGo","count":8},{"code":"AI","name":"Air India","count":4},{"code":"UK","name":"Vistara","count":3}]'::jsonb,
 '{"Engineering":38450,"Sales":23100,"Marketing":11300,"Operations":0,"HR":5100,"Leadership":0}'::jsonb,
 '{"whatsapp":11,"web":2,"admin":1}'::jsonb),
-- January 2026
('a0000000-0000-0000-0000-000000000001', '2026-01', 'month', 20, 131400, 6570, 0.90, 5.1, 15216, 11500,
 '[{"origin":"BLR","destination":"DEL","count":11,"total_spend":62400},{"origin":"BLR","destination":"BOM","count":3,"total_spend":28800},{"origin":"BLR","destination":"HYD","count":2,"total_spend":6800},{"origin":"DEL","destination":"BLR","count":2,"total_spend":10100},{"origin":"BLR","destination":"MAA","count":1,"total_spend":3100}]'::jsonb,
 '[{"code":"6E","name":"IndiGo","count":10},{"code":"AI","name":"Air India","count":5},{"code":"UK","name":"Vistara","count":5}]'::jsonb,
 '{"Engineering":53200,"Sales":42500,"Marketing":15900,"Operations":0,"HR":8300,"Leadership":0}'::jsonb,
 '{"whatsapp":14,"web":4,"admin":1}'::jsonb),
-- February 2026
('a0000000-0000-0000-0000-000000000001', '2026-02', 'month', 25, 147900, 5916, 0.92, 5.6, 17676, 14200,
 '[{"origin":"BLR","destination":"DEL","count":16,"total_spend":82500},{"origin":"BLR","destination":"BOM","count":4,"total_spend":35200},{"origin":"BLR","destination":"HYD","count":2,"total_spend":6700},{"origin":"DEL","destination":"BLR","count":2,"total_spend":9000}]'::jsonb,
 '[{"code":"6E","name":"IndiGo","count":14},{"code":"AI","name":"Air India","count":7},{"code":"UK","name":"Vistara","count":4}]'::jsonb,
 '{"Engineering":61800,"Sales":45200,"Marketing":16500,"Operations":0,"HR":9000,"Leadership":19500}'::jsonb,
 '{"whatsapp":18,"web":4,"admin":2}'::jsonb),
-- Quarterly aggregate
('a0000000-0000-0000-0000-000000000001', '2025-Q4/2026-Q1', 'quarter', 60, 370950, 6182, 0.90, 5.2, 43416, 33900,
 '[{"origin":"BLR","destination":"DEL","count":34,"total_spend":183450},{"origin":"BLR","destination":"BOM","count":9,"total_spend":88000},{"origin":"BLR","destination":"HYD","count":6,"total_spend":20100},{"origin":"DEL","destination":"BLR","count":5,"total_spend":24400}]'::jsonb,
 '[{"code":"6E","name":"IndiGo","count":32},{"code":"AI","name":"Air India","count":16},{"code":"UK","name":"Vistara","count":12}]'::jsonb,
 '{"Engineering":153450,"Sales":110800,"Marketing":43700,"Operations":0,"HR":22400,"Leadership":19500}'::jsonb,
 '{"whatsapp":43,"web":10,"admin":4}'::jsonb);
