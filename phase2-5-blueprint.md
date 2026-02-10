# 🧠 Phase 2.5: The Intelligence Layer — SkySwift's Moat

**Context:** You've completed Phase 2 Prompts 1-8 (Duffel supply layer, pricing engine, Liquid Glass UX). You're at Prompt 9 (Live Mode). This document extends Phase 2 with 4 new prompts that transform SkySwift from a booking engine into the Spotify of travel.

**North Star:** "Delhi Tuesday" → one perfect recommendation → booked in 15 seconds.

**Core Thesis:** Supply is a commodity. Every OTA has the same flights at the same prices. The moat is intelligence — an AI that knows how you travel better than you know yourself, and gets smarter with every booking.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   USER MESSAGE                       │
│              "Delhi next Tuesday"                     │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│            CONVERSATION STATE MACHINE                │
│  Loads: session history, current intent state        │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│             PREFERENCE ENGINE                        │
│  Loads: user preferences, route familiarity,         │
│  booking patterns, price history                     │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              CLAUDE API CALL                          │
│  System prompt injected with:                        │
│  - User preference context                           │
│  - Route familiarity level (discovery/learning/auto) │
│  - Conversation history                              │
│  - Time/day context                                  │
│  Outputs: structured intent + natural language        │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│           RESPONSE MODE ROUTER                       │
│  Discovery (0-2 bookings): show 3-5 options          │
│  Learning (3-5 bookings): show 3, rank by preference │
│  Autopilot (6+): single confident recommendation     │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│         DUFFEL SEARCH + RECOMMENDATION               │
│  Search flights → score by preference alignment →    │
│  return ranked results with commentary               │
└─────────────────────────────────────────────────────┘
```

---

## Sprint Sequence

| Sprint | Prompt | Duration | What It Does |
|--------|--------|----------|-------------|
| Current | **Prompt 9 (modified)** | ~1 week | Live mode + India/Razorpay swap |
| Next | **Prompt 10 (NEW)** | ~1 week | Preference Engine — the data foundation |
| Then | **Prompt 11 (NEW)** | ~1 week | Conversational Intelligence — the brain upgrade |
| Then | **Prompt 12 (NEW)** | ~3-4 days | Demo Flow + seed script for YC |

---

## PROMPT 9 — Live Mode + India Market Preparation

**Status: Current sprint. Modify the existing Prompt 9 with these additions.**

Copy this entire prompt into Claude Code:

```
Prepare the app for live Duffel bookings with India market focus:

1. ENVIRONMENT MODE SYSTEM:
   - Read NEXT_PUBLIC_APP_MODE from env: "sandbox" | "live"
   - In sandbox: show a persistent top banner "🧪 Sandbox Mode — No real bookings"
   - In live: no banner, real bookings happen
   - Duffel token selection: 
     if live mode → use DUFFEL_LIVE_TOKEN
     else → use DUFFEL_TEST_TOKEN
   - Log mode on app startup: console.log(`[SkySwift] Running in ${mode} mode`)

2. INDIA MARKET DEFAULTS:
   Update the supply abstraction layer and app defaults:
   
   - Default currency throughout the app: "INR"
   - All Duffel API calls: include currency parameter as "INR"
   - Price display format: ₹X,XXX (Indian Rupee with comma formatting)
     Example: ₹4,850 not $48.50 or Rs.4850
   - Use helper function: formatINR(amount) that handles this consistently
   - Default timezone: "Asia/Kolkata" (IST)
   - Time display: 12hr format with AM/PM (e.g., "6:15 AM")
   - Date display: "Tue, 18 Feb 2026" format
   - Default home airport: "BLR" (Bangalore) — stored in user profile,
     changeable in settings
   - Popular route suggestions for new users:
     BLR→DEL, BLR→BOM, BLR→HYD, BLR→MAA, BLR→CCU, BLR→PNQ,
     DEL→BOM, DEL→BLR, DEL→HYD

3. RAZORPAY INTEGRATION (replace Stripe for India):
   
   Install: npm install razorpay
   
   Create lib/payments/razorpay.ts:
   - Initialize with RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET from env
   - createOrder(amount, currency, bookingId):
     → Call Razorpay Orders API to create an order
     → Return order_id for frontend checkout
   - verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature):
     → Verify signature using crypto.createHmac
     → Return boolean
   
   Create /api/payments/create-order route:
   - Receives: amount, currency, booking_reference
   - Creates Razorpay order
   - Returns: order_id, amount, currency, key_id (public key)
   
   Create /api/payments/verify route:
   - Receives: razorpay_order_id, razorpay_payment_id, razorpay_signature
   - Verifies payment signature
   - If valid: proceed with Duffel booking
   - If invalid: return error, do not book
   
   Frontend payment flow:
   - When user confirms a flight, call /api/payments/create-order
   - Load Razorpay Checkout script dynamically:
     <script src="https://checkout.razorpay.com/v1/checkout.js">
   - Open Razorpay payment sheet with:
     {
       key: NEXT_PUBLIC_RAZORPAY_KEY_ID,
       amount: amountInPaise, // Razorpay uses paise, not rupees
       currency: "INR",
       name: "SkySwift",
       description: "Flight booking: BLR → DEL",
       order_id: order_id_from_api,
       prefill: { name: user.name, email: user.email, contact: user.phone },
       theme: { color: "#0A84FF" }, // Match your Liquid Glass accent
       handler: function(response) {
         // response has: razorpay_payment_id, razorpay_order_id, razorpay_signature
         // Call /api/payments/verify
         // If verified → create Duffel order → show confirmation
       }
     }
   - UPI will appear as a payment option automatically in India
   - Card payments also work
   - Handle payment failure gracefully: "Payment didn't go through. Try again?"

4. PAYMENT-BOOKING SAFETY FLOW:
   
   The sequence must be:
   a) User confirms flight selection
   b) Show explicit confirmation:
      "You are about to book a REAL flight.
       IndiGo 6E-302 · BLR → DEL · Tue, 18 Feb · 6:15 AM
       Total: ₹4,850
       Your payment method will be charged. This is a real airline ticket."
      [Checkbox] "I understand this is a real booking"
      [Pay ₹4,850] button
   c) Razorpay payment sheet opens
   d) Payment succeeds → create Duffel order
   e) Duffel returns PNR → show confirmation
   f) If Duffel fails after payment → auto-refund via Razorpay Refunds API
      Show: "Booking failed. Your payment of ₹4,850 has been refunded."
   
   Error recovery:
   - If Razorpay charges but Duffel booking fails:
     → Immediately call Razorpay Refund API (full refund)
     → Log to booking_incidents table
     → Show user: "Something went wrong. Your ₹4,850 has been refunded."
   - If Duffel succeeds but DB save fails:
     → Show PNR to user immediately (most important thing)
     → Queue background retry for DB save
     → Log to booking_incidents table

5. BOOKING INCIDENTS TABLE (SQL migration):
   
   CREATE TABLE booking_incidents (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     booking_id UUID REFERENCES bookings(id),
     user_id UUID REFERENCES users(id),
     incident_type TEXT,
     -- Types: 'payment_booking_mismatch', 'db_save_failed',
     -- 'duffel_timeout', 'refund_failed'
     razorpay_payment_id TEXT,
     razorpay_order_id TEXT,
     duffel_order_id TEXT,
     amount DECIMAL(10,2),
     currency TEXT DEFAULT 'INR',
     error_message TEXT,
     resolved BOOLEAN DEFAULT FALSE,
     resolved_at TIMESTAMP,
     notes TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );

6. POST-BOOKING CONFIRMATION:
   After successful booking, display:
   - PNR code in large, prominent text (copyable on tap)
   - Flight summary card:
     Airline logo + flight number
     Route: BLR → DEL
     Date: Tue, 18 Feb 2026
     Departure: 6:15 AM IST
     Arrival: 8:45 AM IST
     Passenger: Raman [Last Name]
     Seat: 14C (Aisle)
   - "Verify on airline website" link
   - "Add to calendar" button (generates .ics file)
   - Booking ref stored in our DB
   - Confirmation email sent to user's email

7. ADMIN DASHBOARD (simple, for you only):
   Create /dashboard/admin (protected: only allow your email address)
   - Recent bookings list (all users): date, route, airline, amount, status
   - Recent incidents: type, amount, resolved/unresolved
   - Revenue summary: total bookings, total revenue, avg per booking
   - Quick stats: bookings today, bookings this week, bookings this month
   - Pricing rules editor (from existing Prompt 3 pricing engine)

8. ENV VARIABLES NEEDED:
   Add to .env.local:
   NEXT_PUBLIC_APP_MODE=sandbox
   RAZORPAY_KEY_ID=rzp_test_xxxxx
   RAZORPAY_KEY_SECRET=xxxxx
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
   DUFFEL_LIVE_TOKEN=duffel_live_xxxxx
   DUFFEL_TEST_TOKEN=duffel_test_xxxxx
```

**After executing:** Test the full flow in sandbox mode. Razorpay test mode lets you simulate UPI payments. Duffel sandbox lets you book test flights. Run through the entire flow 5 times to catch edge cases.

---

## PROMPT 10 — The Preference Engine (Your Moat)

This is the most important prompt in the entire project. This is what makes SkySwift different from every other booking platform. Every booking after this feeds the intelligence layer.

Copy this entire prompt into Claude Code:

```
Build a Travel Preference Engine that learns from every booking
and powers personalized recommendations. This is SkySwift's core
differentiator — our "Spotify recommendation engine" for travel.

OVERVIEW:
Every time a user books a flight, the system learns:
- What airline they chose (and which ones they ignored)
- What time they prefer (by day of week)
- What seat they like
- How much they typically pay (per route)
- How far in advance they book
- Which routes they fly frequently

Over time, this data enables three modes:
- DISCOVERY (0-2 bookings on a route): show multiple options, learn
- LEARNING (3-5 bookings): show options ranked by predicted preference
- AUTOPILOT (6+): single confident recommendation, one-tap booking

1. DATABASE TABLES (Supabase SQL migrations):

-- Core preferences learned over time
CREATE TABLE user_travel_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  home_airport TEXT DEFAULT 'BLR',
  preferred_airlines JSONB DEFAULT '[]',
  -- Ranked list: [{"code": "6E", "name": "IndiGo", "score": 0.85},
  --              {"code": "AI", "name": "Air India", "score": 0.60}]
  preferred_departure_windows JSONB DEFAULT '{}',
  -- By day: {"monday": "early_morning", "friday": "late_evening"}
  -- Windows: early_morning (5-8), morning (8-11), afternoon (12-16),
  --          evening (16-20), late_evening (20-23)
  seat_preference TEXT DEFAULT 'aisle',
  -- 'aisle', 'window', 'middle', 'no_preference'
  cabin_class TEXT DEFAULT 'economy',
  meal_preference TEXT,
  bag_preference TEXT DEFAULT 'cabin_only',
  -- 'cabin_only', 'one_checkin', 'two_checkin'
  price_sensitivity FLOAT DEFAULT 0.5,
  -- 0.0 = always picks cheapest regardless
  -- 0.5 = balanced (default)
  -- 1.0 = picks preferred airline/time regardless of price
  -- Calculated from: how often they pick cheapest vs preferred
  advance_booking_days_avg FLOAT DEFAULT 7,
  communication_style TEXT DEFAULT 'balanced',
  -- 'concise' (gives short commands like "Delhi Tuesday")
  -- 'balanced' (moderate detail)
  -- 'detailed' (provides lots of context)
  -- Learned from average message length over time
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Every booking creates a pattern entry
CREATE TABLE booking_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  route TEXT NOT NULL,
  -- Format: 'BLR-DEL' (always ORIGIN-DESTINATION, alphabetical not assumed)
  airline_code TEXT,
  airline_name TEXT,
  flight_number TEXT,
  departure_time TIME,
  arrival_time TIME,
  day_of_week INTEGER,
  -- 0=Sunday, 1=Monday, ... 6=Saturday (JS convention)
  price_paid DECIMAL(10,2),
  currency TEXT DEFAULT 'INR',
  cabin_class TEXT DEFAULT 'economy',
  seat_selected TEXT,
  -- Actual seat like '14C'
  seat_type TEXT,
  -- 'aisle', 'window', 'middle'
  bags_added INTEGER DEFAULT 0,
  days_before_departure INTEGER,
  -- How far in advance they booked
  booking_source TEXT DEFAULT 'chat',
  -- 'chat', 'one_tap', 'suggested'
  duffel_offer_id TEXT,
  duffel_order_id TEXT,
  booking_completed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aggregated per-route intelligence
CREATE TABLE route_familiarity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  route TEXT NOT NULL,
  -- Format: 'BLR-DEL'
  times_booked INTEGER DEFAULT 0,
  last_booked_at TIMESTAMP WITH TIME ZONE,
  avg_price_paid DECIMAL(10,2),
  min_price_paid DECIMAL(10,2),
  max_price_paid DECIMAL(10,2),
  preferred_airline_code TEXT,
  -- Most frequently chosen airline on this route
  preferred_airline_name TEXT,
  preferred_flight_number TEXT,
  -- Most frequently chosen specific flight
  preferred_departure_window TEXT,
  -- Most common time window on this route
  avg_days_before_departure FLOAT,
  familiarity_level TEXT DEFAULT 'discovery',
  -- 'discovery' (0-2), 'learning' (3-5), 'autopilot' (6+)
  UNIQUE(user_id, route),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tracks what users searched but didn't book (negative signal)
CREATE TABLE abandoned_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  route TEXT,
  search_date DATE,
  offers_shown INTEGER,
  -- How many options were presented
  time_spent_seconds INTEGER,
  -- How long they looked before abandoning
  reason TEXT,
  -- 'price_too_high', 'wrong_times', 'changed_mind', 'unknown'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE user_travel_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_familiarity ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandoned_searches ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only see their own data
CREATE POLICY "Users read own preferences" ON user_travel_preferences
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users read own patterns" ON booking_patterns
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users read own familiarity" ON route_familiarity
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users read own searches" ON abandoned_searches
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for fast lookups
CREATE INDEX idx_booking_patterns_user_route 
  ON booking_patterns(user_id, route);
CREATE INDEX idx_route_familiarity_user_route 
  ON route_familiarity(user_id, route);
CREATE INDEX idx_booking_patterns_created 
  ON booking_patterns(created_at DESC);

2. PREFERENCE ENGINE (lib/intelligence/preference-engine.ts):

Export a class PreferenceEngine with these methods:

a) learnFromBooking(userId: string, bookingData: BookingData): Promise<void>
   - Called after every successful booking
   - Inserts into booking_patterns
   - Updates route_familiarity:
     - Increment times_booked
     - Recalculate avg/min/max price
     - Update preferred airline (mode of all bookings on this route)
     - Update preferred flight number (mode)
     - Update preferred departure window (mode of time windows)
     - Update familiarity_level based on times_booked
   - Updates user_travel_preferences:
     - Recalculate preferred_airlines across all routes
       (weighted by recency: recent bookings count more)
     - Recalculate preferred_departure_windows by day of week
     - Update price_sensitivity:
       Look at last 10 bookings. For each, was the cheapest option
       chosen? sensitivity = 1 - (times_cheapest_chosen / total)
     - Update advance_booking_days_avg (rolling average)
     - Update communication_style based on average message length
       from conversation history

b) getPreferences(userId: string): Promise<UserPreferences>
   - Returns the full preference profile for a user
   - If no preferences exist yet, create with defaults and return

c) getRouteFamiliarity(userId: string, route: string): Promise<RouteFamiliarity>
   - Returns familiarity data for a specific route
   - If route not seen before, return defaults with familiarity_level='discovery'

d) getRecommendation(userId: string, route: string, date: string): Promise<Recommendation>
   - The CORE function — returns the single best flight recommendation
   - Logic:
     1. Get route familiarity
     2. Get user preferences
     3. If autopilot mode (6+ bookings):
        → Search Duffel for flights on this route+date
        → Score each flight using scoreOffer() (see below)
        → Return top-scored flight as THE recommendation
        → Include confidence level (0-1)
        → Include comparison: "₹X less/more than your average"
     4. If learning mode (3-5):
        → Return top 3, ranked by score
        → Include commentary on why #1 is ranked first
     5. If discovery mode (0-2):
        → Return top 5, ranked by a blend of price + time
        → Don't make strong preference claims yet

e) scoreOffer(offer: FlightOffer, preferences: UserPreferences, 
              routeData: RouteFamiliarity): number
   - Score 0-100 based on preference alignment
   - Scoring weights:
     - Airline match: 30 points
       (preferred airline = 30, second preferred = 20, other = 5)
     - Time window match: 25 points
       (within preferred window for this day = 25, adjacent window = 15,
        opposite = 0)
     - Price score: 25 points
       (at or below avg = 25, up to 20% above avg = 15, 
        significantly above = 5)
       Weighted by price_sensitivity: low sensitivity → price matters more
     - Specific flight match: 10 points
       (exact flight number they usually take = 10, same airline = 5)
     - Seat availability: 10 points
       (preferred seat type available = 10, not available = 0)
   - Return: { score, breakdown: { airline: 30, time: 25, ... } }

f) generatePriceInsight(currentPrice: number, routeData: RouteFamiliarity): string
   - Compares current price to user's history on this route
   - Returns natural language insight:
     - "₹800 less than you usually pay — good deal"
     - "About what you normally pay for this route"
     - "₹1,200 more than usual — prices are high right now"
     - "This is the lowest I've seen for you on BLR-DEL"
   - If no history: return null (no insight to give yet)

3. INTEGRATE WITH EXISTING BOOKING FLOW:

After a booking is confirmed and Duffel returns success:
- Call preferenceEngine.learnFromBooking() with all booking details
- This should happen asynchronously (don't block the confirmation UI)
- Log: "[PreferenceEngine] Learned from booking: BLR-DEL, IndiGo, ₹4850"

4. "YOUR TRAVEL DNA" — Settings Page Addition:

Add a new section to the settings/profile page:
- Card titled "Your Travel DNA" (or "Travel Intelligence")
- Visual display:
  - Favorite airlines: show airline logos with usage percentage
    e.g., IndiGo (72%) ████████░░ | Air India (28%) ███░░░░░░░
  - Top routes: BLR→DEL (12 trips), BLR→BOM (5 trips)
  - Preferred times: visual heatmap or simple text
    "Weekdays: Early morning | Fridays: Late evening"
  - Average spend per route: ₹4,850 (BLR-DEL), ₹5,200 (BLR-BOM)
  - Booking style: "You usually book 5 days ahead"
- Manual override buttons:
  "I now prefer window seat" → updates preference, marks as manual
  "Reset preferences for this route" → clears route_familiarity
- This section only appears after 3+ total bookings
  (before that, show: "Book a few flights and I'll start learning
   your preferences!")

5. PREFERENCE SEEDING ON ONBOARDING:

During the onboarding flow (existing), after user sets:
- Home airport → save to user_travel_preferences.home_airport
- Seat preference → save to user_travel_preferences.seat_preference
- Airline loyalty programs → pre-populate preferred_airlines with
  small positive score (0.3) for loyalty airlines

These seeds give the AI initial context even before the first booking.
```

**After executing:** Create a test booking in sandbox mode. Then check that booking_patterns and route_familiarity tables are populated. Run a second booking on the same route and verify aggregations update correctly.

---

## PROMPT 11 — Conversational Intelligence Upgrade

This transforms the chat from a form-filling parser into a genuinely intelligent assistant that understands context, remembers conversations, and responds naturally.

Copy this entire prompt into Claude Code:

```
Upgrade the chat AI from keyword parsing to genuine conversational
intelligence. The AI should feel like texting a brilliant EA who
has known you for years — not filling out a booking form.

1. CONVERSATION STATE MACHINE:

Create a conversations table to track multi-turn state:

CREATE TABLE conversation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  state TEXT DEFAULT 'idle',
  -- States: 'idle', 'gathering_intent', 'searching',
  -- 'presenting_options', 'awaiting_selection',
  -- 'confirming_booking', 'processing_payment',
  -- 'post_booking', 'modifying'
  current_intent JSONB DEFAULT '{}',
  -- Accumulated intent: {origin, destination, date, airline, etc.}
  -- Builds up across messages
  missing_fields TEXT[] DEFAULT '{}',
  -- What we still need: ['date'] or ['destination']
  search_results_cache JSONB,
  -- Cached Duffel results so we don't re-search unnecessarily
  selected_offer_id TEXT,
  messages_in_session INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-expire sessions after 30 minutes of inactivity
-- (handled in code, not DB trigger)

ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own sessions" ON conversation_sessions
  FOR ALL USING (auth.uid() = user_id);

2. CONVERSATION AI MODULE (lib/intelligence/conversation-ai.ts):

This replaces or heavily upgrades the existing intent parser.

Export class ConversationAI with these methods:

a) processMessage(userId: string, sessionId: string, message: string): Promise<AIResponse>
   
   This is the main entry point. Steps:
   
   i.   Load or create conversation session
   ii.  Load user preferences from PreferenceEngine
   iii. Load route familiarity (if route is known from context)
   iv.  Build the system prompt with all context injected
   v.   Send to Claude API with last 10 messages as conversation history
   vi.  Parse Claude's response:
        - Extract any updated intent fields
        - Determine if intent is complete enough to search
        - Get the natural language response
   vii. Update session state based on response
   viii. If intent is complete → trigger Duffel search → return results
   ix.  If intent is incomplete → return Claude's clarifying question
   x.   Return AIResponse object

b) buildSystemPrompt(user, preferences, routeFamiliarity, session):
   
   Returns the full system prompt. THIS IS CRITICAL — it defines
   the AI's entire personality and capability:

   ```
   You are SkySwift, a personal AI travel assistant. You are NOT a chatbot
   that fills out booking forms. You are like a brilliant executive assistant
   who has worked with {user.first_name} for years and knows exactly how
   they travel.

   YOUR PERSONALITY:
   - Concise and confident. Never verbose or robotic.
   - Like texting a smart friend who happens to be a travel expert.
   - Use natural language, not bullet points or structured lists.
   - Match the user's energy: if they're brief ("Delhi Tuesday"), be brief.
     If they give context, respond with context.
   - Be proactive: if you can infer something, infer it. Don't ask
     unnecessary questions.
   - When 90%+ confident about a preference, just use it. Don't ask for
     confirmation every time.
   - Use ₹ for prices. Use 12hr time with AM/PM. Use short date format.
   - Never say "I'd be happy to help" or "Sure!" or other filler.
     Just do the thing.

   WHAT YOU KNOW ABOUT {user.first_name}:
   - Home airport: {preferences.home_airport}
   - Preferred airlines: {formatted_airline_preferences}
   - Seat preference: {preferences.seat_preference}
   - Price sensitivity: {price_sensitivity_description}
     (0=always cheapest, 0.5=balanced, 1=ignores price)
   - Usual advance booking: {preferences.advance_booking_days_avg} days
   - Communication style: {preferences.communication_style}
   {route_context_if_applicable}

   INFERENCE RULES — apply these ALWAYS:
   1. No origin specified → use home airport ({preferences.home_airport})
   2. No date specified → interpret naturally:
      - "next week" = next Monday
      - "this weekend" = upcoming Saturday
      - "tomorrow" = tomorrow
      - If ambiguous, ask ONE question
   3. No airline specified AND route familiarity >= learning:
      → use their preferred airline for this route
   4. No time specified AND they have a day-of-week pattern:
      → use their pattern for that day
   5. "the usual" or "same as last time" → replicate their most recent
      booking on this route with the new date
   6. City names → map to IATA codes:
      Delhi/New Delhi = DEL, Mumbai/Bombay = BOM, Bangalore/Bengaluru = BLR,
      Hyderabad = HYD, Chennai/Madras = MAA, Kolkata/Calcutta = CCU,
      Pune = PNQ, Ahmedabad = AMD, Goa = GOI, Jaipur = JAI,
      Lucknow = LKO, Kochi/Cochin = COK
   7. Airline names → map to codes:
      IndiGo = 6E, Air India = AI, Akasa = QP, SpiceJet = SG,
      Air India Express = IX, Vistara = AI (merged)
   
   RESPONSE MODES based on route familiarity:
   
   {familiarity_level} MODE active for route {route}:
   
   If DISCOVERY (0-2 bookings on this route):
   - Show top 3-5 flight options when search results are available
   - Frame as options: "Here are your best options for Tuesday..."
   - After they choose, note what they picked (this feeds learning)
   - Ask about preferences naturally: "Are you usually a morning flyer
     or do you prefer afternoons?"
   
   If LEARNING (3-5 bookings):
   - Show top 3 options, with predicted best FIRST
   - Add light commentary: "Based on your last few trips, I'd go with
     the 6:15 IndiGo — it's your usual pick and ₹500 cheaper today."
   - Still show alternatives but make the recommendation clear
   
   If AUTOPILOT (6+ bookings):
   - Give ONE confident recommendation
   - Format: "IndiGo 6E-302, 6:15 AM, aisle. ₹4,850 — that's ₹200
     less than you usually pay. Book it?"
   - Only show alternatives if asked ("What else is there?")
   - This should feel like the AI read your mind

   ALWAYS include price context when route history exists:
   - "₹X less/more than your average on this route"
   - "Cheapest I've seen for you on BLR-DEL"
   - "Prices are running high right now — ₹X above your usual"
   
   HANDLE THESE CONVERSATION PATTERNS:
   
   Booking intent:
   "book", "fly", "need to be in", "going to", "flight to", "heading to"
   → Parse into: {origin, destination, date, time_preference, airline}
   → Fill gaps from preferences/inference
   → If enough info → search. If not → ask ONE missing thing.
   
   Refinement (mid-conversation):
   "actually make it Wednesday", "no, afternoon", "switch to Air India",
   "what about Bombay instead"
   → Update the relevant field in current intent
   → Re-search with updated parameters
   → Don't restart the conversation
   
   Selection:
   "the first one", "book option 2", "the IndiGo one", "the cheapest",
   "yeah that works", "book it", "yes", "go ahead"
   → Map to the correct offer from presented options
   → Move to confirmation/payment
   
   Comparison:
   "what about afternoon flights?", "anything cheaper?",
   "show me Air India options"
   → Keep same route+date, adjust the filter
   → Show new results alongside or instead of previous
   
   Cancellation/modification:
   "cancel", "change", "modify", "need to move my flight"
   → Check if there's a recent booking to reference
   → Guide through the process
   
   Information:
   "how much is BLR to DEL?", "when's the cheapest to fly?",
   "what airlines fly this route?"
   → Provide info without booking
   
   Preference update:
   "I prefer window seats now", "always book IndiGo for me",
   "stop suggesting morning flights"
   → Update user_travel_preferences
   → Confirm: "Got it — window seat from now on."
   
   Social/casual:
   "hey", "thanks", "good morning", "what can you do?"
   → Respond naturally and warmly
   → If morning and they have upcoming trips: mention them
   → If just completed a trip: "How was Delhi?"
   
   Unclear/ambiguous:
   → Ask ONE clarifying question, never multiple
   → Frame it conversationally: "Delhi or Mumbai?" not
     "Please specify your destination airport"
   
   YOUR JSON RESPONSE FORMAT:
   Always respond with a JSON object containing:
   {
     "message": "Your natural language response to show the user",
     "intent_update": {
       // Any fields to add/update in current session intent
       // Only include fields that changed
       "destination": "DEL",
       "date": "2026-02-18"
     },
     "action": "search" | "present_options" | "confirm_booking" | 
               "ask_clarification" | "update_preference" | 
               "general_response" | "show_booking_status",
     "search_params": {
       // Only if action is "search"
       "origin": "BLR",
       "destination": "DEL", 
       "date": "2026-02-18",
       "cabin_class": "economy"
     },
     "preference_update": {
       // Only if action is "update_preference"
       "seat_preference": "window"
     }
   }
   ```

c) getConversationHistory(sessionId: string, limit: number = 10):
   - Load recent messages from chat_messages table
   - Format for Claude API: [{role: 'user', content: '...'}, 
     {role: 'assistant', content: '...'}, ...]
   - Include only the natural language parts, not internal JSON

d) updateSessionState(sessionId: string, updates: Partial<Session>):
   - Update the conversation_sessions row
   - Merge intent_update into current_intent (don't overwrite, merge)

3. INTEGRATE WITH EXISTING CHAT UI:

Update the chat component to use ConversationAI instead of the
old intent parser:

- On page load: create new conversation session (or resume if <30min old)
- On user message:
  a) Add message to UI immediately
  b) Show typing indicator
  c) Call conversationAI.processMessage(userId, sessionId, message)
  d) Parse response:
     - If action is "search": run Duffel search with search_params,
       then score results with PreferenceEngine, then display
     - If action is "present_options": display flight cards
       (use the scores to rank them)
     - If action is "confirm_booking": show the booking confirmation UI
     - If action is "ask_clarification": show the message, wait for reply
     - If action is "update_preference": update DB, show confirmation
     - If action is "general_response": show the message
  e) Add assistant message to UI with response
  f) Update session state

- When displaying flight results in chat:
  DON'T just show cards. Mix natural language with structured data.
  
  GOOD example (Autopilot mode):
  ┌──────────────────────────────────────────────┐
  │ "IndiGo 6E-302 at 6:15 AM — your usual pick │
  │ and ₹200 less than average. Book it?"        │
  │                                              │
  │ ┌─ IndiGo 6E-302 ──────────────────────┐    │
  │ │ BLR 6:15 AM ────────── DEL 8:45 AM   │    │
  │ │ Non-stop · 2h 30m · Economy           │    │
  │ │ Aisle 14C available                   │    │
  │ │ ₹4,850                    [Book ✓]    │    │
  │ └───────────────────────────────────────┘    │
  │                                              │
  │ "Show me other options" link                 │
  └──────────────────────────────────────────────┘
  
  GOOD example (Learning mode):
  ┌──────────────────────────────────────────────┐
  │ "Three good options for Tuesday. The 6:15    │
  │ IndiGo is what you usually take and it's     │
  │ ₹500 cheaper today. The 7:30 Air India is    │
  │ new on this route — worth trying."           │
  │                                              │
  │ ┌─ RECOMMENDED ─────────────────────────┐    │
  │ │ IndiGo 6E-302 · 6:15 AM · ₹4,850     │    │
  │ │ Your usual · ₹500 below average [Book] │    │
  │ └───────────────────────────────────────┘    │
  │ ┌─ Air India AI-501 · 7:30 AM · ₹4,200 ┐    │
  │ │ New option · Cheapest today     [Book] │    │
  │ └───────────────────────────────────────┘    │
  │ ┌─ Akasa QP-101 · 9:00 AM · ₹4,600 ────┐    │
  │ │ Mid-morning alternative         [Book] │    │
  │ └───────────────────────────────────────┘    │
  └──────────────────────────────────────────────┘

- Multi-turn must work seamlessly:
  User: "Delhi next Tuesday"
  AI: [shows 3 options]
  User: "What about Wednesday instead?"
  AI: [searches same route, new date, shows results]
  User: "The IndiGo one"
  AI: [moves to confirmation with that flight]
  User: "Actually add a return on Friday"
  AI: [searches round trip, presents return options]

  The conversation BUILDS. Never resets unless user says
  "new booking" or "start over".

4. TIME-AWARE GREETINGS:

When the chat loads or user sends first message:
- Check current time in IST
- If before 12pm: "Good morning, {first_name}."
- If 12-17pm: "Good afternoon, {first_name}."  
- If after 17pm: "Good evening, {first_name}."
- If they have an upcoming trip in the next 48 hours:
  Append: "Your {route} flight is {tomorrow/in 2 days}. 
  All good, or need to make changes?"
- If they just completed a trip (last booking was within 3 days 
  and departure was in the past):
  Append: "How was {destination_city}? Ready to book the next one?"

Only do this on the FIRST message of a new session, not on every message.

5. GRACEFUL FALLBACK:

If Claude API fails or returns unparseable response:
- Don't show an error
- Fall back to simple mode: "I didn't quite catch that. 
  Where are you flying to?"
- Log the failure for debugging
- Never show JSON or technical errors to the user

If Duffel search returns no results:
- "No flights found for {date}. Want me to check nearby dates?"
- Automatically search ±1 day and present alternatives

If price is significantly higher than user's average:
- Proactively flag it: "Heads up — {route} is running ₹X above 
  your usual. Want me to check if {day before} or {day after} is cheaper?"
```

**After executing:** Test these conversations in order:
1. "I need to fly to Delhi next Tuesday" (basic booking)
2. "Actually Wednesday" (refinement)
3. "The IndiGo one" (selection)
4. After booking, try: "Delhi again next week" (should now be in Learning mode)
5. "I prefer window seats now" (preference update)
6. "hey" (casual — should greet naturally)
7. "the usual" (should attempt to replicate last booking pattern)

---

## PROMPT 12 — The 30-Second Demo Flow + YC Seed Script

This is about making the product demo-ready for YC. The most important 30 seconds of your startup life.

Copy this entire prompt into Claude Code:

```
Build the complete demo-ready experience: first-time onboarding,
progressive intelligence, and a seed script for investor demos.

1. ENHANCED ONBOARDING (update existing onboarding flow):

Make onboarding feel like setting up a new iPhone — minimal, beautiful,
each screen does one thing. Use the existing Liquid Glass design system.

Screen 1: "Let's set up your travel profile"
  - Auto-detect or ask: "What's your home airport?"
  - Show top Indian airports as tappable glass pills:
    BLR · DEL · BOM · HYD · MAA · Other
  - Single tap selects, auto-advances after 500ms

Screen 2: "How do you usually fly?"
  - "Mostly for work" / "Mix of work and personal" / "Mostly personal"
  - Tappable glass pills, single select
  - This sets initial assumptions:
    Work → prefer morning flights, aisle seats, IndiGo
    Mix → balanced defaults
    Personal → no strong assumptions

Screen 3: "Any seat preference?"
  - Visual airplane cross-section showing aisle/middle/window
  - Tap to select, highlighted with glass effect
  - "No preference" option

Screen 4: "You're all set!"
  - Subtle celebration animation (confetti or gentle pulse)
  - "I'll learn your preferences as we go. The more you book,
    the smarter I get."
  - [Book your first flight →] button
  - Auto-redirects to chat after 2 seconds

Save all selections to user_travel_preferences immediately.
Total time target: under 30 seconds.

2. FIRST BOOKING EXPERIENCE (Discovery Mode):

When user sends their first-ever booking message:
- AI response should be warm but efficient:
  "Here are your best options for BLR to DEL on Tuesday.
   Since this is your first time on this route, I'm showing
   you a few to get a feel for your preferences."
- Show 3-5 options with clean flight cards
- After they book, the AI should say:
  "Booked! PNR: {code}. I've noted your preferences —
   next time I'll know exactly what you like."

3. PROGRESSIVE INTELLIGENCE DEMO:

To demonstrate how SkySwift gets smarter, build visual cues:

After 3rd booking on same route, in the chat header or as
a subtle notification:
"🧠 Learning: I'm starting to understand your BLR-DEL preferences"

After 6th booking:
"🧠 Autopilot: I now know your BLR-DEL travel style"

These are small, non-intrusive indicators that show the AI is
evolving. Important for demos — investors can SEE the intelligence
building.

4. DEMO SEED SCRIPT (npm run seed:demo):

Create scripts/seed-demo.ts that:
- Creates a demo user (or uses a specified email from env: DEMO_USER_EMAIL)
- Seeds user_travel_preferences with:
  home_airport: 'BLR'
  preferred_airlines: [
    {code: '6E', name: 'IndiGo', score: 0.85},
    {code: 'AI', name: 'Air India', score: 0.45}
  ]
  seat_preference: 'aisle'
  price_sensitivity: 0.6
  preferred_departure_windows: {
    monday: 'early_morning', tuesday: 'early_morning',
    wednesday: 'morning', thursday: 'morning',
    friday: 'late_evening', saturday: 'morning', sunday: 'evening'
  }
  communication_style: 'concise'

- Seeds 8 booking_patterns for BLR-DEL:
  Vary dates over past 3 months, mostly IndiGo 6E-302 at 6:15 AM,
  a couple of AI-501 at 7:30 AM, prices ranging ₹4,200-₹5,800,
  all aisle seats, economy, 5-10 days advance booking

- Seeds 3 booking_patterns for BLR-BOM:
  Mix of airlines, morning flights, lower familiarity

- Seeds route_familiarity:
  BLR-DEL: times_booked=8, familiarity_level='autopilot',
    preferred_airline='6E', preferred_flight='6E-302',
    avg_price=4850, preferred_departure_window='early_morning'
  BLR-BOM: times_booked=3, familiarity_level='learning',
    preferred_airline='6E', avg_price=5200

- Log: "Demo user seeded. Login as {email} to see Autopilot mode."

Add to package.json scripts:
"seed:demo": "npx tsx scripts/seed-demo.ts"

5. THE YC DEMO SCRIPT (what you actually show):

Build the app flow so this exact sequence works:

[Open app, logged in as demo user]

Investor sees: Clean chat interface. Time-aware greeting.
"Good morning, Raman. Your Hyderabad flight is tomorrow. 
All good, or need changes?"

Demo Step 1 — Autopilot Mode:
You type: "Delhi next Tuesday"
AI responds (within 3 seconds): 
"IndiGo 6E-302 at 6:15 AM, aisle seat. ₹4,850 — 
₹200 less than your average. Book it?"
[Shows single flight card with Book button]

Demo Step 2 — One-tap booking:
You tap [Book]
→ Confirmation screen appears with flight details
→ [Pay ₹4,850] button
(In demo, use Razorpay test mode — skip actual payment 
or show the Razorpay sheet briefly)
→ "Booked! PNR: ABC123. Have a good trip."

Demo Step 3 — Show the intelligence:
You type: "What about Bombay on Thursday?"
AI responds (Learning mode for BLR-BOM, different behavior):
"Three options for Thursday. Based on your last few trips,
I'd recommend the 8:00 AM IndiGo at ₹5,100. There's also 
a 6:30 Air India for ₹4,400 if you want to save."
[Shows 3 ranked cards]

Demo Step 4 — Refinement:
You type: "Anything in the afternoon?"
AI responds: "Sure — here's what's available after 12 PM..."
[Shows filtered results — same route, same date, afternoon only]

Demo Step 5 — Show Travel DNA:
Navigate to Settings → Travel DNA section
Show the visual preference display:
IndiGo (75%) ████████░░
Air India (25%) ███░░░░░░░
Top route: BLR → DEL (8 trips)
Preferred time: Early morning (weekdays)

TOTAL DEMO TIME: ~90 seconds
STORY: "In 90 seconds, you saw 2 bookings and a route change.
No searching. No filtering. No 47 clicks. The AI knew exactly 
what I wanted because it learned from my last 8 flights."

6. QUICK STAT FOR CHAT HEADER:

Add a subtle stat in the chat header area:
"{N} flights booked · {N} routes learned"
Example: "11 flights booked · 3 routes learned"

This gives immediate credibility that the AI has data to work with.
Only show if total bookings > 0.
```

**After executing:**
1. Run `npm run seed:demo` to create the demo user
2. Log in as demo user
3. Walk through the exact demo script above
4. Record a screen capture of the full 90-second demo
5. This recording becomes your YC application video

---

## Post-Sprint: What You Have

After executing all 4 prompts, SkySwift will have:

| Capability | Status |
|---|---|
| Real flight booking (Duffel) | ✅ Live |
| Indian market (INR, IST, Indian airports) | ✅ |
| UPI payments via Razorpay | ✅ |
| Preference learning from every booking | ✅ |
| Three-tier intelligence (Discovery → Learning → Autopilot) | ✅ |
| Multi-turn conversational AI | ✅ |
| Natural language with personality | ✅ |
| Price insights vs user history | ✅ |
| Travel DNA visualization | ✅ |
| Demo-ready seed script | ✅ |
| Time-aware greetings | ✅ |
| Graceful error handling | ✅ |
| Admin dashboard | ✅ |

**What to tell YC:**
"SkySwift is the Spotify of travel. Our AI learns how you fly and gets smarter with every booking. First booking takes 30 seconds. By the 5th booking on a route, it takes 10 seconds. By the 10th, the AI recommends the exact flight before you finish typing. We've completed {N} real paid bookings with {X}% repeat rate."

---

## Execution Notes

1. **Execute prompts in order.** Prompt 10 (preferences) must be done before Prompt 11 (conversation AI), because the conversation AI depends on the preference engine.

2. **Test after every prompt.** Run through the test scenarios listed at the end of each prompt.

3. **The seed script is critical.** Don't skip Prompt 12. The demo user data is what makes the YC demo compelling — you need the AI to be in Autopilot mode to show the magic.

4. **Claude API token usage will increase.** The conversation AI sends more context per request (preferences + history + system prompt). Monitor your Anthropic API costs. Budget ~₹8,000-12,000/month for Claude API at early user volumes.

5. **Keep the failed_intents table from the original Prompt 10.** It still matters — log everything the AI can't handle. This tells you what to build next.

---

## Parallel Track (Business — Don't Stop)

While executing these prompts:
- [ ] Register Pvt Ltd company
- [ ] Sign up at developer.goindigo.in (explore sandbox)
- [ ] Email sales@verteil.com (backup supply)
- [ ] Set up Razorpay account (test mode)
- [ ] Verify Duffel India coverage for IndiGo / Air India
- [ ] Start talking to 2-3 potential alpha testers in your network
- [ ] Draft Terms of Service + Privacy Policy with Claude
