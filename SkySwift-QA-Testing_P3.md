# SkySwift Phase 3 — Automated QA & End-to-End Testing

**Context:** Phase 3 (P3-01 through P3-14) has been implemented. Before manual testing, run this comprehensive automated QA suite to catch all trivial issues. Read `PRD.md` for full architecture context.

**Goal:** Zero broken pages, zero console errors, zero failed API calls before the founder touches it.

---

## Instructions for Claude Code

Run ALL of the following test categories in sequence. Fix any issues found before moving to the next category. At the end, generate a test report summarizing pass/fail for each category.

---

## Category 1: Build & Compilation Health

```
1.1 Run `npm run build` — must complete with ZERO errors
    - Fix any TypeScript errors
    - Fix any missing imports
    - Fix any module resolution failures
    - Warnings are OK, errors are not

1.2 Run `npm run lint` — fix all errors (warnings acceptable)

1.3 Check for unused imports and dead code in all new Phase 3 files

1.4 Verify all environment variables referenced in code exist in `.env.local` or `.env.example`
    - List every env var used in the codebase
    - Flag any that are missing from env files
    - Ensure no secrets are hardcoded
```

---

## Category 2: Database Schema & Migrations

```
2.1 Verify all Phase 3 tables exist in Supabase schema:
    - user_preferences
    - onboarding_responses
    - flight_dna
    - booking_feedback
    - failed_intents
    - Verify existing tables: users, offers, orders, order_items

2.2 For each table, verify:
    - All columns match PRD.md Section 3.2 spec
    - Primary keys are set
    - Foreign keys reference correct tables
    - Row-level security (RLS) policies are enabled
    - RLS policies allow users to read/write only their own data

2.3 Test RLS policies:
    - Simulate: User A should NOT be able to read User B's preferences
    - Simulate: Unauthenticated requests should be rejected

2.4 Verify seed data:
    - flight_dna table has data for BLR→DEL, BLR→MUM, BLR→HYD routes
    - At minimum 10 flight entries with: airline_code, route, flight_number, aircraft_type, seat_pitch, wifi, ontime_pct, food_rating, power_outlets

2.5 Check all Supabase migration files are in correct order and idempotent
```

---

## Category 3: Page-by-Page Rendering Test

Visit every route in the application and verify it renders without errors.

```
3.1 For EACH page/route in the app:
    - Load the page
    - Check for React hydration errors
    - Check for missing component imports
    - Check for undefined/null reference errors
    - Check for missing CSS/Tailwind classes that would break layout
    - Verify no "white screen of death"

3.2 Specific pages to verify:
    - / (landing page)
    - /onboarding (5-question flow)
    - /chat or /search (main booking interface)
    - /bookings (booking history)
    - /settings or /profile (user preferences visualization — P3-11)
    - /admin or /dashboard (metrics dashboard — P3-12)
    - Any auth pages (login, signup)

3.3 For each page, verify:
    - Responsive layout works (mobile viewport 375px, tablet 768px, desktop 1440px)
    - No horizontal overflow/scrolling issues
    - All images/icons load (no broken image placeholders)
    - All fonts load correctly
    - Liquid Glass / glassmorphism effects render (backdrop-filter support)
```

---

## Category 4: Onboarding Flow (P3-04, P3-05)

```
4.1 Complete flow test:
    - Start onboarding as new user
    - Verify all 5 questions render in sequence
    - Verify each question has tap-to-select options (not free text input)
    - Verify progress indicator shows correct step (1/5, 2/5, etc.)
    - Select answers for all 5 questions
    - Verify answers are stored in `onboarding_responses` table
    - Verify `user_preferences` table is populated with initial preference vector
    - Verify confidence scores are set to initial values per PRD (e.g., 0.3-0.5)

4.2 Edge cases:
    - What happens if user refreshes mid-onboarding? (should resume, not restart)
    - What happens if user skips onboarding? (should get default preferences)
    - What happens if user goes back to previous question? (should allow changing answer)
    - What if onboarding is accessed by an already-onboarded user? (should redirect or show profile)

4.3 Verify preference vector mapping:
    - Q1: "Earliest flight" → time_weight should be high (≥ 0.7)
    - Q1: "Cheapest" → price_weight should be high (≥ 0.7)
    - Q2: Specific airline selected → airline_pref set, confidence 0.4
    - Q2: "Open to best" → no airline_pref, airline confidence 0.1
    - Q4: "Aisle" → seat_pref: "aisle", confidence 0.5
    - Q5: "Yes check bag" → baggage_pref: true
```

---

## Category 5: Preference Scoring Engine (P3-02, P3-07)

```
5.1 Unit test the scoring function:
    - Create a mock user preference: { time_pref: "morning", airline_pref: "IndiGo", price_range: [4000, 6000], stops_pref: "non-stop" }
    - Create mock flight results (at least 5 flights with varying attributes)
    - Run scoring function
    - Verify: top-scored flight matches preferences (morning IndiGo non-stop)
    - Verify: confidence percentage is reasonable (not always 100% or 0%)
    - Verify: all flights get a score (no NaN, undefined, or null scores)

5.2 Test weight distribution:
    - Verify weights sum to 100%: time (30%) + airline (25%) + price (20%) + stops (15%) + amenity (10%)
    - Test edge case: user has NO preferences yet → scoring should still work with defaults
    - Test edge case: user has partial preferences → scoring uses available data

5.3 Flight DNA integration:
    - When a Duffel result matches a flight_dna entry → enrichment data appears in result
    - When a Duffel result has NO flight_dna match → graceful fallback, no errors
    - Verify enrichment includes: on-time %, Wi-Fi status, seat pitch where available

5.4 Recommendation output:
    - Top flight is marked as "Recommended"
    - Confidence score is displayed (e.g., "95% match")
    - "See other options" link/button exists and works
    - Other options are sorted by score descending
```

---

## Category 6: Preference Learning Loop (P3-03)

```
6.1 After a booking is completed, verify:
    - user_preferences is updated with signals from the booking
    - If user booked IndiGo → airline_pref confidence for IndiGo increases
    - If user booked a morning flight → temporal_pref confidence for morning increases
    - If user booked same route again → route confidence increases

6.2 Verify confidence score bounds:
    - Scores never exceed 1.0
    - Scores never go below 0.0
    - Scores increment by reasonable amounts (not jumping 0.1 → 0.9 in one booking)

6.3 Test with simulated booking sequence:
    - Booking 1: IndiGo, 6:15 AM, BLR→DEL, aisle
    - Booking 2: IndiGo, 6:30 AM, BLR→DEL, aisle
    - Booking 3: Air India, 8:00 AM, BLR→MUM, window
    - After booking 3: IndiGo should still be top airline_pref (2 vs 1)
    - After booking 3: morning should still be top time_pref
    - After booking 3: BLR→DEL route confidence > BLR→MUM
```

---

## Category 7: Conversational Intelligence (P3-08, P3-09)

```
7.1 Intent parsing tests — send these natural language inputs and verify correct parsing:

    Input: "BLR to DEL next Tuesday"
    Expected: origin=BLR, destination=DEL, date=next Tuesday, no time preference

    Input: "Bangalore to Delhi tomorrow morning"
    Expected: origin=BLR, destination=DEL, date=tomorrow, time_pref=morning

    Input: "Delhi again Thursday"
    Expected: origin=user's home (BLR), destination=DEL, date=this Thursday

    Input: "the usual"
    Expected: repeat last booking parameters (requires booking history)

    Input: "need to be in CP by 10 AM Tuesday"
    Expected: destination=DEL, arrival_constraint=10:00 AM, date=Tuesday, location_context=Connaught Place

    Input: "same day return"
    Expected: infer return flight on same date

    Input: "BLR to DEL"
    Expected: prompt for date (don't assume)

7.2 Returning user detection:
    - User with 3+ bookings → system should pre-load preferences
    - Greeting should reference pattern if exists: "Your usual Thursday Delhi flight?"
    - Verify pre-loaded data matches actual user_preferences

7.3 Error handling:
    - Gibberish input → friendly error message, not crash
    - Input with no destination → ask for clarification
    - Input with past date → suggest correct date
    - Empty input → handle gracefully
```

---

## Category 8: Booking Flow End-to-End (Sandbox Mode)

```
8.1 Full booking flow (sandbox/test mode):
    - User searches "BLR to DEL next Tuesday"
    - Duffel API returns results (or sandbox mock returns results)
    - Preference engine scores results
    - Top recommendation displayed with confidence
    - User clicks "Book" / "Confirm"
    - Razorpay payment flow triggers (test mode)
    - Payment succeeds → Duffel order created
    - PNR/confirmation displayed in chat
    - Order saved in `orders` table with correct status
    - Order items saved in `order_items` table
    - user_preferences updated with booking signals
    - Confirmation shown to user

8.2 Error recovery flows:
    - Simulate: Duffel API timeout → user sees friendly error, not crash
    - Simulate: Duffel booking fails after payment → verify auto-refund triggers
    - Simulate: Razorpay payment fails → no Duffel booking created
    - Simulate: Network error mid-booking → recovery state shown

8.3 Verify no double-booking:
    - Rapid double-click on "Book" button → only one order created
    - Button should disable after first click / show loading state

8.4 Verify order record integrity:
    - orders.total_amount = flight price + markup + service_fee
    - orders.markup matches pricing engine configuration
    - orders.service_fee matches configured rate
    - orders.payment_id links to real Razorpay payment
    - orders.supplier_order_id links to Duffel order
```

---

## Category 9: Demo Mode (P3-10)

```
9.1 Verify demo accounts exist:
    - User A: Cold start (0 bookings, no preferences beyond onboarding)
    - User B: Emerging pattern (3 bookings, moderate confidence scores)
    - User C: Power user (10 bookings, strong preferences, high confidence)

9.2 Toggle test:
    - Switch between demo accounts
    - Verify each account shows different recommendation for same search
    - User A: recommendation based on onboarding answers only
    - User C: recommendation based on strong historical pattern

9.3 Demo data integrity:
    - User B's booking history is realistic (same route, similar times, consistent airline)
    - User C's preference profile has high confidence scores (0.7+)
    - Preference visualization (P3-11) shows visually different profiles for each user
```

---

## Category 10: Metrics Dashboard (P3-12)

```
10.1 Dashboard renders without errors at /admin or /dashboard

10.2 Verify metrics display:
    - Total bookings count (matches orders table)
    - Revenue total (sum of markup + service_fee from orders)
    - Average booking time
    - Preference accuracy (% of times top recommendation was accepted)
    - Top routes (aggregated from orders)
    - Conversion funnel (searches → bookings)

10.3 Verify real-time or near-real-time updates:
    - Create a new booking → dashboard reflects updated count without manual refresh
    - Or: dashboard has a refresh button that works

10.4 Edge case: Dashboard with zero data → shows empty state, not errors
```

---

## Category 11: API & Network Error Handling

```
11.1 Test all external API calls have:
    - Timeout handling (don't hang forever)
    - Retry logic where appropriate
    - User-friendly error messages (not raw error dumps)
    - Loading states while waiting for responses

11.2 Test Duffel API:
    - Invalid search params → handled gracefully
    - Rate limit response → queued/retried or user notified
    - Empty results → "No flights found" message, not crash

11.3 Test Razorpay:
    - Payment cancelled by user → handled, no orphan records
    - Payment timeout → handled
    - Invalid amount → caught before sending to Razorpay

11.4 Test Gemini:
    - API timeout → fallback to basic keyword parsing or retry
    - Rate limit → queue or fallback
    - Unexpected response format → handled, not crash
```

---

## Category 12: Security & Auth

```
12.1 Verify authentication:
    - Unauthenticated users cannot access /chat, /bookings, /settings, /admin
    - Unauthenticated users CAN access / (landing) and /onboarding
    - Auth redirects work correctly (login → intended page)

12.2 Verify authorization:
    - Regular users cannot access /admin dashboard
    - Users cannot view other users' bookings or preferences
    - API routes validate auth tokens

12.3 Verify no sensitive data exposure:
    - API keys not in client-side code
    - No Duffel/Razorpay secrets in browser console or network tab
    - User preferences API doesn't leak other users' data
```

---

## Test Report Format

After running all categories, generate a report:

```
# SkySwift Phase 3 — QA Test Report
Date: [date]

## Summary
- Total tests: [n]
- Passed: [n] ✅
- Failed: [n] ❌
- Fixed during QA: [n] 🔧

## Category Results
1. Build & Compilation: ✅ / ❌ (details)
2. Database Schema: ✅ / ❌ (details)
3. Page Rendering: ✅ / ❌ (details)
...

## Issues Found & Fixed
1. [Issue] → [Fix applied]
2. [Issue] → [Fix applied]

## Known Issues (Not Fixed)
1. [Issue] → [Reason not fixed, severity]

## Ready for Manual Testing: YES / NO
```

---

## Post-QA: Manual Test Checklist for Raman

After Claude Code automated QA passes, test these manually:

- [ ] Open app on iPhone Safari — does it look right?
- [ ] Open app on Android Chrome — does it look right?
- [ ] Complete onboarding on mobile — are tap targets big enough?
- [ ] Search "BLR to DEL next Tuesday" — does recommendation appear?
- [ ] Try "the usual" after a booking — does it work?
- [ ] Try Razorpay test payment — does UPI flow work?
- [ ] Check booking confirmation — does PNR appear?
- [ ] Visit /settings — does preference profile show?
- [ ] Liquid Glass effects — do they look smooth, no jank?
- [ ] Share booking via WhatsApp — does the referral link work?
