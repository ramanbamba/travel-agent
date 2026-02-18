# SkySwift Phase 4 — The Corporate Pivot

## AI-Native Corporate Travel Management for India

**Version:** 4.0 | **Date:** February 18, 2026 | **Status:** 🔵 CURRENT

---

## 0. Phase 4 North Star

> **Ship an AI-native corporate travel platform that books domestic flights via WhatsApp in 30 seconds with policy enforcement and GST compliance. Get 10 paying corporate pilots and apply to YC S26.**

Every feature must pass: _"Does this help close the next corporate pilot, or make the YC demo undeniable?"_ If no, it's cut.

### What Changed (The Pivot)

| Dimension | Phase 1-3 (B2C) | Phase 4 (B2B Corporate) |
|-----------|-----------------|------------------------|
| **Customer** | Individual travelers | Companies (SMBs, mid-market) |
| **User** | The traveler booking for themselves | Employee travelers + admin/travel managers + CFO |
| **Value Prop** | "Spotify of travel" — personalized recommendations | "AI travel desk" — 30s booking + policy enforcement + GST savings |
| **Landing Page** | Consumer app showcase | Enterprise SaaS with dual-persona messaging |
| **Auth Model** | Individual signup | Org-based: company creates account → invites employees |
| **Booking Flow** | Chat on web app | WhatsApp-first + web dashboard |
| **Revenue Model** | Per-booking markup to traveler | SaaS subscription + savings-share to company |
| **Key Metric** | 100 individual bookings | 10 corporate pilots, 500+ bookings |
| **Competitor Frame** | OTAs (MakeMyTrip, Ixigo) | TMCs (ITILITE, myBiz, Yatra, small offline agents) |

### What We Keep (Carry-Forward Assets)

These Phase 1-3 assets remain valuable and will be refactored, not rewritten:

- **Tech stack:** Next.js 14, Supabase, Vercel, Tailwind CSS
- **Duffel integration:** Flight search + booking API (refactored for org-level usage)
- **Razorpay integration:** Payment infrastructure (add corporate card support)
- **Gemini 2.0 Flash:** Conversational AI engine (re-prompted for corporate context)
- **Preference learning logic:** Core scoring algorithm (adapted for corporate traveler profiles)
- **Liquid Glass design system:** Visual foundation (adapted for B2B — more professional, less playful)

### What We Replace Entirely

- Landing page → new B2B-focused marketing site
- Individual auth → organization-based multi-tenant auth
- Chat-only interface → WhatsApp bot + web admin dashboard
- Personal onboarding → company onboarding (policy setup, employee invite)
- Individual bookings → organization bookings with approval workflows
- No policy engine → full policy engine with pre-booking enforcement
- No GST handling → GST compliance engine with ITC tracking
- No admin view → travel manager dashboard with analytics

---

## 1. Product Architecture

### 1.1 Multi-Tenant Organization Model

SkySwift becomes a multi-tenant SaaS platform. Every entity is scoped to an organization.

```
Organization (Company)
├── Organization Settings (policy rules, GST details, billing)
├── Members (employees)
│   ├── Role: admin (can manage everything)
│   ├── Role: travel_manager (can view all bookings, set policy, approve)
│   ├── Role: approver (can approve trip requests for their team)
│   └── Role: employee (can book for themselves within policy)
├── Policies
│   ├── Flight rules (cabin class by seniority, advance booking, preferred airlines)
│   ├── Spend limits (per trip, per month, by role)
│   └── Approval rules (auto-approve under ₹X, require approval above ₹Y)
├── Bookings (all org bookings with audit trail)
├── Expenses (auto-generated from bookings + manual uploads)
└── GST Profile (GSTIN, SAC codes, invoice tracking)
```

### 1.2 Three Interfaces

**1. WhatsApp Bot (Primary — Employee-facing)**
The hero product. Employees message the bot in natural language. The AI agent searches flights, applies company policy, shows options, and books with one-tap confirmation. This is where 80%+ of bookings happen.

**2. Web Dashboard (Admin/Travel Manager)**
Policy configuration, employee management, booking analytics, spend reporting, GST compliance dashboard. Travel managers live here. Employees may visit for booking history or expense reports but WhatsApp is their primary interface.

**3. Web Booking (Secondary — Employee fallback)**
A streamlined web interface for employees who prefer browser-based booking or need to do something complex the WhatsApp bot can't handle (multi-city, group bookings).

### 1.3 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SKYSWIFT PLATFORM                         │
│                                                                   │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐ │
│  │  WhatsApp     │   │  Web App     │   │  Admin Dashboard     │ │
│  │  Business API │   │  (Next.js)   │   │  (Next.js)           │ │
│  └──────┬───────┘   └──────┬───────┘   └──────────┬───────────┘ │
│         │                   │                       │             │
│  ┌──────▼───────────────────▼───────────────────────▼───────────┐│
│  │                    API LAYER (Next.js API Routes)             ││
│  │                                                               ││
│  │  /api/whatsapp/webhook    — WhatsApp message handler          ││
│  │  /api/chat/message        — Web chat handler                  ││
│  │  /api/flights/search      — Duffel search + policy filter     ││
│  │  /api/flights/book        — Duffel booking + payment          ││
│  │  /api/org/*               — Organization CRUD                 ││
│  │  /api/policy/*            — Policy engine                     ││
│  │  /api/admin/*             — Dashboard data                    ││
│  │  /api/gst/*               — GST compliance                   ││
│  └──────┬───────────────────┬───────────────────────┬───────────┘│
│         │                   │                       │             │
│  ┌──────▼──────┐   ┌───────▼───────┐   ┌──────────▼───────────┐│
│  │  AI Engine  │   │  Policy       │   │  Payment             ││
│  │  (Gemini)   │   │  Engine       │   │  (Razorpay)          ││
│  │             │   │               │   │                       ││
│  │  - Intent   │   │  - Rule eval  │   │  - Corporate billing ││
│  │  - NLU      │   │  - Approval   │   │  - UPI / Card        ││
│  │  - Context  │   │  - Enforce    │   │  - Invoice gen       ││
│  └─────────────┘   └───────────────┘   └───────────────────────┘│
│         │                   │                       │             │
│  ┌──────▼───────────────────▼───────────────────────▼───────────┐│
│  │                    SUPABASE (PostgreSQL + Auth + RLS)          ││
│  │                                                               ││
│  │  organizations │ members │ policies │ bookings │ expenses     ││
│  │  gst_invoices │ approval_requests │ traveler_preferences     ││
│  └───────────────────────────┬───────────────────────────────────┘│
│                              │                                    │
│  ┌───────────────────────────▼───────────────────────────────────┐│
│  │                    EXTERNAL SERVICES                           ││
│  │                                                               ││
│  │  Duffel (flights) │ Razorpay (payments) │ WhatsApp Cloud API ││
│  │  Gemini 2.0 Flash │ Vercel (hosting)    │ Resend (email)     ││
│  └───────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 1.4 Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| WhatsApp-first vs web-first | WhatsApp-first | 500M+ Indian users. Corporate employees already have it. Zero app install. SkyLink proved this works at McKinsey via Slack. |
| Single DB vs multi-DB | Single Supabase with RLS | Multi-tenant via org_id on every table + Row Level Security. Simpler ops. Free tier supports 500MB/50K rows — enough for 50+ pilot companies. |
| Own ticketing vs Duffel | Duffel for MVP | No IATA accreditation needed. Instant access to 300+ airlines. $2-3/booking cost acceptable at pilot scale. Graduate to direct APIs at 10K+ bookings/month. |
| Build policy engine vs buy | Build (rules-based + LLM) | Core IP. Hard rules enforced deterministically. LLM interprets edge cases and explains policy to employees. No SaaS tool does this for Indian market. |
| GST engine build vs skip | Build (critical India moat) | 12-18% ITC savings for corporates. No global competitor has this. CFOs will sign up for GST compliance alone. |
| Mobile app vs WhatsApp | WhatsApp IS the mobile app | Zero development cost. Works on every phone. Push notifications built-in. No App Store approval needed. |
| Slack/Teams vs WhatsApp only | WhatsApp first, Slack Phase 4.5 | Indian SMBs use WhatsApp universally. Slack/Teams is enterprise-only in India. Add when targeting larger companies. |
| Approval workflow complexity | Simple 2-level for MVP | Auto-approve if under policy limit. Manager approval if over limit or out-of-policy. Skip complex multi-level chains for now. |

---

## 2. Database Schema

### 2.1 New Tables (Phase 4)

All existing Phase 1-3 tables remain but some are deprecated. New tables use `org_id` for multi-tenancy.

```sql
-- ============================================================
-- ORGANIZATION & MULTI-TENANCY
-- ============================================================

-- Core organization table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier: "acme-corp"
  domain TEXT, -- email domain for auto-join: "acmecorp.com"
  logo_url TEXT,
  industry TEXT, -- 'it_services', 'bfsi', 'consulting', 'pharma', 'startup', 'other'
  employee_count_range TEXT, -- '1-50', '51-200', '201-500', '501-2000', '2000+'
  annual_travel_spend_range TEXT, -- 'under_10l', '10l_50l', '50l_1cr', '1cr_5cr', '5cr_10cr', 'above_10cr'
  -- GST Details
  gstin TEXT, -- Company GSTIN for invoice compliance
  gst_state_code TEXT, -- State code for CGST/SGST vs IGST
  billing_address JSONB, -- {line1, line2, city, state, pin, country}
  -- Settings
  default_currency TEXT DEFAULT 'INR',
  timezone TEXT DEFAULT 'Asia/Kolkata',
  -- Subscription
  plan TEXT DEFAULT 'free', -- 'free', 'growth', 'enterprise'
  plan_started_at TIMESTAMP WITH TIME ZONE,
  monthly_booking_limit INTEGER DEFAULT 20, -- free tier
  -- Meta
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization members (employees)
CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Profile
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT, -- with country code, for WhatsApp
  whatsapp_registered BOOLEAN DEFAULT FALSE,
  employee_id TEXT, -- internal employee ID
  department TEXT,
  designation TEXT,
  seniority_level TEXT DEFAULT 'individual_contributor', -- 'ic', 'manager', 'director', 'vp', 'c_suite'
  -- Org role
  role TEXT DEFAULT 'employee', -- 'admin', 'travel_manager', 'approver', 'employee'
  reports_to UUID REFERENCES org_members(id), -- for approval chain
  -- Status
  status TEXT DEFAULT 'invited', -- 'invited', 'active', 'deactivated'
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, email)
);

-- ============================================================
-- TRAVEL POLICY ENGINE
-- ============================================================

-- Company travel policies (rule-based)
CREATE TABLE travel_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  -- Hotel rules (future - placeholder)
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
  policy_mode TEXT DEFAULT 'soft', -- 'soft' (warn but allow), 'hard' (block out-of-policy)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- BOOKINGS (Corporate)
-- ============================================================

-- Corporate bookings (replaces individual bookings table)
CREATE TABLE corp_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES org_members(id) NOT NULL,
  booked_by UUID REFERENCES org_members(id), -- could be admin booking on behalf
  -- Trip details
  trip_type TEXT DEFAULT 'one_way', -- 'one_way', 'round_trip', 'multi_city'
  purpose TEXT, -- 'client_meeting', 'conference', 'internal', 'training', 'other'
  purpose_note TEXT,
  project_code TEXT,
  cost_center TEXT,
  -- Booking details
  booking_channel TEXT DEFAULT 'whatsapp', -- 'whatsapp', 'web', 'admin_booked'
  duffel_order_id TEXT,
  pnr TEXT,
  status TEXT DEFAULT 'pending', -- 'pending_approval', 'approved', 'booked', 'cancelled', 'completed'
  -- Flight details
  flight_details JSONB NOT NULL, -- full Duffel offer snapshot
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE,
  cabin_class TEXT,
  airline_code TEXT,
  airline_name TEXT,
  -- Policy compliance
  policy_compliant BOOLEAN DEFAULT TRUE,
  policy_violations JSONB DEFAULT '[]', -- [{rule: 'cabin_class', message: 'Business class not allowed for IC'}]
  policy_override_reason TEXT, -- if booked despite violation
  policy_override_by UUID REFERENCES org_members(id),
  -- Financial
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  payment_method TEXT, -- 'corporate_card', 'upi', 'razorpay', 'invoice'
  payment_id TEXT, -- Razorpay payment ID
  -- GST
  gst_invoice_number TEXT,
  gst_invoice_url TEXT,
  gst_amount DECIMAL(10,2),
  gst_itc_eligible BOOLEAN DEFAULT TRUE,
  -- Approval
  approval_status TEXT DEFAULT 'auto_approved', -- 'auto_approved', 'pending', 'approved', 'rejected'
  approved_by UUID REFERENCES org_members(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Approval requests
CREATE TABLE approval_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES corp_bookings(id) NOT NULL,
  requester_id UUID REFERENCES org_members(id) NOT NULL,
  approver_id UUID REFERENCES org_members(id) NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired'
  message TEXT, -- reason from requester
  response_message TEXT, -- reason from approver
  responded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  notified_via TEXT DEFAULT 'whatsapp', -- 'whatsapp', 'email', 'both'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- GST COMPLIANCE
-- ============================================================

CREATE TABLE gst_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES corp_bookings(id),
  -- Invoice details
  invoice_number TEXT,
  invoice_date DATE,
  vendor_name TEXT NOT NULL, -- airline name
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
  itc_claim_period TEXT, -- 'FY2025-26-Q4'
  -- SAC code
  sac_code TEXT DEFAULT '996411', -- air transport of passengers
  -- Source
  source TEXT DEFAULT 'auto', -- 'auto' (from Duffel), 'manual' (uploaded), 'ocr' (scanned)
  raw_invoice_url TEXT,
  -- Reconciliation
  reconciled BOOLEAN DEFAULT FALSE,
  reconciled_with TEXT, -- Tally voucher number
  exported_to TEXT, -- 'tally', 'zoho'
  exported_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TRAVELER PREFERENCES (Carry-forward from Phase 3, org-scoped)
-- ============================================================

CREATE TABLE traveler_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES org_members(id) ON DELETE CASCADE NOT NULL,
  -- Carried forward from Phase 3 user_preferences
  preferred_airlines JSONB DEFAULT '[]',
  preferred_departure_window TEXT DEFAULT 'morning', -- 'early_morning', 'morning', 'afternoon', 'evening'
  seat_preference TEXT DEFAULT 'no_preference', -- 'aisle', 'window', 'no_preference'
  meal_preference TEXT,
  bag_preference TEXT DEFAULT 'cabin_only',
  price_sensitivity FLOAT DEFAULT 0.5,
  -- Learned patterns
  frequent_routes JSONB DEFAULT '[]', -- [{origin: 'BLR', destination: 'DEL', count: 12}]
  booking_lead_time_avg FLOAT, -- average days before departure
  -- Confidence
  total_bookings INTEGER DEFAULT 0,
  preference_confidence FLOAT DEFAULT 0.0, -- 0.0 to 1.0
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, member_id)
);

-- ============================================================
-- WHATSAPP SESSION MANAGEMENT
-- ============================================================

CREATE TABLE whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT NOT NULL, -- WhatsApp sender number
  org_id UUID REFERENCES organizations(id),
  member_id UUID REFERENCES org_members(id),
  -- Session state
  state TEXT DEFAULT 'idle', -- 'idle', 'searching', 'selecting', 'confirming', 'awaiting_approval'
  context JSONB DEFAULT '{}', -- current conversation context (parsed intent, selected offer, etc.)
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Binding
  verified BOOLEAN DEFAULT FALSE, -- phone verified to member
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(phone_number)
);

-- ============================================================
-- ANALYTICS & REPORTING
-- ============================================================

CREATE TABLE booking_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  period TEXT NOT NULL, -- '2026-02', '2026-Q1', '2026'
  period_type TEXT NOT NULL, -- 'month', 'quarter', 'year'
  -- Metrics
  total_bookings INTEGER DEFAULT 0,
  total_spend DECIMAL(12,2) DEFAULT 0,
  avg_booking_value DECIMAL(10,2) DEFAULT 0,
  policy_compliance_rate FLOAT DEFAULT 0, -- 0.0 to 1.0
  avg_advance_booking_days FLOAT DEFAULT 0,
  gst_itc_recovered DECIMAL(10,2) DEFAULT 0,
  -- Savings
  estimated_savings DECIMAL(10,2) DEFAULT 0, -- vs benchmark
  savings_vs_last_period DECIMAL(10,2) DEFAULT 0,
  -- Breakdown
  top_routes JSONB DEFAULT '[]',
  top_airlines JSONB DEFAULT '[]',
  spend_by_department JSONB DEFAULT '{}',
  bookings_by_channel JSONB DEFAULT '{}', -- {'whatsapp': 45, 'web': 10, 'admin': 5}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, period, period_type)
);
```

### 2.2 Row Level Security (Critical for Multi-Tenancy)

```sql
-- Every table with org_id gets these RLS policies:
-- 1. Users can only see data from their own organization
-- 2. Admins/travel_managers can see all org data
-- 3. Employees can only see their own bookings/preferences

-- Example for corp_bookings:
ALTER TABLE corp_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members see own org bookings" ON corp_bookings
  FOR SELECT USING (
    org_id IN (
      SELECT om.org_id FROM org_members om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY "Employees see own bookings only" ON corp_bookings
  FOR SELECT USING (
    member_id IN (
      SELECT om.id FROM org_members om
      WHERE om.user_id = auth.uid()
        AND om.role = 'employee'
    )
    OR
    org_id IN (
      SELECT om.org_id FROM org_members om
      WHERE om.user_id = auth.uid()
        AND om.role IN ('admin', 'travel_manager')
    )
  );
```

---

## 3. The Policy Engine (Core IP)

### 3.1 How It Works

The policy engine evaluates every booking request in two layers:

**Layer 1 — Deterministic Rules (hard enforcement)**
```
IF cabin_class == 'business' AND seniority NOT IN ['director', 'vp', 'c_suite']:
  → BLOCK or WARN (based on policy_mode)
  → Message: "Business class is not available for your role. Economy and Premium Economy are available."

IF total_amount > per_trip_limit:
  → REQUIRE_APPROVAL
  → Route to reports_to or travel_manager

IF advance_booking_days < minimum:
  → WARN
  → Message: "Booking less than 3 days before departure. Consider booking earlier for better fares."
```

**Layer 2 — LLM Interpretation (soft guidance)**

For edge cases and natural language policy queries:
- Employee: "Can I upgrade to business for my 6-hour Bangalore to Delhi flight?"
- AI: "Your company policy allows Economy for individual contributors. However, for flights over 4 hours, you can request an exception from your manager. Shall I send an approval request?"

### 3.2 Policy Evaluation Flow

```
User Request ("Book BLR-DEL Monday morning")
    │
    ▼
Parse Intent (Gemini)
    │
    ▼
Load User Context (member role, seniority, org policy)
    │
    ▼
Search Flights (Duffel API)
    │
    ▼
┌─── Policy Filter ───────────────────────────┐
│                                              │
│  For each flight result:                     │
│    1. Check cabin class vs. allowed          │
│    2. Check price vs. spend limits           │
│    3. Check airline vs. preferred/blocked    │
│    4. Check advance booking requirement      │
│    5. Mark: COMPLIANT / WARNING / BLOCKED    │
│                                              │
│  Sort: compliant first, then by preference   │
│  score (carry-forward from Phase 3)          │
└──────────────────────────────────────────────┘
    │
    ▼
IF all results within policy → Show options → Book on confirm
IF best result needs approval → Show + "Requires manager approval"
IF requested option blocked → Show compliant alternatives + explain why
```

---

## 4. WhatsApp Integration (Hero Feature)

### 4.1 Technical Architecture

Use **WhatsApp Business Cloud API** (free for business-initiated conversations within 24h of user message, ~₹0.35-0.85 per business-initiated template message outside the window).

```
Employee Phone → WhatsApp Cloud API → Webhook (our API) → Process → Reply
```

**Key API routes:**
- `POST /api/whatsapp/webhook` — receives all incoming messages
- `POST /api/whatsapp/send` — sends replies (text, interactive lists, buttons)
- `GET /api/whatsapp/webhook` — verification endpoint (Meta requires this)

### 4.2 Conversation Flows

**Flow 1: First-time registration**
```
Employee: "Hi"
Bot: "👋 Welcome to SkySwift! I'm your company's AI travel assistant.

To get started, please share your work email so I can connect you to your company's travel account."

Employee: "raman@acmecorp.com"
Bot: "Found you! You're part of Acme Corp. I've sent a verification code to your email. Please share it here."

Employee: "483921"
Bot: "✅ Verified! You're all set, Raman.

I can help you:
✈️ Book flights
📋 Check your bookings
🔄 Change or cancel trips
📊 View your travel summary

Just tell me where you need to go!"
```

**Flow 2: Booking a flight**
```
Employee: "Book me a flight to Delhi next Monday morning"
Bot: "🔍 Searching BLR → DEL for Monday, Feb 23...

Here are the best options within Acme Corp policy:

1️⃣ ✅ IndiGo 6E-234
   06:15 → 09:00 | Direct | 2h 45m
   ₹4,850 | Economy
   🏷️ RECOMMENDED (matches your preferences)

2️⃣ Air India AI-505
   08:30 → 11:15 | Direct | 2h 45m
   ₹5,200 | Economy

3️⃣ Vistara UK-821
   07:00 → 09:50 | Direct | 2h 50m
   ₹5,680 | Economy

Reply 1, 2, or 3 to book."

Employee: "1"
Bot: "📋 Booking Summary:

✈️ IndiGo 6E-234 | BLR → DEL
📅 Mon, Feb 23 | 06:15 - 09:00
👤 Raman Kumar
💰 ₹4,850 (Economy)
✅ Within Acme Corp travel policy

Confirm booking? Reply YES to proceed."

Employee: "Yes"
Bot: "✅ Booked! PNR: ABC123

📧 Confirmation sent to raman@acmecorp.com
🎫 E-ticket attached
📊 GST Invoice: GSTIN captured ✓

Need anything else?"
```

**Flow 3: Out-of-policy request**
```
Employee: "Book me business class to Mumbai"
Bot: "I found business class options for BLR → BOM, but your company's travel policy allows Economy class for your role.

Here's what I can do:
1️⃣ Book Economy (within policy) — from ₹3,200
2️⃣ Request exception from your manager for Business class — ₹12,400

Reply 1 or 2."

Employee: "2"
Bot: "📤 Exception request sent to Priya Singh (your manager) via WhatsApp.

Reason needed — why do you need Business class?"

Employee: "Client presentation, need to arrive fresh"
Bot: "Got it. Request sent to Priya with your reason. I'll notify you once approved. ⏳

Meanwhile, shall I hold the Economy option as a backup?"
```

**Flow 4: Manager approval (on manager's WhatsApp)**
```
Bot → Manager: "📋 Travel Approval Request

Raman Kumar requests an exception:

✈️ BLR → BOM | Business Class
💰 ₹12,400 (Economy would be ₹3,200)
📋 Reason: Client presentation, need to arrive fresh

Reply APPROVE or REJECT"

Manager: "Approve"
Bot → Manager: "✅ Approved. Booking Raman on Business class."
Bot → Employee: "🎉 Your manager approved Business class! Booking now...

✅ Booked! Vistara UK-843 | Business | PNR: XYZ789"
```

### 4.3 Interactive Message Types

WhatsApp Business API supports rich interactive messages:
- **Text messages** — for conversational responses
- **Interactive lists** — for showing 3-10 flight options (users tap to select)
- **Interactive buttons** — for yes/no confirmations (max 3 buttons)
- **Template messages** — for proactive notifications (booking confirmations, approval requests, reminders)
- **Document messages** — for sending e-tickets and GST invoices as PDFs

---

## 5. Landing Page & Marketing Site

### 5.1 Design Philosophy

Move from consumer app aesthetic (Liquid Glass, playful) to enterprise SaaS credibility (clean, professional, trust-building). Reference: tryskylink.com, itilite.com, navan.com.

The landing page must serve TWO audiences simultaneously:
- **Decision maker** (CFO/Admin): "Save 15% on travel costs, recover GST credits, enforce policy automatically"
- **End user** (Employee): "Book flights in 30 seconds on WhatsApp. No more painful corporate tools."

### 5.2 Page Structure

```
/ (Landing Page)
├── Hero: "Your AI Travel Desk. 30 Seconds. WhatsApp."
│   └── CTA: "Start Free Pilot" + "See It In Action" (demo video)
├── Problem Statement: "60% of Indian corporate travel flows through offline agents..."
├── How It Works: 3-step visual (Message → AI finds options → Book with one tap)
├── Dual Value: Split-screen
│   ├── Left: "For Travel Managers" (policy, compliance, analytics, GST)
│   └── Right: "For Employees" (WhatsApp, 30s booking, preferences, zero friction)
├── Features Grid: Policy Engine, GST Compliance, Spend Analytics, Preference Learning
├── WhatsApp Demo: Interactive mockup showing a real booking conversation
├── Pricing: Free / Growth / Enterprise tiers
├── Trust: "Built by ex-Booking.com & Amadeus" + pilot company logos
├── FAQ
└── Footer CTA: "Start Your Free Pilot — 20 Bookings/Month"

/login → Supabase auth (for admin dashboard)
/signup → Company onboarding flow
/dashboard → Admin/Travel Manager dashboard (protected)
/dashboard/bookings → All organization bookings
/dashboard/employees → Employee management
/dashboard/policy → Policy configuration
/dashboard/analytics → Spend analytics + GST report
/dashboard/settings → Org settings, billing, integrations
/book → Employee web booking (authenticated)
/book/history → Employee booking history
```

---

## 6. GST Compliance Engine (India Moat)

### 6.1 Why This Matters

Indian corporates can recover 5-12% GST paid on business travel as Input Tax Credit (ITC). But most lose this because:
- Airlines provide GST invoices buried in emails
- Travel agents don't pass through proper GSTIN-bearing invoices
- Manual collection is error-prone (wrong GSTIN, missing SAC codes)
- Finance teams can't reconcile invoices to bookings at quarter-end

**SkySwift's GST engine automates the entire chain:**

```
Booking Made
    → Capture GSTIN at booking time (org's GSTIN from settings)
    → Duffel returns airline's GSTIN + invoice data
    → Auto-generate GST-compliant invoice entry
    → Map SAC code (996411 for air transport)
    → Determine CGST+SGST (intra-state) vs IGST (inter-state)
    → Store in gst_invoices table
    → Export-ready for Tally/Zoho at any time
```

### 6.2 Tally Integration (Phase 4.5)

Most Indian SMBs use Tally (60%+ market share). Export format:
- CSV/XML export matching Tally import format
- Voucher entries: Purchase voucher per booking with GST breakup
- Monthly reconciliation report

For MVP: Generate downloadable CSV in Tally-compatible format. Later: direct Tally API integration.

---

## 7. Implementation Plan — Phase 4

### 7.1 Phase Summary

| Phase | Focus | Status |
|-------|-------|--------|
| Phase 1 | MVP: Conversational booking engine, Amadeus integration | ✅ COMPLETED |
| Phase 2 | Production: Duffel supply, pricing, Liquid Glass UX, live mode | ✅ COMPLETED |
| Phase 2.5 | Intelligence: NLP upgrades, context parsing | ✅ COMPLETED |
| Phase 3 | Preference Engine: onboarding, Flight DNA, scoring, demo | ✅ COMPLETED |
| **Phase 4** | **Corporate Pivot: B2B platform, WhatsApp, policy, GST, admin** | 🔵 CURRENT |
| Phase 4.5 | Scale: Slack/Teams, hotels, Tally API, ground transport | 📋 PLANNED |

### 7.2 Workstreams & Prompts (10 Weeks)

> **How to use:** Tell Claude Code: `"Read PRD-Phase4.md. Execute P4-XX."` Claude Code has full context from the PRD and builds accordingly.

---

#### Workstream 1: Foundation Reset (Week 1)

Restructure the existing codebase for multi-tenant B2B. Keep the tech stack, refactor the architecture.

---

**P4-01 — Database Migration & Multi-Tenant Foundation**

```
Context: Read PRD-Phase4.md section 2 (Database Schema) completely.

We are pivoting SkySwift from B2C to B2B corporate travel. The existing app has:
- Next.js 14 with App Router
- Supabase for auth + database
- Duffel for flight search/booking
- Razorpay for payments
- Gemini 2.0 Flash for conversational AI
- Tailwind CSS + Liquid Glass design system

TASK: Create the multi-tenant database foundation.

1. Create a new Supabase migration file that adds ALL the tables from PRD-Phase4.md
   section 2.1:
   - organizations
   - org_members
   - travel_policies
   - corp_bookings
   - approval_requests
   - gst_invoices
   - traveler_preferences (new version with org_id)
   - whatsapp_sessions
   - booking_analytics

2. Set up Row Level Security (RLS) policies on every new table:
   - All queries filter by org_id
   - Employees see only their own bookings
   - Admins/travel_managers see all org data
   - Use auth.uid() to resolve current user → org_member → org_id

3. Create indexes for performance:
   - org_members(org_id, email)
   - org_members(phone)
   - corp_bookings(org_id, member_id)
   - corp_bookings(org_id, status)
   - corp_bookings(departure_date)
   - whatsapp_sessions(phone_number)
   - gst_invoices(org_id, reconciled)

4. Create a seed file with:
   - 1 demo organization: "Acme Technologies" with slug "acme-tech",
     domain "acmetech.com", GSTIN "29AABCT1234F1ZP"
   - 5 demo members: 1 admin, 1 travel_manager, 3 employees with
     different seniority levels
   - 1 default travel policy with realistic Indian corporate rules
   - 5 sample bookings across the members
   - 3 sample GST invoices

5. DO NOT delete old Phase 1-3 tables yet. We'll deprecate them gradually.

6. Create TypeScript types in /types/organization.ts for all new tables
   using the Supabase generated types pattern we already use.

Verify: Run the migration. Check all tables exist with correct columns.
Check RLS policies are active. Check seed data is queryable.
```

---

**P4-02 — Auth Refactor: Organization-Based Signup & Login**

```
Context: Read PRD-Phase4.md sections 1.1 and 5.2.

Refactor auth from individual signup to organization-based:

1. NEW ROUTE: /signup — Company onboarding flow (multi-step):
   Step 1: Company details
     - Company name
     - Work email (used to infer domain)
     - Phone number
     - Industry (dropdown)
     - Approximate employee count
   Step 2: Admin profile
     - Full name
     - Designation
     - This person becomes the org admin
   Step 3: Travel basics
     - GSTIN (optional but highlighted as "unlock 12-18% GST savings")
     - Primary travel routes (BLR-DEL, BOM-DEL, etc. — multi-select chips)
     - Monthly travel volume estimate
   Step 4: Confirmation
     - Summary of setup
     - "Start Free Pilot — 20 bookings/month"
     - Auto-create: organization + first org_member (role: admin) + default travel_policy

   Design: Clean, professional, trust-building. White background, blue accents.
   Progress stepper at top. Mobile-responsive. NOT the consumer Liquid Glass
   style — this is enterprise SaaS.

2. MODIFY: /login — Standard email/password login via Supabase Auth.
   After login, resolve user → org_member → organization.
   If user belongs to multiple orgs (future), show org picker.
   Redirect to /dashboard after login.

3. NEW: Invite flow
   Create /api/org/invite endpoint:
   - Admin sends invite with name + email + role
   - Creates org_member record with status: 'invited'
   - Sends email via Resend with signup link containing invite token
   - When invited user signs up, they're auto-joined to the org

4. NEW: Employee self-registration
   If user signs up with email matching an org's domain AND there's a
   pending invite → auto-join the org.

5. Update middleware.ts to:
   - Protect /dashboard/* routes (require auth + org membership)
   - Protect /book/* routes (require auth + employee role)
   - Allow / and /login and /signup publicly

6. Create a React context: OrgContext that provides current org and member
   data to all protected pages. Load once on auth, cache in state.

Design style: Professional SaaS. Think Linear, Notion, or ITILITE's
signup flow. Clean typography, ample white space, trust badges.
No glassmorphism on these pages.
```

---

#### Workstream 2: Landing Page & Marketing (Week 2)

---

**P4-03 — B2B Landing Page**

```
Context: Read PRD-Phase4.md section 5.

Build a new landing page at / that replaces the current B2C page.
Reference sites for design direction: tryskylink.com, itilite.com, navan.com

IMPORTANT: This page must convert TWO audiences:
- Decision makers (CFOs, HR heads): cost savings, compliance, GST recovery
- End users (employees): speed, WhatsApp-native, zero friction

Page structure (single page, smooth scroll):

1. NAVBAR
   - Logo (SkySwift — keep existing logo or use text logo for now)
   - Links: How It Works | For Companies | For Employees | Pricing
   - CTA button: "Start Free Pilot" → /signup

2. HERO SECTION
   - Headline: "Your AI Travel Desk. 30 Seconds. WhatsApp."
   - Subheadline: "SkySwift replaces your travel desk with an AI agent that
     books flights in 30 seconds, enforces policy automatically, and recovers
     12-18% in GST credits. Starting free."
   - Two CTAs: "Start Free Pilot" (primary, blue) + "Watch Demo" (secondary, outline)
   - Hero visual: Animated mockup of a WhatsApp conversation showing a booking
     flow. Use a phone frame with message bubbles. Can be a static image/SVG
     for MVP that looks like a WhatsApp chat.
   - Trust bar below hero: "Built by ex-Booking.com & Amadeus team"

3. PROBLEM SECTION
   - "60% of Indian corporate travel flows through offline agents with no
     technology, no policy, and no visibility."
   - Three pain-point cards:
     a) "₹0 GST recovered" — Most companies lose 12-18% in unclaimed ITC
     b) "10+ minutes per booking" — Employees waste time on clunky OBTs
     c) "Zero spend visibility" — CFOs can't see where travel money goes

4. HOW IT WORKS (3 steps)
   Step 1: "Message your AI travel agent" — WhatsApp icon + message bubble
   Step 2: "AI finds the best flights within policy" — policy shield icon
   Step 3: "Confirm with one tap" — checkmark + booking confirmation

5. DUAL VALUE SECTION (split screen or tabs)
   Left/Tab 1: "For Travel Managers & Finance"
   - Policy enforcement on autopilot
   - Real-time spend dashboard
   - GST compliance & ITC tracking
   - Employee management & approval workflows
   - Screenshot/mockup of admin dashboard

   Right/Tab 2: "For Employees"
   - Book on WhatsApp — no app to install
   - 30-second booking with AI
   - Preferences remembered from day one
   - Instant confirmations & e-tickets
   - Screenshot/mockup of WhatsApp conversation

6. FEATURES GRID (2x3 or 3x2)
   - AI Booking Agent: Natural language booking via WhatsApp
   - Policy Engine: Automatic compliance checking
   - GST Compliance: Auto-capture invoices, ITC tracking
   - Spend Analytics: Real-time dashboards
   - Preference Learning: Gets smarter with every booking
   - Approval Workflows: Manager approvals via WhatsApp

7. PRICING SECTION
   Three tiers (use cards):
   - Free: 20 bookings/month, basic policy, WhatsApp bot, GST capture
   - Growth (₹15,000-50,000/mo): Unlimited bookings, advanced policy,
     analytics, Tally export, expense management
   - Enterprise (Custom): Multi-entity, API, SSO, dedicated support

8. SOCIAL PROOF / TRUST
   - "Backed by Y Combinator" (when applicable) or "Applying to YC S26"
   - Founder credentials: "Built by ex-Booking.com & Amadeus"
   - Any pilot company logos (add later)
   - Security badges: "Data encrypted at rest & transit" "India data residency"

9. FAQ (accordion)
   - How does WhatsApp booking work?
   - What airlines do you support?
   - How is GST compliance handled?
   - What happens if a booking is out of policy?
   - How do I add employees?
   - Is my data secure?
   - What does the free plan include?

10. FOOTER CTA
    - "Start your free pilot today. 20 bookings on us."
    - Email input + "Get Started" button → /signup
    - Standard footer: links, social, copyright

Design requirements:
- Professional SaaS aesthetic. White/light gray backgrounds.
- Primary color: Blue (#2563EB). Accent: Cyan (#06B6D4).
- Dark navy (#0F1B2D) for headers.
- Clean sans-serif typography (Inter or system fonts).
- Subtle animations on scroll (fade-in sections). Use framer-motion.
- Mobile-first responsive. The page MUST look great on mobile.
- Fast: target 90+ Lighthouse performance. Use next/image, lazy loading.
- NO Liquid Glass / glassmorphism on the landing page. Save that aesthetic
  for the internal product if at all.

Tech: This is a standard Next.js page at app/page.tsx. Use Tailwind for
styling. Framer-motion for scroll animations. No external component libraries
unless absolutely needed (shadcn/ui is fine if already installed).
```

---

#### Workstream 3: WhatsApp Bot (Weeks 3-4)

---

**P4-04 — WhatsApp Business API Integration**

```
Context: Read PRD-Phase4.md section 4.

Set up the WhatsApp Business Cloud API integration. This is the PRIMARY
booking interface for employees.

Prerequisites (I will set up manually, but create the code that uses them):
- Meta Business account with WhatsApp Business API access
- WhatsApp Business phone number
- Permanent access token (stored in env as WHATSAPP_ACCESS_TOKEN)
- Webhook verify token (stored as WHATSAPP_VERIFY_TOKEN)
- Phone Number ID (stored as WHATSAPP_PHONE_NUMBER_ID)

BUILD:

1. Webhook endpoints:
   GET /api/whatsapp/webhook — verification endpoint for Meta
   POST /api/whatsapp/webhook — receives all incoming messages

2. WhatsApp service module at /lib/whatsapp.ts:
   - sendTextMessage(to, text) — send plain text
   - sendInteractiveList(to, header, body, sections) — send option lists
   - sendInteractiveButtons(to, body, buttons) — send 1-3 button options
   - sendTemplate(to, templateName, params) — send pre-approved templates
   - sendDocument(to, documentUrl, filename, caption) — send PDF attachments
   - markAsRead(messageId) — mark message as read (shows blue ticks)

3. Message handler at /lib/whatsapp-handler.ts:
   This is the brain. For each incoming message:
   a) Extract sender phone number
   b) Look up whatsapp_sessions table by phone number
   c) If no session → start registration flow
   d) If session exists but not verified → continue registration
   e) If session verified → route to appropriate handler based on state:
      - 'idle' → parse intent with Gemini
      - 'searching' → should not receive here (async search in progress)
      - 'selecting' → user is picking from flight options (expect: "1", "2", "3")
      - 'confirming' → user confirming booking (expect: "yes"/"no")
      - 'awaiting_approval' → user's booking needs approval, can check status

4. Session management:
   - Each WhatsApp number maps to one session
   - Session stores current conversation state in context JSONB
   - Sessions auto-expire after 30 minutes of inactivity (reset to 'idle')
   - On new message, update last_message_at

5. Error handling:
   - If Gemini fails → send "Sorry, I didn't understand that. Try: 'Book BLR to DEL Monday'"
   - If Duffel fails → send "Flight search is temporarily unavailable. Please try again in a few minutes."
   - If unregistered number → guide through registration
   - Rate limit: max 20 messages per minute per number

6. Logging:
   - Log every incoming message and outgoing response to a new table:
     whatsapp_message_log(id, phone_number, direction, message_type, content, created_at)
   - This is critical for debugging and improving the AI

Create comprehensive TypeScript types for WhatsApp API message formats
(incoming webhook events, outgoing message payloads).

DO NOT actually call the WhatsApp API in development. Create a mock mode
(WHATSAPP_MOCK=true in env) that logs messages to console instead of sending.
This lets us test the entire flow without a real WhatsApp Business account.

Also create a test page at /dev/whatsapp-simulator that mimics WhatsApp:
- Input field to send messages
- Shows bot responses
- Displays session state
- Only accessible in development mode
```

---

**P4-05 — Conversational AI: Intent Parsing for Corporate Context**

```
Context: Read PRD-Phase4.md sections 3 and 4.2.

Refactor the Gemini intent parser for corporate travel context.
The existing parser handles basic flight search intents. We need to add:

1. Update the Gemini system prompt at /lib/ai/system-prompt.ts:

   New system prompt must handle:
   - Flight booking intents: "Book BLR to DEL Monday morning"
   - Flight search intents: "Show me flights to Mumbai tomorrow"
   - Policy questions: "Can I book business class?", "What's my travel limit?"
   - Booking management: "Cancel my Delhi flight", "Change to Thursday"
   - Status checks: "What's my booking status?", "Any pending approvals?"
   - Expense queries: "How much have I spent this month?"
   - Preference updates: "I always want aisle seat", "Prefer IndiGo"
   - Help/meta: "What can you do?", "Help"
   - Approval responses: "Approve", "Reject" (from managers)
   - Greeting/small talk: "Hi", "Thanks"

   The prompt should make the AI respond as a professional but friendly
   corporate travel assistant. Not too casual (this is work), not too formal
   (this is WhatsApp). Think: "a really helpful travel desk colleague."

2. Create intent types at /types/intent.ts:

   type BookingIntent = {
     type: 'book_flight';
     origin?: string;       // airport code or city name
     destination: string;   // airport code or city name
     departure_date?: string; // ISO date or relative ("monday", "tomorrow")
     return_date?: string;
     time_preference?: 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'late_evening';
     cabin_class?: string;
     passengers?: number;    // default 1
     special_requests?: string[];
   };

   type PolicyQuestionIntent = { type: 'policy_question'; question: string; };
   type BookingManagementIntent = { type: 'manage_booking'; action: 'cancel' | 'change' | 'status'; booking_ref?: string; };
   type ApprovalResponseIntent = { type: 'approval_response'; action: 'approve' | 'reject'; booking_id?: string; reason?: string; };
   type ExpenseQueryIntent = { type: 'expense_query'; period?: string; };
   type PreferenceUpdateIntent = { type: 'preference_update'; preferences: Record<string, any>; };
   type HelpIntent = { type: 'help' };
   type GreetingIntent = { type: 'greeting' };
   type UnknownIntent = { type: 'unknown'; raw_message: string; };

3. Create the intent router at /lib/ai/intent-router.ts:
   Takes parsed intent + whatsapp session + org context → executes action
   → returns WhatsApp message to send back.

   Each intent type maps to a handler function:
   - book_flight → search Duffel → filter by policy → format as WhatsApp list
   - policy_question → load org policy → ask Gemini to answer in context
   - manage_booking → load booking → handle cancel/change
   - approval_response → update approval_request → notify requester
   - etc.

4. Context-aware parsing:
   The parser must receive the user's org context:
   - member name, role, seniority
   - org name, policy summary
   - recent bookings (last 3)
   - preferences
   This context is injected into the Gemini prompt so it can give
   personalized, policy-aware responses.

5. Create a conversation memory buffer:
   Store last 10 messages in the whatsapp_session context.
   Send them as conversation history to Gemini so it can handle
   multi-turn conversations:
   - "Book Delhi Monday" → shows options
   - "The morning one" → understands reference to previous options
   - "Actually, make it Tuesday" → modifies the search

Test with the /dev/whatsapp-simulator from P4-04.
```

---

**P4-06 — Corporate Booking Flow (WhatsApp + Policy + Payment)**

```
Context: Read PRD-Phase4.md sections 3, 4, and 2.1 (corp_bookings table).

Build the complete booking flow that connects WhatsApp → Policy → Duffel → Payment → Confirmation.

1. Flight Search with Policy Filter:
   /api/flights/corporate-search
   - Receives: parsed intent + org_id + member_id
   - Loads: travel_policy for the org
   - Searches: Duffel API with the intent params
   - Filters: Apply policy rules to each result
     * Mark each result as 'compliant', 'warning', or 'blocked'
     * Add policy_violations array to blocked/warning results
     * Filter out blocked results if policy_mode is 'hard'
   - Scores: Apply preference scoring (from Phase 3) to compliant results
   - Returns: Top 3-5 results, sorted by: compliant first, then preference score

2. Booking Creation:
   /api/flights/corporate-book
   - Receives: selected Duffel offer_id + member_id + org_id
   - Checks: Policy compliance one final time
   - If needs approval (over limit or out-of-policy):
     * Create corp_booking with status 'pending_approval'
     * Create approval_request targeting member's reports_to
     * Send WhatsApp message to approver
     * Send WhatsApp message to requester: "Sent for approval"
     * Return early — booking completes when approved
   - If auto-approved:
     * Initiate Razorpay payment (if org pays per-booking) OR
       mark as invoiced (if org pays monthly)
     * Call Duffel create order API
     * Create corp_booking with status 'booked'
     * Create gst_invoices entry with airline GST details
     * Update traveler_preferences (increment booking count, update patterns)
     * Update booking_analytics (increment counters)
     * Send confirmation via WhatsApp (text + PDF e-ticket attachment)
     * Send email confirmation to member's email

3. Approval Flow:
   /api/approvals/respond
   - When approver responds (via WhatsApp or dashboard):
     * If approved → proceed with booking (payment + Duffel + confirmation)
     * If rejected → update corp_booking status to 'rejected'
       → notify requester via WhatsApp with rejection reason
   - Auto-expire: If no response in 24h, auto-escalate to travel_manager

4. Booking Management:
   /api/flights/corporate-cancel
   - Cancel via Duffel API
   - Update corp_booking status
   - Handle refund via Razorpay if applicable
   - Notify member via WhatsApp

5. Format WhatsApp responses:
   Create /lib/whatsapp-formatters.ts with functions:
   - formatFlightResults(results, policy_violations) → WhatsApp interactive list
   - formatBookingConfirmation(booking) → WhatsApp text with rich formatting
   - formatApprovalRequest(booking, requester) → WhatsApp buttons (Approve/Reject)
   - formatPolicyViolation(violations) → explanation message

6. Create PDF generators:
   /lib/pdf/booking-confirmation.ts → generates a clean booking confirmation PDF
   /lib/pdf/gst-invoice.ts → generates a GST-compliant invoice PDF
   (Use a simple PDF library like pdf-lib or jspdf. Keep it minimal.)

Ensure all database writes include org_id. Every booking must have a complete
audit trail (who booked, when, which channel, policy compliance status).
```

---

#### Workstream 4: Admin Dashboard (Weeks 5-6)

---

**P4-07 — Admin Dashboard: Layout, Navigation, Organization Overview**

```
Context: Read PRD-Phase4.md section 5.2.

Build the admin dashboard at /dashboard. This is the travel manager's
command center.

1. Dashboard Layout (/app/dashboard/layout.tsx):
   - Left sidebar navigation (collapsible on mobile):
     * Logo (SkySwift)
     * Overview (home icon)
     * Bookings (plane icon)
     * Employees (people icon)
     * Policy (shield icon)
     * Analytics (chart icon)
     * GST & Invoices (receipt icon)
     * Settings (gear icon)
   - Top bar: org name, user name + role badge, notifications bell, logout
   - Main content area (right side)

   Design: Clean, professional dashboard aesthetic. White sidebar with subtle
   gray borders. Think Linear or Notion's dashboard. NOT Liquid Glass.
   Use shadcn/ui components if available, or build clean Tailwind components.
   Color scheme: White background, Navy text (#0F1B2D), Blue accents (#2563EB),
   Green for positive metrics, Red for alerts.

2. Overview Page (/app/dashboard/page.tsx):
   Top KPI cards (4 across):
   - Total Bookings (this month) with trend vs last month
   - Total Spend (this month) in ₹
   - Policy Compliance Rate (%)
   - GST ITC Recovered (₹)

   Activity Feed:
   - Recent bookings (last 10) with member name, route, amount, status
   - Pending approvals (if any, highlighted in yellow)
   - Flagged bookings (out-of-policy, highlighted in red)

   Quick Charts (use Recharts, already in the project or install):
   - Monthly spend trend (last 6 months bar chart)
   - Bookings by channel (pie: WhatsApp vs Web vs Admin)
   - Top 5 routes (horizontal bar)

3. All dashboard pages must:
   - Load data from Supabase with org_id filter
   - Show loading skeletons while fetching
   - Handle empty states gracefully ("No bookings yet. Share the WhatsApp
     bot with your team to get started!")
   - Be responsive — usable on tablet at minimum

4. Create reusable dashboard components in /components/dashboard/:
   - StatCard (value, label, trend, icon)
   - DataTable (sortable, paginated, filterable)
   - PageHeader (title, description, action buttons)
   - EmptyState (icon, message, CTA)
   - StatusBadge (booked, pending, cancelled, etc. with colors)

Use server components where possible. Client components only for
interactive elements (charts, filters, modals).
```

---

**P4-08 — Admin: Employee Management & Policy Configuration**

```
Context: Read PRD-Phase4.md sections 1.1, 2.1, and 3.

Build the employee management and policy configuration pages.

1. Employees Page (/app/dashboard/employees/page.tsx):
   - Table showing all org members:
     * Name, Email, Phone, Department, Role, Seniority, Status, Bookings Count
   - Filters: by role, by department, by status
   - Search: by name or email
   - Actions:
     * "Invite Employee" button → modal with: name, email, phone, department,
       role (dropdown), seniority (dropdown)
     * Edit member (click row → slide-over panel)
     * Deactivate member
     * Resend invite
   - Bulk invite: CSV upload (name, email, phone, department, role)
   - Show WhatsApp registration status (green badge if connected)

2. Policy Page (/app/dashboard/policy/page.tsx):
   Visual policy editor — NOT raw JSON editing. Use form controls.

   Sections (each in its own card):

   a) Flight Rules:
      - Default cabin class (dropdown: Economy, Premium Economy, Business)
      - Cabin class overrides by seniority (table: seniority level → allowed classes)
      - Preferred airlines (multi-select chips: IndiGo, Air India, Vistara, SpiceJet, etc.)
      - Blocked airlines (multi-select)
      - Maximum stops (dropdown: Direct only, 1 stop, Any)
      - Max flight price (₹ input, per domestic / per international)
      - Allow refundable fares only (toggle)

   b) Spend Limits:
      - Per-trip limit (₹)
      - Per-month limit per employee (₹)
      - Override by seniority (table)

   c) Approval Rules:
      - Auto-approve bookings under ₹ (input)
      - Require approval above ₹ (input)
      - Out-of-policy handling: Soft (warn but allow) / Hard (block)
      - Approval timeout (hours)
      - Auto-escalate on timeout (toggle)

   d) Booking Rules:
      - Minimum advance booking days
      - Recommended advance booking days
      - Show early booking savings message (toggle)

   Save button → updates travel_policies table.
   Show "Policy updated" toast on save.
   Show policy preview: "Based on your settings, an IC employee can book
   Economy class up to ₹X per trip, auto-approved. Directors can book
   Business class."

3. Create a policy evaluation helper at /lib/policy/evaluate.ts:
   Input: (flight_offer, member, policy) → Output: { compliant, violations[] }
   This function is used by both the WhatsApp flow and the web booking flow.
   Must be deterministic — no LLM calls. Pure rule evaluation.

   Export it so P4-06's corporate search endpoint can import and use it.
```

---

**P4-09 — Admin: Bookings Table, GST Dashboard, Analytics**

```
Context: Read PRD-Phase4.md sections 2.1 and 6.

Build the remaining admin dashboard pages.

1. Bookings Page (/app/dashboard/bookings/page.tsx):
   - Full table of all organization bookings with:
     * Date, Traveler, Route, Airline, Amount, Status, Policy (✅/⚠️/❌), Channel
   - Filters: by status, by date range, by member, by policy compliance
   - Sort: by date (default: newest first), by amount, by traveler
   - Click row → booking detail slide-over:
     * Full flight details
     * Policy compliance details (which rules checked, pass/fail)
     * Payment details
     * GST invoice details
     * Approval history (if applicable)
     * Cancel/modify actions (if status allows)
   - Export to CSV button (for finance teams)
   - Pagination (20 per page)

2. GST & Invoices Page (/app/dashboard/gst/page.tsx):
   Top KPI cards:
   - Total GST Paid (this quarter)
   - ITC Eligible Amount
   - ITC Claimed
   - ITC Unclaimed (with "Export for Tally" CTA)

   Invoice table:
   - Booking ref, Date, Vendor (airline), Base Amount, CGST, SGST, IGST,
     Total GST, ITC Status, Reconciled
   - Filter by: quarter, reconciliation status, vendor
   - Export buttons:
     * "Download CSV (Tally-compatible)" → generates CSV with columns matching
       Tally's purchase voucher import format
     * "Download CSV (Zoho-compatible)" → same but Zoho format
     * "Download All Invoices (ZIP)" → zip of all GST invoice PDFs

   Create the CSV export logic in /lib/gst/export.ts:
   - Tally format: Date, Voucher Type, Party Name, GSTIN, Invoice No,
     Amount, CGST, SGST, IGST, SAC Code
   - Zoho format: similar but with Zoho-specific column names

3. Analytics Page (/app/dashboard/analytics/page.tsx):
   Charts and insights:
   - Monthly spend trend (line chart, last 12 months)
   - Spend by department (donut chart)
   - Top routes (horizontal bar, top 10)
   - Top travelers (table: who books most, who spends most)
   - Booking channel distribution (pie: WhatsApp / Web / Admin)
   - Policy compliance trend (line chart: % compliant over time)
   - Average advance booking days (with benchmark: "Your team books 5 days
     ahead on average. Booking 7+ days ahead could save ~15%.")
   - GST recovery rate (% of eligible ITC claimed)

   Use Recharts for all charts. Make them responsive.
   Data source: booking_analytics table for aggregates,
   corp_bookings table for detail queries.

   If no data yet: show a beautiful empty state with a call-to-action
   to share the WhatsApp bot with the team.
```

---

#### Workstream 5: Employee Web Interface (Week 7)

---

**P4-10 — Employee Web Booking & History**

```
Context: Read PRD-Phase4.md sections 1.2 and 5.2.

Build the employee-facing web interface. This is the SECONDARY booking
channel (WhatsApp is primary). Used for:
- Employees who prefer web over WhatsApp
- Viewing booking history and e-tickets
- Managing preferences

1. Employee Booking Page (/app/book/page.tsx):
   - Conversational chat interface (carry-forward from Phase 2, adapted)
   - Same Gemini-powered intent parsing as WhatsApp
   - Same policy enforcement as WhatsApp flow
   - Flight results shown as rich cards (airline, time, price, policy status)
   - One-click booking for in-policy flights
   - Show policy violations inline if out-of-policy
   - Payment via Razorpay (if per-booking) or instant (if invoiced)
   - Booking confirmation shown in chat + downloadable PDF

   Reuse the existing chat UI components from Phase 2 but restyle them:
   - Remove Liquid Glass effects (optional: subtle glassmorphism is OK)
   - Make it feel professional/corporate
   - Add org context: show company name, policy hints
   - Mobile-responsive (employees might use on phone browser)

2. Booking History (/app/book/history/page.tsx):
   - List of all employee's bookings
   - Status badges: upcoming, completed, cancelled, pending approval
   - Click to expand: full details + download e-ticket + download GST invoice
   - Filter by: status, date range

3. Preferences Page (/app/book/preferences/page.tsx):
   - Editable preference fields:
     * Preferred airlines (multi-select)
     * Preferred departure window (radio buttons)
     * Seat preference (aisle/window)
     * Meal preference
     * Bag preference
   - Show "learned" preferences from booking history (read-only):
     * "Your most-booked route: BLR → DEL (8 times)"
     * "You usually book 5 days ahead"
     * "You prefer IndiGo (chosen 6/8 times)"
   - These preferences feed into the preference scoring for both
     WhatsApp and web booking.

4. Navigation for employee pages:
   - Simple top nav: SkySwift logo | Book | My Trips | Preferences | Logout
   - No sidebar (unlike admin dashboard — keep it simple for employees)
```

---

#### Workstream 6: Integration, Testing, Demo Polish (Weeks 8-10)

---

**P4-11 — Demo Mode & Sandbox Environment**

```
Context: This is critical for the YC application and pilot sales calls.

Create a demo mode that showcases the full product without requiring
real WhatsApp setup or Duffel live credentials.

1. Demo Mode Toggle:
   Add DEMO_MODE=true environment variable.
   When enabled:
   - WhatsApp simulator is available at /demo/whatsapp
   - Flight searches return realistic mock data (not Duffel API)
   - Bookings create entries but don't call Duffel or Razorpay
   - All features work end-to-end with mock data

2. WhatsApp Demo (/app/demo/whatsapp/page.tsx):
   A pixel-perfect WhatsApp UI mockup in the browser:
   - Green header bar with "SkySwift AI" and avatar
   - Chat bubbles styled exactly like WhatsApp (gray for bot, green for user)
   - Input bar at bottom with send button
   - Messages route through the SAME intent parser and booking flow
     as real WhatsApp — just uses mock flight data
   - Interactive elements rendered as WhatsApp-style buttons/lists
   - This IS the demo you show to investors and pilot prospects

   Design requirements:
   - Must look exactly like a real WhatsApp conversation
   - Show the full flow: greeting → search → options → select → confirm → booked
   - Auto-suggest starter messages: "Book BLR to DEL Monday" button
   - Show policy enforcement: include an out-of-policy example flow
   - Show approval flow: simulate manager approval

3. Demo Dashboard:
   Pre-populate the admin dashboard with 3 months of realistic data:
   - 50+ mock bookings across 5 employees
   - Mix of compliant and out-of-policy bookings
   - GST invoices with ITC tracking
   - Analytics that show meaningful trends
   Create a seed script: /scripts/seed-demo-data.ts

4. One-Click Demo Setup:
   Create /app/demo/page.tsx — a landing page for demos:
   - "Try the WhatsApp Bot" → opens /demo/whatsapp
   - "See the Admin Dashboard" → opens /dashboard with demo data
   - "See Employee View" → opens /book with demo context
   Password-protect with a simple passphrase (DEMO_PASSWORD env var).

This demo must be IMPRESSIVE. It's the first thing investors and
prospects see. Every interaction should feel polished and fast.
```

---

**P4-12 — Automated Testing & QA**

```
Context: Following the same pattern as Phase 3 QA.

Run comprehensive automated testing across the entire Phase 4 build.
Fix all issues found before moving to the next category.

Test Categories:

1. BUILD HEALTH
   - npm run build succeeds with zero errors
   - npm run lint passes
   - TypeScript: zero type errors
   - All env variables documented in .env.example

2. DATABASE INTEGRITY
   - All Phase 4 tables exist with correct columns
   - RLS policies are active on all tables
   - Seed data loads correctly
   - Cross-table references (foreign keys) work
   - Demo data seed creates expected number of records

3. AUTH & MULTI-TENANCY
   - Signup creates org + admin member correctly
   - Login resolves user → member → org
   - Invite flow: invite → email → signup → auto-join works
   - RLS: user A cannot see user B's org data
   - Role-based access: employee can't access /dashboard/policy
   - Admin can access all dashboard pages

4. LANDING PAGE
   - All sections render correctly
   - Mobile responsive (test at 375px, 768px, 1024px, 1440px)
   - All CTAs link to correct pages
   - Images/illustrations load
   - Page load under 3 seconds
   - Lighthouse performance > 85

5. WHATSAPP FLOW (using simulator)
   - Registration: new number → email verify → success
   - Booking: search intent → results → select → confirm → booked
   - Policy violation: out-of-policy request → correct warning/block
   - Approval: request sent → manager approves → booking completes
   - Error handling: invalid input → helpful error message
   - Multi-turn: "Book Delhi Monday" → "The morning one" → understands context

6. POLICY ENGINE
   - Cabin class rules correctly enforce by seniority
   - Spend limits trigger approval requests at correct thresholds
   - Preferred airlines appear first in results
   - Blocked airlines are excluded
   - Soft mode warns but allows; hard mode blocks
   - Policy changes in dashboard take effect immediately

7. ADMIN DASHBOARD
   - All pages load without errors
   - KPI cards show correct data
   - Employee management: CRUD operations work
   - Policy editor: changes save correctly
   - Bookings table: filters, sort, pagination work
   - GST page: export generates valid CSV
   - Analytics: charts render with data

8. EMPLOYEE WEB BOOKING
   - Chat interface loads
   - Search → results → book flow works
   - Booking history shows all past bookings
   - Preferences save correctly
   - Policy enforcement matches WhatsApp flow

9. DEMO MODE
   - Demo WhatsApp simulator works end-to-end
   - Demo dashboard shows pre-populated data
   - Demo mode doesn't call real APIs
   - Demo is password-protected

10. SECURITY
    - No API keys exposed in client-side code
    - All API routes validate auth
    - org_id is never from client input (always from session)
    - No SQL injection vectors
    - CORS configured correctly

Generate a test report with pass/fail for each category.
Fix all failures before declaring Phase 4 complete.
```

---

**P4-13 — Final Polish, Performance & Deployment**

```
Context: Last prompt. Make everything production-ready.

1. Performance optimization:
   - Add loading.tsx skeleton for every dashboard page
   - Lazy load charts (dynamic import with ssr: false)
   - Optimize all images with next/image
   - Add proper caching headers for static assets
   - Database query optimization: add any missing indexes
   - Target: Lighthouse 90+ on landing page, 80+ on dashboard

2. SEO for landing page:
   - Proper title: "SkySwift — AI Travel Management for Indian Corporates"
   - Meta description optimized for "corporate travel management India"
   - Open Graph tags for social sharing
   - Structured data (Organization schema)
   - Sitemap.xml
   - robots.txt

3. Error boundaries:
   - Global error boundary in app layout
   - Per-page error boundaries for dashboard
   - Friendly error messages (not stack traces)
   - Sentry integration for error tracking (if configured)

4. Email templates (using Resend):
   - Welcome email (after signup)
   - Employee invite email
   - Booking confirmation email (HTML template with flight details)
   - Approval request email (as fallback for WhatsApp)
   - Weekly digest email to admin (booking summary)

5. Mobile responsiveness:
   - Test and fix all pages at 375px width
   - Dashboard sidebar collapses to hamburger menu on mobile
   - Landing page hero adjusts for mobile
   - Tables scroll horizontally on mobile

6. Deployment checklist:
   - Verify all env vars in Vercel
   - Supabase production project configured
   - Database migrations run on production
   - Domain configured (skyswift.ai)
   - WhatsApp webhook URL updated to production domain
   - Razorpay live credentials (when ready)
   - Duffel live credentials (when ready)

7. README.md update:
   - Updated project description for B2B pivot
   - Setup instructions for new developers
   - Architecture overview
   - Environment variables documentation
   - Demo mode instructions

Commit message: "Phase 4 complete: B2B corporate travel platform with
WhatsApp booking, policy engine, GST compliance, and admin dashboard"
```

---

## 8. Post-Phase 4 Roadmap (Phase 4.5 & Beyond)

| Feature | Timeline | Priority | Rationale |
|---------|----------|----------|-----------|
| Slack/Teams integration | Phase 4.5 (M4-6) | High | Needed for larger Indian tech companies using Slack |
| Hotel booking (Duffel Stays) | Phase 4.5 (M4-6) | High | 2nd most common corporate travel booking after flights |
| Tally direct API integration | Phase 4.5 (M5-7) | Medium | Auto-push GST vouchers to Tally without CSV export |
| Expense management (receipt OCR) | Phase 4.5 (M6-8) | Medium | Capture non-booking expenses (meals, taxi). Google Cloud Vision OCR |
| Ground transport (Ola/Uber API) | Phase 5 (M8-10) | Medium | Indian corporate travelers need airport transfers |
| IRCTC integration (rail) | Phase 5 (M10-12) | Medium | Unique India requirement. Complex API. |
| International flights | Phase 5 (M8-12) | Medium | Already supported via Duffel. Needs multi-currency, visa info |
| Mobile app (React Native) | Phase 5+ | Low | WhatsApp IS the mobile app. Defer until proven demand |
| Collaborative filtering | Phase 5+ | Low | "People at similar companies who fly BLR-DEL prefer..." |
| AI disruption management | Phase 5+ | Low | Auto-rebook on delays/cancellations. Requires FlightAware API |

---

## 9. YC S26 Application Positioning

### What to demonstrate:

1. **Working WhatsApp demo**: Show a real booking in 30 seconds
2. **Policy engine**: Show it blocking an out-of-policy request and routing to approval
3. **GST compliance**: Show automatic ITC calculation and Tally export
4. **Admin dashboard**: Show the travel manager's view with analytics
5. **5-10 pilot customers** with real bookings

### One-line pitch:
> "SkySwift is the AI travel desk for Indian corporates. Our WhatsApp bot books flights in 30 seconds with policy enforcement and GST compliance, replacing the small offline agents that handle 60% of India's $10.6B corporate travel market."

### Why now:
- India's corporate travel market is doubling to $20.8B by 2030
- 60% still flows through offline agents with zero technology
- Agentic AI can now handle 80%+ of standard corporate bookings
- Navan's IPO validated the category; their stock crash shows room for a better model
- No AI-native TMC exists in India

### Why us:
- Founder experience at Booking.com (consumer UX) + Amadeus (airline distribution)
- Deep understanding of NDC, GDS, airline retailing, and Indian travel market
- Working MVP with pilot customers
- WhatsApp-first approach uniquely suited to India (vs. Slack-first in US)

---

## 10. Environment Variables (New for Phase 4)

Add to `.env.local`:

```env
# ── Phase 4 New Variables ──

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=         # Meta Business API permanent token
WHATSAPP_VERIFY_TOKEN=         # Webhook verification token (you choose)
WHATSAPP_PHONE_NUMBER_ID=      # From Meta Business dashboard
WHATSAPP_BUSINESS_ACCOUNT_ID=  # From Meta Business dashboard
WHATSAPP_MOCK=true             # Set to false for real WhatsApp

# Demo Mode
DEMO_MODE=true                 # Set to false for production
DEMO_PASSWORD=skyswift2026     # Simple passphrase for demo access

# Existing (verify these exist from Phase 2-3)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DUFFEL_ACCESS_TOKEN=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
GOOGLE_GEMINI_API_KEY=
RESEND_API_KEY=
```

---

## 11. Cost Analysis (Free-Tier Strategy Continues)

| Layer | Technology | Cost | Notes |
|-------|-----------|------|-------|
| Frontend & Backend | Next.js + Vercel | ₹0 | Free hobby tier |
| Database | Supabase | ₹0 | Free: 500MB, 50K rows. Sufficient for 50+ companies |
| AI/NLP | Gemini 2.0 Flash | ₹0 | Free tier: 15 RPM. Sufficient for pilot |
| Flight API | Duffel | ~₹250/booking | Pay-per-booking. Only cost when actual bookings happen |
| Payments | Razorpay | 2% per txn | Variable. Only on bookings |
| WhatsApp | Meta Cloud API | ~₹0.35-0.85/msg | Only for business-initiated messages outside 24h window. User-initiated conversations are free. |
| Email | Resend | ₹0 | Free: 3,000 emails/month |
| Dev Tool | Claude Code | ~₹1,700/mo | Claude Pro subscription |
| Domain | skyswift.ai | ~₹1,200/yr | Existing |

**Total for 10 pilot companies, 500 bookings:** ~₹1.3L ($1,600) in variable costs → demonstrating product-market fit for fundraise.

---

*SkySwift — Confidential | PRD v4.0 | February 18, 2026*
*Phase 4: The Corporate Pivot*
