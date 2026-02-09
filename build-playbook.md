# 🛫 Build Playbook: Zero-Friction Travel Agent

**Your PRD → Claude Code prompts, in order. Just follow the steps.**

---

## Before You Start (One-Time Setup)

Make sure you've completed the setup guide (Homebrew, Git, GitHub CLI, Node.js, Claude Code). Then:

### 1. Create the project & connect GitHub

Open Terminal and run these commands one by one:

```bash
mkdir -p ~/Projects/travel-agent
cd ~/Projects/travel-agent
```

### 2. Copy the CLAUDE.md file

The `CLAUDE.md` file I created tells Claude Code everything about your project. Download it from this chat and place it in your project folder:

```bash
# After downloading CLAUDE.md to your Downloads folder:
cp ~/Downloads/CLAUDE.md ~/Projects/travel-agent/CLAUDE.md
```

### 3. Start Claude Code

```bash
cd ~/Projects/travel-agent
claude
```

Claude Code will automatically read `CLAUDE.md` and understand your entire project context.

---

## WEEK 1–2: Foundation

### Prompt 1 — Scaffold the Next.js app

Paste this into Claude Code:

```
Scaffold a complete Next.js 14 App Router project with TypeScript. Set up:

1. Tailwind CSS + shadcn/ui (install the button, card, input, dialog, dropdown-menu, 
   avatar, badge, separator, toast, and sheet components)
2. The folder structure from CLAUDE.md
3. A beautiful dark-themed landing page at the root route with:
   - A hero section: headline "Book flights in 30 seconds" with subtext about 
     eliminating 47 clicks. Include a CTA button "Get Started Free"
   - A "How it works" section with 3 steps: Tell us where → We find the best flight → Confirm and go
   - A comparison section: "The old way (18 min)" vs "Our way (30 sec)"
   - A waitlist email capture form (just frontend for now, store in localStorage)
   - Footer with placeholder links
4. A placeholder /dashboard route (protected, we'll add auth later)
5. Set up the .env.local.example file with all the env vars from CLAUDE.md

Make it look premium and modern — think Linear or Vercel's own website aesthetic. 
Use subtle gradients, good typography, and smooth animations.
```

### Prompt 2 — Push to GitHub

After Claude Code finishes, type `/exit` then run:

```bash
git init
git add .
git commit -m "Initial scaffold: Next.js 14 + Tailwind + shadcn/ui + landing page"
gh repo create travel-agent --public --source=. --push
```

### Prompt 3 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. Click **Add New → Project**
3. Select your `travel-agent` repo
4. Click **Deploy**
5. You now have a live URL! 🎉

Save your Vercel URL — you'll need it later.

---

## WEEK 3–4: Identity Vault (User Profiles)

### Prompt 3 — Set up Supabase Auth

First, create a Supabase project:
1. Go to [supabase.com](https://supabase.com) → sign up (free)
2. Click **New Project** → name it `travel-agent`
3. Save your **Project URL** and **anon key** (shown on the project dashboard)
4. Go to **Settings → API** and also save the **service_role key**

Then add the keys to your `.env.local` file. Go back into Claude Code:

```bash
cd ~/Projects/travel-agent
claude
```

```
Set up Supabase authentication:

1. Install @supabase/supabase-js and @supabase/ssr
2. Create the Supabase client utilities in lib/supabase/:
   - client.ts (browser client)
   - server.ts (server component client)
   - middleware.ts (for auth session refresh)
3. Build the auth pages:
   - /login page with email+password and Google SSO button
   - /signup page with email+password
   - Style them beautifully, matching the landing page design
4. Set up Next.js middleware to protect /dashboard/* routes
5. Add a user menu (avatar + dropdown) in the dashboard header with logout

My Supabase URL and anon key are in .env.local. Read the env.local.example 
for the variable names.
```

### Prompt 4 — Build the database schema

```
Create the complete Supabase database schema. Run these as SQL migrations.

Create these tables with proper types, constraints, and indexes:
- users (extends Supabase auth.users)
- user_profiles (legal name, DOB, gender, passport_vault_id, ktn_vault_id, 
  phone, emergency contact, seat_preference enum, meal_preference enum, special_assistance array)
- loyalty_programs (user_id, airline_code, airline_name, program_name, 
  membership_number, tier, tier_expiry. Unique on user_id + airline_code)
- payment_methods (user_id, stripe_payment_method_id, card_brand, last4, 
  exp_month, exp_year, is_default, billing_address as JSONB)
- bookings (user_id, pnr, booking_reference, status enum, airline_code, 
  carrier_type enum, total_price_cents, currency, payment_method_id, 
  payment_status enum, booking_source enum, booking_intent text, timestamps)
- flight_segments (booking_id, flight_number, airline_code, operating_carrier, 
  origin_airport, destination_airport, departure_time timestamptz, arrival_time timestamptz, 
  duration_minutes, cabin_class enum, seat_number, segment_status enum, delay_minutes)
- disruption_events (flight_segment_id, event_type enum, old/new departure times, 
  delay_minutes, reason, auto_rebooked boolean, new_booking_id, user_notified, notification_sent_at)
- audit_log (user_id, action, resource_type, resource_id, ip_address, user_agent)

Enable Row-Level Security on all tables. Users can only read/write their own data.
Create the proper RLS policies.

Generate a single SQL migration file I can paste into Supabase SQL Editor.
```

After Claude generates the SQL, copy it and paste it into **Supabase → SQL Editor → New Query → Run**.

### Prompt 5 — Build the conversational profile builder

```
Build the onboarding profile flow at /dashboard/onboarding. This is the killer UX moment.

Design it as a conversational, step-by-step wizard (NOT a boring form). Each step 
should feel like a chat:

Step 1: "Let's get to know you" 
  - Legal first name, middle name (optional), last name
  - Date of birth
  - Gender (M/F/X)

Step 2: "Travel documents"
  - Passport number (with a note: "encrypted and secure 🔒")
  - Known Traveler Number / TSA PreCheck (optional)
  - Redress number (optional)

Step 3: "Your loyalty programs"
  - Add airline loyalty programs (searchable dropdown of major airlines)
  - For each: airline, program name, membership number, tier
  - Can add multiple, can skip

Step 4: "Your preferences"
  - Seat preference (aisle/window/middle/no preference) — visual selector with airplane icons
  - Meal preference (standard/vegetarian/vegan/kosher/halal/gluten-free)
  - Special assistance needs (optional checkboxes)

Step 5: "You're all set!" 
  - Summary of what they entered
  - CTA: "Start booking flights →"

Each step should:
- Auto-save to Supabase as they go (so they can leave and come back)
- Have a progress indicator
- Have beautiful transitions between steps
- Use React Hook Form + Zod for validation
- Save to the user_profiles and loyalty_programs tables

Route to /dashboard after completion. Set onboarding_completed = true.
```

### Commit & push

Exit Claude Code and push:

```bash
git add .
git commit -m "Add auth, database schema, onboarding profile wizard"
git push
```

Vercel auto-deploys! Check your live URL.

---

## WEEK 5–6: Chat Interface + Intent Parsing

### Prompt 6 — Build the chat booking interface

```
Build the main booking interface at /dashboard as a chat UI. This is the core product.

Design a beautiful conversational interface:
1. Left sidebar: navigation (Book a Flight, My Bookings, Profile, Settings)
2. Main area: chat interface similar to ChatGPT/Claude but travel-themed
   - Message input at bottom with placeholder "Where would you like to fly?"
   - Messages display area with our agent's avatar and user's avatar
   - Agent messages should have a distinct style (left-aligned, branded)
   - User messages right-aligned
   - Support for "flight card" components inline in chat (show flight details as rich cards)

3. When the user submits a message:
   - Show a typing indicator
   - Call our API route /api/flights/parse-intent (we'll build this next)
   - Display the parsed intent back as a confirmation: 
     "I found these flights for you: [flight cards]"

4. Flight result cards should show:
   - Airline logo (use placeholder for now)
   - Flight number
   - Departure → Arrival (with airport codes and times)
   - Duration
   - Cabin class
   - Price
   - "Select this flight" button

5. After selecting a flight, show a booking summary card:
   - Flight details
   - Passenger details (pulled from profile)
   - Price breakdown
   - "Confirm & Pay" button

Use Vercel AI SDK for streaming responses. Use TanStack Query for data fetching.
Make it responsive — should work on mobile too.
```

### Prompt 7 — Build the Claude intent parser API

```
Build the flight intent parsing API at /api/flights/parse-intent.

This API route:
1. Receives the user's natural language message (e.g., "Book the morning BA flight 
   to London next Monday, aisle seat")
2. Calls the Anthropic Claude API (claude-sonnet-4-5-20250514) with a structured system prompt
3. Extracts these fields:
   - airline (name + IATA code, if mentioned)
   - origin (airport code — infer from user's profile if not specified)
   - destination (city name + airport code)
   - date (calculate relative dates: "next Monday", "tomorrow", "Feb 15")
   - time_preference (morning/afternoon/evening/red-eye + time range)
   - cabin_class (economy/premium_economy/business/first, if mentioned)
   - seat_preference (aisle/window, if mentioned — also check user profile default)
   - flexibility (exact_date vs flexible ±3 days)
   - return_date (if round trip mentioned)
4. If required fields are missing (especially date), return a status: "needs_clarification" 
   with suggested follow-up questions
5. Returns clean JSON

Also build /api/flights/search that takes the parsed intent and returns mock flight 
results for now. Create realistic mock data for these routes:
- SFO → LHR (British Airways)
- SFO → JFK (United, American, JetBlue)
- LAX → LHR (British Airways, Virgin Atlantic)
- NYC → SFO (United, American)

Include realistic prices, times, flight numbers, and durations.
Make the mock data feel real — different prices for different cabin classes, 
varying availability, etc.
```

### Prompt 8 — Wire it all together

```
Connect the chat interface to the intent parser and flight search:

1. When user types a message → call /api/flights/parse-intent
2. If intent is complete → call /api/flights/search with parsed parameters
3. Display flight results as rich cards in the chat
4. If intent needs clarification → agent asks follow-up question in chat
5. When user selects a flight → show booking summary with:
   - Their profile data auto-filled (name, passport status, loyalty program)
   - Selected seat preference
   - Price breakdown
   - "Confirm Booking" button (for now, just show a success message — 
     real payment comes in Week 9-10)

Also add:
- Chat history (persist in localStorage so refreshing doesn't lose context)
- A "New booking" button to start fresh
- Loading states and error handling throughout
- Smooth scroll-to-bottom on new messages
```

### Commit & push

```bash
git add .
git commit -m "Add chat booking interface + Claude intent parser + mock flight search"
git push
```

---

## WEEK 7–8: Real Flight Data (Amadeus GDS)

The PRD says BA NDC first, but Amadeus is easier to get access to (free signup, no airline approval). Start here.

### Setup: Get Amadeus API keys

1. Go to [developers.amadeus.com](https://developers.amadeus.com)
2. Sign up (free)
3. Create an app → get your **API Key** and **API Secret**
4. Add them to your `.env.local`

### Prompt 9 — Integrate Amadeus flight search

```
Replace the mock flight search with real Amadeus API integration.

1. Create lib/amadeus/client.ts:
   - OAuth 2.0 token management (auto-refresh when expired)
   - Base URL: https://test.api.amadeus.com/v2 (test environment)
   
2. Create lib/amadeus/flights.ts:
   - searchFlights(origin, destination, date, adults, cabinClass?)
     → Calls GET /shopping/flight-offers
     → Parses response into our FlightOffer type
   - getFlightPrice(offerId)
     → Calls POST /shopping/flight-offers/pricing
     → Returns confirmed price

3. Update /api/flights/search to use real Amadeus data instead of mocks:
   - Map our parsed intent to Amadeus API parameters
   - Transform Amadeus response to our FlightOffer type
   - Handle errors gracefully (no flights found, API down, etc.)
   - Cache results for 5 minutes (same search = same results)

4. Update the flight cards in the chat to display real data:
   - Real airline names and flight numbers
   - Real departure/arrival times with timezone handling
   - Real prices
   - Number of stops
   - Aircraft type

Handle edge cases:
- No flights found for that date → suggest nearby dates
- API timeout → show friendly error, offer to retry
- Rate limit hit → queue and retry with backoff
```

### Commit & push

```bash
git add .
git commit -m "Integrate Amadeus GDS for real flight search"
git push
```

---

## WEEK 9–10: Payments (Stripe)

### Setup: Get Stripe keys

1. Go to [stripe.com](https://stripe.com) → sign up
2. Stay in **Test Mode** (toggle at top)
3. Go to **Developers → API Keys**
4. Copy **Publishable key** and **Secret key** to `.env.local`

### Prompt 10 — Stripe payment integration

```
Integrate Stripe for payment processing. We NEVER touch raw card data.

1. Install stripe and @stripe/stripe-js and @stripe/react-stripe-js

2. Build /dashboard/settings/payment page:
   - "Add payment method" button → opens Stripe Elements card input (the iframe)
   - List saved payment methods (card brand icon, last 4 digits, expiry)
   - Set default payment method
   - Delete payment method
   - All card data goes directly to Stripe — we only store the payment_method_id

3. Build API routes:
   - POST /api/payments/setup-intent → creates Stripe SetupIntent (for saving cards)
   - POST /api/payments/create-payment → creates PaymentIntent when booking confirmed
   - POST /api/webhooks/stripe → handles Stripe webhook events

4. Update the booking confirmation flow in the chat:
   - After user selects flight and clicks "Confirm & Pay"
   - Show payment method selector (their saved cards)
   - If no cards saved → prompt to add one inline
   - Process payment via Stripe
   - On success → show booking confirmation with PNR
   - On failure → show specific error message (card declined, insufficient funds, etc.)
   - Save booking to database with payment_intent_id

5. Build the booking confirmation display:
   - Beautiful confirmation card in the chat
   - Flight details + PNR code (large, prominent)
   - "View in My Bookings" link
   - Trigger confirmation email (just log for now, we'll add SendGrid later)

Use Stripe test cards for testing:
- Success: 4242 4242 4242 4242
- Declined: 4000 0000 0000 0002
```

### Commit & push

```bash
git add .
git commit -m "Add Stripe payment integration + booking confirmation flow"
git push
```

---

## WEEK 11–12: Polish, My Bookings & Beta Prep

### Prompt 11 — My Bookings page

```
Build the My Bookings page at /dashboard/bookings:

1. List all user's bookings, sorted by date (upcoming first)
2. Each booking card shows:
   - Status badge (confirmed, pending, cancelled, completed)
   - Flight number + airline
   - Route (SFO → LHR) with airport names
   - Date and times
   - Cabin class + seat number
   - PNR code (with copy button)
   - Price paid
3. Click a booking → expand to show full details:
   - Passenger details
   - Payment info (last 4 of card used)
   - Booking timeline (when booked, when paid, status changes)
4. Cancel booking button (with confirmation dialog)
5. Empty state: "No bookings yet. Start by telling me where you want to fly!"

Also build /dashboard/settings/profile:
- View and edit profile information
- View and manage loyalty programs
- All the data from onboarding, but in an editable form
```

### Prompt 12 — Email confirmations

```
Set up email confirmations using SendGrid (or Resend as a simpler alternative):

1. Install the email SDK
2. Create email templates in lib/email/:
   - booking-confirmation.tsx: Beautiful HTML email with:
     - Flight details (airline, route, times, seat)
     - PNR code (large and prominent)
     - Price breakdown
     - "View booking" button linking to our app
     - Company branding in header/footer
3. Create /api/email/send-confirmation route
4. Trigger email after successful booking in the payment flow
5. Add email to audit_log

Use React Email for templating if possible — it makes beautiful emails easy.
```

### Prompt 13 — Error handling, loading states & polish

```
Do a comprehensive polish pass across the entire app:

1. Error handling:
   - Add error boundaries for each major section
   - All API routes return consistent { data, error, message } format
   - Show toast notifications for errors (using shadcn toast)
   - Network error → "Connection issue, retrying..."
   - 500 error → "Something went wrong. Please try again."

2. Loading states:
   - Skeleton loaders for bookings list
   - Typing indicator in chat while waiting for AI response
   - Button loading spinners during payment
   - Full-page loading for initial auth check

3. Mobile responsiveness:
   - Chat interface works on mobile (full screen)
   - Sidebar collapses to hamburger menu on mobile
   - Flight cards stack vertically on small screens
   - Payment form is touch-friendly

4. Accessibility:
   - Proper aria labels on interactive elements
   - Keyboard navigation works in chat
   - Color contrast meets WCAG AA

5. Performance:
   - Add loading.tsx files for each route segment
   - Use dynamic imports for heavy components
   - Optimize images (next/image)

6. Set up Sentry for error tracking:
   - Install @sentry/nextjs
   - Configure for both client and server errors
   - Add to Vercel environment variables
```

### Final commit & push

```bash
git add .
git commit -m "Polish pass: error handling, loading states, mobile, email confirmations"
git push
```

---

## Post-MVP Quick Wins (Month 4+)

Once the core is working, here are follow-up prompts for your PRD's post-MVP features:

### Disruption monitoring (Month 4)
```
Integrate FlightAware AeroAPI for flight disruption monitoring:
1. Create a Vercel Cron job that runs every 15 minutes
2. Query all flight_segments with departure_time within next 48 hours
3. Check each flight's status via FlightAware API
4. If cancelled → create disruption_event, search for alternative flights, 
   notify user via email with rebooking options
5. If delayed > 60 min → notify user with updated time
6. Store all events in disruption_events table
```

### Multi-airline search (Month 5)
```
Expand flight search to query multiple airlines simultaneously:
1. Search Amadeus for all airlines on the route
2. If user specified an airline, filter results
3. Sort by: user's preferred airline first, then by price
4. Show loyalty program match indicators (⭐ when airline matches their program)
5. Optimize for connections — show direct flights first, then 1-stop
```

### Mobile app (Month 6)
```
Convert this to a React Native app using Expo:
1. Reuse all the API routes (they stay on Vercel)
2. Build native chat interface
3. Add Apple Wallet pass generation for boarding passes
4. Add push notifications via Firebase
```

---

## Deployment Checklist

Before inviting beta users:

- [ ] All environment variables set in Vercel dashboard (Settings → Environment Variables)
- [ ] Supabase project on paid plan (free tier has connection limits)
- [ ] Stripe in Test Mode (switch to Live Mode only when ready for real payments)
- [ ] Sentry configured and receiving errors
- [ ] Custom domain connected in Vercel (optional but professional)
- [ ] Privacy policy page exists (required for Stripe and data handling)
- [ ] Terms of service page exists

### Connect a custom domain (optional)

In Vercel → your project → Settings → Domains → Add your domain
Follow Vercel's DNS instructions for your domain registrar.

---

## Quick Reference: Key Commands

| What | Command |
|---|---|
| Start working | `cd ~/Projects/travel-agent && claude` |
| Save progress | `/exit` then `git add . && git commit -m "description" && git push` |
| Check live site | Visit your Vercel URL |
| View Supabase data | Go to supabase.com → your project → Table Editor |
| Check Stripe payments | Go to stripe.com → Dashboard → Payments (Test Mode) |
| View errors | Go to sentry.io → your project |
| Run locally | `npm run dev` (opens at localhost:3000) |

---

## Tips for Vibe Coding Success

1. **One prompt at a time.** Don't paste 3 prompts at once. Let Claude Code finish, test it, then move on.

2. **Test after every prompt.** Run `npm run dev` and check localhost:3000 in your browser.

3. **If something breaks**, tell Claude Code exactly what you see:
   - "I'm getting this error in the terminal: [paste error]"
   - "The page shows a white screen when I click the login button"
   - "The flight search returns empty results"

4. **Git commit often.** After each working feature, commit. This is your "save game."

5. **Keep your `.env.local` safe.** Never commit it to GitHub. It's in `.gitignore` by default.

6. **Vercel auto-deploys** every time you `git push`. Your live site updates in ~30 seconds.

7. **If you're stuck**, just describe what's happening to Claude Code in plain English. It'll figure it out.

-----------

# 🛫 Phase 2 Roadmap: First Real Booking → 100 Bookings → Investors

**Timeline:** 12 weeks (3 months)
**North Star:** Complete first real end-to-end booking where a human pays real money and flies on a real plane.

---

## Strategic Prioritization

Everything is sequenced around one question: **"What's blocking the first real booking?"**

| Priority | Workstream | Why this order | Weeks |
|---|---|---|---|
| 🔴 P0 | **Duffel Integration + Supply Layer** | Can't book real flights without real supply | 1–3 |
| 🔴 P0 | **Pricing Engine** | Can't charge customers without markup/fees | 3–4 |
| 🟡 P1 | **Apple-Level UX Redesign** | Won't convert or impress investors without killer UX | 4–8 |
| 🟡 P1 | **Live Mode + First Real Booking** | The milestone — real money, real flight | 5–6 |
| 🟢 P2 | **Scale to 100 Bookings** | Prove repeatability, gather data for investors | 7–10 |
| ⚪ P3 | **Complex Intents (Backlog)** | Nice-to-have, log for later | 11–12 |

---

## WORKSTREAM 1: Duffel Integration + Supply Abstraction Layer (Weeks 1–3)

### Why Duffel

Duffel is the fastest path to real bookings because:
- **No ARC/IATA accreditation needed** — Duffel handles ticketing authority ("Managed Content")
- **No airline approval wait** — instant sandbox access, fast live mode activation
- **Modern REST/JSON API** — not XML like BA NDC
- **Pay-per-booking** — no upfront costs, ~$1-3 per booking
- **20+ airlines** — one integration, many carriers
- **Built-in payments** — Duffel Balance or collect customer card payments via Duffel Payments
- **JS client library** — first-class Node.js SDK

### Spec: Supply Abstraction Layer

The key architectural insight: **don't hardcode Duffel.** Build an abstraction layer so you can swap/add suppliers (Amadeus, BA NDC, Kiwi, etc.) behind a unified interface.

```
lib/supply/
├── types.ts              # Unified types: FlightOffer, Booking, Passenger, etc.
├── supply-manager.ts     # Orchestrator: routes requests to correct supplier
├── rules-engine.ts       # Business rules: which supplier for which route/airline
├── suppliers/
│   ├── supplier.interface.ts   # Interface all suppliers implement
│   ├── duffel/
│   │   ├── client.ts           # Duffel SDK wrapper
│   │   ├── mapper.ts           # Duffel types → our unified types
│   │   └── duffel-supplier.ts  # Implements SupplierInterface
│   ├── amadeus/
│   │   ├── client.ts
│   │   ├── mapper.ts
│   │   └── amadeus-supplier.ts
│   └── mock/
│       └── mock-supplier.ts    # For testing
```

**SupplierInterface** — every supplier must implement:
```typescript
interface SupplierInterface {
  name: string;
  searchFlights(params: SearchParams): Promise<FlightOffer[]>;
  getOfferDetails(offerId: string): Promise<FlightOffer>;
  createBooking(offer: FlightOffer, passengers: Passenger[], payment: PaymentInfo): Promise<Booking>;
  cancelBooking(bookingId: string): Promise<CancellationResult>;
  getBooking(bookingId: string): Promise<Booking>;
  getSeatMap?(offerId: string): Promise<SeatMap>;        // optional
  getAvailableBags?(offerId: string): Promise<BagOption[]>; // optional
}
```

**Rules Engine** — decides which supplier to use:
```typescript
// Simple version for now, expand later
const rules = [
  { condition: "airline=Duffel Airways", supplier: "duffel" },    // testing
  { condition: "default", supplier: "duffel" },                    // duffel is default
  { condition: "airline=BA AND route=SFO-LHR", supplier: "ba_ndc" }, // future: direct NDC
];
```

### Duffel API Flow

```
User: "Book morning flight SFO to London next Monday"
                    │
                    ▼
        ┌─ Claude Intent Parser ─┐
        │  origin: SFO           │
        │  destination: LHR      │
        │  date: 2026-02-16      │
        │  time: morning         │
        └────────┬───────────────┘
                 │
                 ▼
     ┌─ Supply Manager ──────────┐
     │  Rules Engine → "duffel"  │
     └────────┬──────────────────┘
              │
              ▼
     ┌─ Duffel Supplier ────────────────────────┐
     │                                            │
     │  1. POST /air/offer_requests               │
     │     → slices: [{SFO→LHR, 2026-02-16}]    │
     │     → passengers: [{type: "adult"}]        │
     │     → cabin_class: "economy"               │
     │     Returns: offers[] with pricing         │
     │                                            │
     │  2. GET /air/offers/{offer_id}             │
     │     → Fresh price + full details           │
     │     → Available services (bags, seats)     │
     │                                            │
     │  3. POST /air/orders                       │
     │     → selected_offers: [offer_id]          │
     │     → passengers: [name, DOB, passport]    │
     │     → payments: [{type: "balance"}]        │
     │     Returns: booking_reference (PNR)       │
     │                                            │
     └──────────────────────────────────────────┘
```

### Setup: Get Duffel Access

1. Go to [app.duffel.com/join](https://app.duffel.com/join) — sign up (1 minute)
2. In dashboard → More → Developers → Access Tokens
3. Create a **test** token (starts with `duffel_test_`)
4. Add to `.env.local`: `DUFFEL_API_TOKEN=duffel_test_xxxxx`
5. For live mode later: complete account activation (KYC, add balance)

---

## WORKSTREAM 2: Pricing Engine (Weeks 3–4)

### Spec: Pricing Architecture

Every booking needs three price layers:

```
┌─────────────────────────────────────────────┐
│  What the customer sees:                     │
│                                              │
│  Base fare (from Duffel)        $847.00      │
│  Taxes & fees (from Duffel)     $150.00      │
│  ─────────────────────────────────────       │
│  Subtotal                       $997.00      │
│  Service fee                     $15.00      │
│  ─────────────────────────────────────       │
│  Total                        $1,012.00      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  What happens behind the scenes:             │
│                                              │
│  Duffel cost (base + taxes)     $997.00      │
│  Our markup (hidden in fare)     $10.00      │
│  Service fee (visible)           $15.00      │
│  ─────────────────────────────────────       │
│  Customer pays                $1,022.00      │
│  Stripe fees (2.9% + $0.30)    -$29.94      │
│  Duffel fee (~$1-3/booking)      -$2.00      │
│  ─────────────────────────────────────       │
│  Our net revenue                 $13.06      │
└─────────────────────────────────────────────┘
```

**Pricing config (stored in DB, editable via admin):**
```typescript
interface PricingConfig {
  markup_type: "percentage" | "fixed";       // How to calculate hidden markup
  markup_value: number;                       // e.g., 1.5 (%) or 10 ($)
  markup_cap: number;                         // Max markup in $ (e.g., $50)
  service_fee_type: "percentage" | "fixed";  // Visible service fee
  service_fee_value: number;                  // e.g., 15 ($)
  concierge_fee?: number;                     // Optional premium fee
  min_booking_fee: number;                    // Floor (e.g., $5 minimum)
  currency: string;                           // USD
}
```

**Database table:**
```sql
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,                    -- "default", "premium", "promo"
  is_active BOOLEAN DEFAULT TRUE,
  markup_type TEXT DEFAULT 'percentage',
  markup_value NUMERIC DEFAULT 1.5,      -- 1.5%
  markup_cap NUMERIC DEFAULT 50,         -- max $50
  service_fee_type TEXT DEFAULT 'fixed',
  service_fee_value NUMERIC DEFAULT 15,  -- $15 flat
  concierge_fee NUMERIC DEFAULT 0,
  min_total_fee NUMERIC DEFAULT 5,       -- min $5 revenue per booking
  applies_to JSONB,                      -- optional filters: route, cabin, etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## WORKSTREAM 3: Apple-Level UX Redesign (Weeks 4–8)

### Design Philosophy

Think: **What if Apple built a flight booking app?**

Core principles from Apple's Liquid Glass design language (WWDC 2025):
- **Translucent surfaces** — glassmorphism with backdrop-filter blur, light refraction
- **Content-first** — controls give way to content, shrink when not needed
- **Fluid transitions** — everything morphs, nothing jump-cuts
- **Concentric with hardware** — rounded corners match device corners
- **Depth through light** — specular highlights, subtle shadows, layered glass
- **Invisible until needed** — progressive disclosure, minimal chrome

### Design System Spec

**Color palette:**
```css
/* Light mode — warm, premium */
--glass-bg: rgba(255, 255, 255, 0.72);
--glass-border: rgba(255, 255, 255, 0.3);
--glass-blur: 24px;
--surface-primary: #FAFAFA;
--surface-elevated: rgba(255, 255, 255, 0.85);
--text-primary: #1A1A2E;
--text-secondary: #6B7280;
--accent: #0071E3;               /* Apple blue */
--accent-hover: #0077ED;
--success: #30D158;              /* Apple green */
--warning: #FF9F0A;
--destructive: #FF453A;

/* Dark mode — deep, immersive */
--glass-bg: rgba(30, 30, 40, 0.72);
--glass-border: rgba(255, 255, 255, 0.08);
--surface-primary: #0A0A0F;
--text-primary: #F5F5F7;
```

**Typography:**
```css
--font-display: 'SF Pro Display', system-ui;
--font-body: 'SF Pro Text', system-ui;
--font-mono: 'SF Mono', monospace;

/* Or for web (since SF Pro requires Apple devices): */
--font-display: 'Satoshi', 'Inter', system-ui;  /* Satoshi is distinctive */
--font-body: 'General Sans', system-ui;
```

**Glass card component:**
```css
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(1.8);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.8);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  box-shadow:
    0 0 0 0.5px rgba(255, 255, 255, 0.1),
    0 8px 40px rgba(0, 0, 0, 0.12),
    inset 0 0 20px -5px rgba(255, 255, 255, 0.15);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Animations:**
```css
/* Smooth page transitions */
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

/* Staggered reveal on load */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
```

### Key Screens to Redesign

**1. Chat Interface (the core product)**
- Full-bleed on mobile (no chrome, feels native)
- Messages float on glass cards
- Flight result cards are rich, visual — airline logo, route map, gradient accent per airline
- Confirmation card has celebratory micro-animation (subtle confetti or checkmark pulse)
- Bottom input bar with glass effect, smooth keyboard avoidance
- Typing indicator is an animated glass pill

**2. Onboarding**
- Each step is a full-screen immersive experience
- Parallax background that subtly shifts between steps
- Input fields are large, touch-optimized, with fluid focus animations
- Progress as a thin, animated glass bar at the top

**3. Booking Confirmation**
- Full-screen celebration moment
- Boarding-pass-style card with airline branding
- Animated route line (origin → destination)
- "Add to Apple Wallet" CTA (future)
- Share button

**4. My Bookings**
- Timeline view (not a boring list)
- Each booking is a glass card with airline accent color
- Upcoming flights have countdown ("In 3 days")
- Expandable for full details with smooth spring animation

**5. Landing Page**
- Hero with video/animation showing 30-second booking
- Glass morphism throughout
- Responsive — looks native on mobile Safari
- Performance: < 2s LCP, smooth 60fps animations

---

## WORKSTREAM 4: Live Mode + First Real Booking (Weeks 5–6)

### Duffel Live Mode Activation

1. In Duffel Dashboard → Account Settings → complete KYC verification
2. Add funds to Duffel Balance (start with $500-1000)
3. Create **live** access token (starts with `duffel_live_`)
4. Enable Duffel Payments (to collect customer card payments)
5. Add live token to Vercel environment variables

### End-to-End Booking Flow (Live)

```
Customer                    Our App                      Duffel                Stripe
   │                           │                           │                    │
   │  "Book SFO→LHR Monday"   │                           │                    │
   │ ─────────────────────────>│                           │                    │
   │                           │  POST /offer_requests     │                    │
   │                           │ ─────────────────────────>│                    │
   │                           │  offers[] (real flights)  │                    │
   │                           │ <─────────────────────────│                    │
   │                           │                           │                    │
   │                           │  Apply pricing rules      │                    │
   │                           │  (markup + service fee)   │                    │
   │                           │                           │                    │
   │  Show offers + our price  │                           │                    │
   │ <─────────────────────────│                           │                    │
   │                           │                           │                    │
   │  "Confirm & Pay"          │                           │                    │
   │ ─────────────────────────>│                           │                    │
   │                           │  Charge customer card     │                    │
   │                           │ ──────────────────────────┼───────────────────>│
   │                           │  payment_intent succeeded │                    │
   │                           │ <─────────────────────────┼────────────────────│
   │                           │                           │                    │
   │                           │  POST /orders (book!)     │                    │
   │                           │ ─────────────────────────>│                    │
   │                           │  PNR + booking confirmed  │                    │
   │                           │ <─────────────────────────│                    │
   │                           │                           │                    │
   │  "Booked! PNR: ABC123"   │                           │                    │
   │ <─────────────────────────│                           │                    │
   │                           │  Send confirmation email  │                    │
   │ <────────────────────────────────────────────────────────────────────────── │
```

### First Booking Checklist

- [ ] Book 3 test flights using Duffel sandbox (Duffel Airways LHR→JFK)
- [ ] Book 1 test flight with a real airline in sandbox
- [ ] Switch to live mode
- [ ] Book yourself a real short-haul flight (cheapest possible, ~$50-80)
- [ ] Verify PNR works on airline website
- [ ] Verify you received a real confirmation email from the airline
- [ ] 🎉 **First real booking complete!**

---

## WORKSTREAM 5: Scale to 100 Bookings (Weeks 7–10)

### User Acquisition Strategy

**Week 7-8: Inner circle (10 bookings)**
- Book for yourself (2-3 trips)
- Ask 5-7 friends/colleagues to book their next real flight through the app
- White-glove support — be available on iMessage while they book
- Offer to cover the service fee for first booking

**Week 9-10: Expanded beta (90 bookings)**
- Product Hunt launch
- Post in r/Flights, r/TravelHacks, FlyerTalk
- LinkedIn posts targeting consultants and frequent travelers
- Offer "founding member" pricing: $0 service fee for first 100 users

### Monitoring Dashboard

Track daily:
- Bookings attempted vs. completed (success rate)
- Average booking time (target < 2 min)
- Revenue per booking (markup + service fee)
- Top failure reasons (API errors, payment declines, user abandonment)
- NPS from post-booking survey

---

## WORKSTREAM 6: Complex Intents — Backlog (Weeks 11-12)

Log these for later. Improve Claude's understanding of:

- **Multi-city:** "I need to go SFO → London → Paris → SFO"
- **Flexible dates:** "Cheapest day to fly to NYC next week"
- **Companion booking:** "Book the same flight for me and my wife"
- **Preferences as context:** "Book like last time but one day earlier"
- **Rebooking:** "Change my Monday flight to Tuesday"
- **Cancellation:** "Cancel my London trip"
- **Ancillaries in natural language:** "Add an extra bag" or "Get me a window seat"

For now, just log unsupported intents to a `failed_intents` table so you can see what users are trying to do.

---

## Claude Code Build Playbook

### Setup: Update CLAUDE.md

Before starting, update your CLAUDE.md with the new context. Start Claude Code:

```bash
cd ~/Projects/travel-agent
claude
```

```
Read the current CLAUDE.md and append the following to it:

## Phase 2 Context

### Duffel Integration
- Primary supply source is now Duffel (replaces Amadeus for real bookings)
- Duffel JS SDK: @duffel/api
- Test token env var: DUFFEL_API_TOKEN
- API flow: Create Offer Request → Select Offer → Create Order
- Duffel uses "slices" (journey segments) and "offers" (bookable options)
- Payment via Duffel Balance (sandbox: unlimited, live: pre-funded)
- Duffel handles ticketing/accreditation — we don't need ARC/IATA

### Supply Abstraction Layer
- All flight suppliers implement a unified SupplierInterface
- Supply Manager + Rules Engine routes requests to correct supplier
- Currently: Duffel (primary), Amadeus (legacy/fallback), Mock (testing)
- Future: BA NDC, United NDC, etc.

### Pricing Engine
- Markup (hidden in fare): configurable % or fixed amount
- Service fee (visible to customer): configurable
- Concierge fee (optional premium): configurable
- Pricing rules stored in pricing_rules table
- Applied between search results and customer display

### Design Language
- Apple Liquid Glass inspired (WWDC 2025)
- Glassmorphism: backdrop-filter blur, translucent surfaces
- Content-first, fluid transitions, mobile-native feel
- Typography: Satoshi (display) + General Sans (body) via Google Fonts/Fontsource
- Color: warm neutrals + Apple blue accent
- Animations: spring easing, staggered reveals, 60fps
```

---

### PROMPT 1 — Supply Abstraction Layer (Week 1)

```
Build a supply abstraction layer for flight data. This is a critical architectural 
piece that lets us swap between Duffel, Amadeus, and future suppliers.

Create the following structure in lib/supply/:

1. types.ts — Unified types that ALL suppliers map to:
   - SearchParams: origin, destination, date, returnDate?, passengers, cabinClass?
   - FlightOffer: id, supplierId, supplierName, price (amount, currency, breakdown), 
     slices[] (each with segments[]: airline, flightNumber, origin, destination, 
     departureTime, arrivalTime, duration, aircraft, cabin, baggageIncluded), 
     expiresAt, conditions (changeable, refundable, penalties)
   - Passenger: id, type, title, firstName, lastName, dateOfBirth, gender, 
     email, phone, passportNumber?, knownTravelerNumber?, loyaltyProgramId?
   - Booking: id, supplierId, supplierBookingRef (PNR), status, offer, 
     passengers[], totalPaid, currency, createdAt
   - PaymentInfo: type, amount, currency
   - SeatMap, BagOption (optional interfaces)

2. supplier.interface.ts — The interface all suppliers must implement:
   - searchFlights(params) → FlightOffer[]
   - getOfferDetails(offerId) → FlightOffer
   - createBooking(offerId, passengers, payment) → Booking
   - cancelBooking(bookingId) → CancellationResult
   - getBooking(bookingId) → Booking

3. suppliers/mock/mock-supplier.ts — Mock supplier for testing
   - Returns realistic mock data
   - Implements full interface

4. supply-manager.ts — Orchestrator that:
   - Accepts a search request
   - Consults the rules engine for which supplier(s) to use
   - Can query multiple suppliers in parallel and merge results
   - Deduplicates and sorts results
   - Tags each offer with its source supplier

5. rules-engine.ts — Simple rules engine:
   - Reads rules from a config (hardcoded array for now, DB later)
   - Default rule: use "duffel"
   - Supports rules like: if airline=X use supplier Y
   - Supports fallback: if primary fails, try secondary

Write comprehensive TypeScript types. Make this clean and extensible.
Test the mock supplier works by calling supply-manager with a sample search.
```

### PROMPT 2 — Duffel Supplier Implementation (Week 1-2)

First install the Duffel SDK:
```bash
# In a separate terminal:
cd ~/Projects/travel-agent
npm install @duffel/api
```

Then in Claude Code:

```
Implement the Duffel supplier in lib/supply/suppliers/duffel/:

1. client.ts — Duffel SDK wrapper:
   - Initialize Duffel client with DUFFEL_API_TOKEN from env
   - Handle token for test vs live mode

2. mapper.ts — Map between Duffel types and our unified types:
   - mapDuffelOfferToFlightOffer(): Convert Duffel's offer object 
     (with slices, segments, passengers, conditions) to our FlightOffer type
   - mapPassengerToDuffel(): Convert our Passenger type to Duffel's 
     passenger format (including title, born_on, gender, email, phone)
   - mapDuffelOrderToBooking(): Convert Duffel's order response to our Booking type
   - Handle all edge cases: missing data, different cabin class names, 
     baggage formats, etc.

3. duffel-supplier.ts — Implements SupplierInterface:
   
   searchFlights(params):
   - Create an OfferRequest with slices from our SearchParams
   - Map cabin_class (our "economy" → Duffel's "economy")
   - Map passengers (attach ages for children)
   - Return offers sorted by price
   - Handle: no results, API errors, timeout
   
   getOfferDetails(offerId):
   - Call GET /air/offers/{id} to get fresh price
   - Return mapped FlightOffer with updated pricing
   
   createBooking(offerId, passengers, payment):
   - Call POST /air/orders with:
     - selected_offers: [offerId]
     - passengers: mapped from our Passenger type (include name, DOB, 
       gender, email, phone, passport if available)
     - payments: [{ type: "balance", amount, currency }] for sandbox
   - Return Booking with PNR (booking_reference from Duffel)
   - Handle errors: offer expired, sold out, invalid passenger data
   
   cancelBooking(bookingId):
   - Get cancellation quote via Duffel API
   - Execute cancellation
   - Return refund amount

4. Update supply-manager.ts to register the Duffel supplier

5. Update the API routes (/api/flights/search and booking flow) to use 
   supply-manager instead of the old Amadeus integration

6. Test: Search for flights from LHR to JFK (Duffel Airways works in sandbox)
   and verify results come through correctly.

Keep the Amadeus supplier working as a fallback — don't delete it, just make 
Duffel the default in the rules engine.
```

### PROMPT 3 — Pricing Engine (Week 3)

```
Build the pricing engine at lib/pricing/:

1. Create the pricing_rules table in Supabase. Generate SQL migration:
   - id, name, is_active, markup_type (percentage|fixed), markup_value, 
     markup_cap, service_fee_type, service_fee_value, concierge_fee, 
     min_total_fee, applies_to (JSONB for route/cabin filters), timestamps
   - Insert a default rule: 1.5% markup (cap $50) + $12 service fee
   - RLS: only admins can edit, service role can read

2. pricing-engine.ts:
   - calculatePrice(baseFare: number, taxesAndFees: number, rule: PricingRule):
     Returns { 
       baseFare,           // original from supplier
       taxesAndFees,       // original from supplier
       markup,             // our hidden markup (included in displayed fare)
       serviceFee,         // visible line item
       conciergeFee,       // if applicable
       totalCustomerPays,  // what they see and pay
       totalSupplierCost,  // what we pay to Duffel
       ourRevenue          // totalCustomerPays - totalSupplierCost - estimatedStripeFee
     }
   - getPricingRule(route?, cabinClass?, userId?): fetch active rule from DB
   - Apply markup cap (never exceed max)
   - Apply minimum fee floor

3. Update the flight search flow:
   - After getting offers from supply-manager, run each through pricing engine
   - Display the customer-facing total (base + taxes + markup bundled as "fare")
   - Show service fee as separate line item
   - Store both supplier cost and customer price in the booking record

4. Update the booking confirmation display:
   - Show price breakdown:
     Flight fare:     $857.00  (base + taxes + hidden markup)
     Service fee:      $12.00
     ─────────────────────────
     Total:           $869.00
   - Store our_revenue in the bookings table for tracking

5. Build a simple admin pricing page at /dashboard/admin/pricing (protected):
   - View current pricing rules
   - Edit markup percentage and service fee
   - Toggle rules active/inactive
   - Only accessible if user email matches an admin list in env vars

Make the engine pure functions (easy to test). No side effects in the calculator.
```

### PROMPT 4 — Stripe + Duffel Payment Flow (Week 3-4)

```
Rewire the payment flow to work with real Duffel bookings:

The flow is:
1. Customer selects flight → we show our priced total
2. Customer clicks "Confirm & Pay" 
3. We charge their card via Stripe for OUR total (supplier cost + markup + service fee)
4. On payment success → we call Duffel to create the order (paying from our Duffel Balance)
5. Duffel confirms booking → we show PNR to customer
6. If Duffel booking fails → we refund the Stripe charge automatically

Build this:

1. Update the booking confirmation component:
   - Show price breakdown (fare + service fee = total)
   - Payment method selector (saved cards or add new)
   - "Confirm & Pay $X" button with the exact total

2. Create /api/booking/create-order route:
   - Step 1: Validate offer is still available (getOfferDetails)
   - Step 2: Recalculate price (in case offer price changed)
   - Step 3: If price changed > 2%, show updated price to user for re-confirmation
   - Step 4: Create Stripe PaymentIntent for customer total
   - Step 5: Confirm Stripe payment
   - Step 6: Call Duffel createBooking (paying from balance)
   - Step 7: Save booking to our database with both Stripe and Duffel references
   - Step 8: Send confirmation email
   - Error handling:
     - Stripe fails → show error, don't call Duffel
     - Duffel fails after Stripe charged → auto-refund Stripe, show error
     - Duffel offer expired → refund Stripe, search for new offers

3. Update the bookings table:
   - Add columns: supplier_cost_cents, our_revenue_cents, markup_cents, 
     service_fee_cents, stripe_payment_intent_id, duffel_order_id

4. Post-booking: show success screen with:
   - PNR code (large, prominent, copyable)
   - Airline name + flight details
   - "View on airline website" link
   - Confirmation email sent indicator
```

### PROMPT 5 — Apple Liquid Glass UX: Design System (Week 4-5)

```
Time for the complete UX overhaul. We're going for Apple's Liquid Glass aesthetic 
from WWDC 2025. Think: what if Apple designed a flight booking app.

PHASE 1: Design System Foundation

1. Install fonts:
   - Use @fontsource/satoshi for display headings
   - Use @fontsource/general-sans for body text  
   - If those aren't available, use 'Inter' with optical sizing as fallback

2. Create a comprehensive design system in styles/design-system.css:

   CSS Variables for the glass theme:
   - Glass surfaces: rgba backgrounds with backdrop-filter blur(24px) saturate(1.8)
   - Three glass tiers: subtle (bg 0.4 opacity), standard (0.6), elevated (0.8)
   - Border: 1px solid rgba(255,255,255,0.15) with inner glow via box-shadow
   - Rounded corners: 16px for cards, 12px for buttons, 24px for modals
   - Shadows: layered — outer shadow + inner highlight for depth
   - Spring animations: cubic-bezier(0.34, 1.56, 0.64, 1) for bouncy feel
   - Smooth transitions: cubic-bezier(0.16, 1, 0.3, 1) for ease-out-expo
   - Color: warm neutral base, Apple blue (#0071E3) accent, 
     green for success, amber for warnings
   
   Light mode AND dark mode (respect prefers-color-scheme, 
   default to light, add toggle)

3. Create base glass components in components/ui/glass/:
   - GlassCard: translucent card with hover lift effect
   - GlassButton: primary (filled blue), secondary (glass), ghost
   - GlassInput: transparent input with glass focus ring and subtle glow
   - GlassNavbar: top navigation bar with glass blur effect, 
     shrinks/transforms on scroll
   - GlassSheet: bottom sheet for mobile (slide up, glass background)
   - GlassPill: status badges, tags (like iOS notification pills)
   - GlassDialog: modal with glass overlay and spring animation

4. Create layout components:
   - AppShell: the main layout with glass sidebar (desktop) 
     and bottom tab bar (mobile)
   - MobileTabBar: iOS-style bottom tabs with glass effect, 
     active indicator as a glass pill
   - PageTransition: wrap pages in smooth fade+slide transitions

5. Create a gradient mesh background component:
   - Subtle, animated gradient mesh that sits behind glass elements
   - Changes color subtly based on context (blue for booking, 
     green for confirmation, warm for profile)
   - Performant: use CSS only, no canvas

Make everything responsive. Mobile should feel like a native iOS app.
Test on Chrome mobile simulator at iPhone 15 Pro size (393x852).
```

### PROMPT 6 — Apple UX: Chat Interface Redesign (Week 5-6)

```
Redesign the chat booking interface with the Liquid Glass design system.
This is the core product — it needs to be jaw-dropping.

1. Chat layout (mobile-first):
   - Full viewport height, no scroll chrome
   - Glass navbar at top: "Book a Flight" title + settings icon
   - Messages area: scrollable, with momentum scroll (-webkit-overflow-scrolling: touch)
   - Input area at bottom: glass bar with rounded input, send button, 
     attach button (for future file uploads)
   - Keyboard avoidance: input bar stays above virtual keyboard on mobile

2. Message bubbles:
   - User messages: right-aligned, solid accent color (Apple blue), 
     white text, rounded (20px corners, 4px bottom-right for tail)
   - Agent messages: left-aligned, glass card style, with subtle 
     agent avatar (a small plane icon or our logo)
   - Timestamps: subtle, grouped by time period
   - Staggered entrance animation (slide up + fade, 80ms delay between messages)

3. Flight offer cards (inline in chat):
   - Glass card with airline accent color as a subtle gradient edge
   - Layout:
     ┌──────────────────────────────────┐
     │  ✈ British Airways    BA282      │
     │                                   │
     │  SFO ─────────────── LHR         │
     │  10:40 AM            6:30 AM +1  │
     │  San Francisco       London      │
     │                                   │
     │  10h 50m · Economy · 1 stop      │
     │                                   │
     │  $869                Select →    │
     └──────────────────────────────────┘
   - The route line is an animated SVG (a dotted line that draws itself)
   - Airline logo from a public API or local SVGs for major airlines
   - "Select" button is a glass pill that pulses subtly
   - Multiple offers stack vertically with staggered reveal

4. Booking confirmation card (inline in chat):
   - Full-width glass card with celebratory design:
     ┌──────────────────────────────────┐
     │         ✓ Booking Confirmed      │
     │                                   │
     │  ┌────────────────────────────┐  │
     │  │    BOARDING PASS STYLE     │  │
     │  │                            │  │
     │  │  BA282 · 15 FEB 2026      │  │
     │  │  SFO → LHR               │  │
     │  │  10:40 AM → 6:30 AM +1   │  │
     │  │  Seat 14A · Economy       │  │
     │  │                            │  │
     │  │  PNR: ABC123              │  │
     │  └────────────────────────────┘  │
     │                                   │
     │  [View Details]  [Share]         │
     └──────────────────────────────────┘
   - The checkmark has a draw-in animation
   - PNR code is in a monospace font, tappable to copy
   - Subtle confetti particles (CSS only, 10-15 particles, short duration)

5. Typing indicator:
   - Three pulsing glass dots (like iMessage)
   - Appears in a glass pill on the left side

6. Empty state (first visit):
   - Center of screen: "Where to?" in large display font
   - Subtle suggestion pills below: "SFO → London", "NYC → SFO", etc.
   - Tapping a suggestion pre-fills the input

Make the entire experience feel buttery smooth. 60fps animations.
Test scrolling performance with 50+ messages.
```

### PROMPT 7 — Apple UX: Landing Page + Onboarding Redesign (Week 6-7)

```
Redesign the landing page and onboarding with the Liquid Glass aesthetic.

LANDING PAGE:
1. Hero section:
   - Full viewport, dark gradient mesh background (deep navy → black)
   - Large display text: "Book flights in 30 seconds."
   - Subtext: "No forms. No 47 clicks. Just tell us where you want to go."
   - A glass card in the center showing a live demo animation:
     simulated chat where someone types "Book BA to London Monday" 
     and a flight card appears (auto-playing, looping)
   - CTA: Large glass button "Start Booking →"
   - Subtle floating glass particles in background

2. How it works section:
   - Three steps on glass cards with icons (not numbers)
   - Step 1: Chat bubble icon — "Tell us your trip"
   - Step 2: Plane icon — "We find the best flight"  
   - Step 3: Checkmark icon — "Confirm and you're booked"
   - Cards stagger-reveal on scroll

3. Social proof section:
   - Glass card with "100+ flights booked" (update number as you grow)
   - Airline logos in a glass pill bar
   - Testimonial cards (glass, with avatar)

4. Final CTA:
   - "Your next flight is 30 seconds away"
   - Email capture or "Get Started" button
   - Glass card floating over gradient background

ONBOARDING REDESIGN:
1. Make it feel like an iOS setup flow (like setting up a new iPhone)
2. Each step is full-screen with a large title at top
3. Input fields are large, spacious, touch-optimized
4. Glass card containers for form groups
5. Progress: thin animated line at the very top (not dots)
6. Transitions between steps: slide left/right with spring easing
7. Final step: "You're ready" with a subtle celebration animation
8. Auto-advance when possible (e.g., after selecting seat preference, 
   wait 500ms then advance)
```

### PROMPT 8 — Apple UX: My Bookings + Settings Redesign (Week 7)

```
Redesign My Bookings and Settings pages with the Liquid Glass system.

MY BOOKINGS (/dashboard/bookings):
1. Section header: "Your Trips" in large display font
2. Segmented control (glass pill style): Upcoming | Past | Cancelled
3. Each booking is a glass card:
   - Airline accent color as subtle left border or gradient
   - Flight route with animated line
   - Date + time
   - Status pill (Confirmed = green glass, Cancelled = red glass)
   - Countdown for upcoming: "In 3 days" or "Tomorrow"
   - Tap to expand with spring animation:
     - Full flight details
     - Passenger info
     - PNR (copyable)
     - Price paid
     - Cancel button (with confirmation dialog)

4. Empty state: 
   - Glass illustration of a plane
   - "No trips yet"
   - "Book your first flight →" button

SETTINGS (/dashboard/settings):
1. iOS Settings app style:
   - Profile card at top (glass, with avatar/initials, name, email)
   - Grouped glass card sections:
     - Personal Information (name, DOB, passport, KTN)
     - Loyalty Programs (list with airline logos)
     - Payment Methods (card icons + last 4)
     - Preferences (seat, meal, notifications)
     - App (theme toggle light/dark, about, sign out)
   - Each row: label left, value/chevron right
   - Tap row → slide to detail view (like iOS navigation)

2. Payment methods section:
   - Saved cards shown as mini card visualizations (glass cards with 
     brand gradient: Visa=blue, Mastercard=orange, Amex=green)
   - "Add Card" button opens glass sheet from bottom
   - Stripe Elements styled to match glass theme
   - Default card has a small star badge
```

### PROMPT 9 — Live Mode Preparation (Week 5-6)

```
Prepare the app for live Duffel bookings:

1. Create an environment mode system:
   - Read NEXT_PUBLIC_APP_MODE from env: "sandbox" | "live"
   - In sandbox: show a persistent banner at top "🧪 Sandbox Mode — No real bookings"
   - In live: no banner, real bookings
   - Duffel token selection: if live mode, use DUFFEL_LIVE_TOKEN, else DUFFEL_TEST_TOKEN

2. Pre-booking safety checks:
   - Before creating a real order, show an explicit confirmation:
     "You are about to book a REAL flight. Your card will be charged $X. 
      This is a real airline ticket. Continue?"
   - Checkbox: "I understand this is a real booking"
   - This is critical for the early days to prevent accidental bookings

3. Post-booking verification:
   - After Duffel returns a PNR, display:
     - PNR code prominently
     - Link to airline website: "Verify your booking at [airline].com"
     - Booking reference from Duffel (for our support use)
   - Save Duffel order_id in our database

4. Error recovery:
   - If Stripe charges but Duffel fails:
     → Auto-refund Stripe payment
     → Show error: "Booking failed. Your payment of $X has been refunded."
     → Log incident to a booking_incidents table for manual review
   - If Duffel succeeds but our DB save fails:
     → Still show PNR to user (most important thing)
     → Queue background job to retry DB save
     → Alert admin

5. Booking incidents table (SQL migration):
   CREATE TABLE booking_incidents (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     booking_id UUID REFERENCES bookings(id),
     user_id UUID REFERENCES users(id),
     incident_type TEXT, -- 'payment_duffel_mismatch', 'db_save_failed', etc.
     stripe_payment_intent_id TEXT,
     duffel_order_id TEXT,
     error_message TEXT,
     resolved BOOLEAN DEFAULT FALSE,
     resolved_at TIMESTAMP,
     notes TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );

6. Add a simple /dashboard/admin page (protected by admin email list):
   - Recent bookings list (all users)
   - Recent incidents
   - Revenue summary (total bookings, total revenue, avg per booking)
   - Pricing rules editor (from Prompt 3)
```

### PROMPT 10 — Failed Intents Logger + Backlog (Week 8)

```
Build a system to capture and learn from unsupported user intents:

1. Create a failed_intents table:
   CREATE TABLE failed_intents (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES users(id),
     raw_message TEXT NOT NULL,
     parsed_intent JSONB,           -- what Claude extracted
     failure_reason TEXT,            -- 'unsupported_multi_city', 'no_results', etc.
     was_resolved BOOLEAN DEFAULT FALSE,
     resolution_notes TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );

2. Update the Claude intent parser:
   - When Claude detects an intent it can't handle (multi-city, group booking, 
     award travel, etc.), classify it and log to failed_intents
   - Return a friendly message to the user:
     "I can't handle multi-city bookings yet, but I've noted your request. 
      For now, try booking each leg separately!"
   - Include the capability in the system prompt:
     "If the user requests something you cannot fulfill (multi-city, 
      group booking, hotel, car rental), classify the intent type and 
      explain what you CAN do instead."

3. Update admin dashboard:
   - Show top 10 most common failed intents (grouped by failure_reason)
   - This tells us what to build next based on real user demand
```

### PROMPT 11 — Performance + PWA (Week 9)

```
Optimize performance and make the app installable as a PWA (Progressive Web App) 
so it feels native on mobile:

1. PWA setup:
   - Create manifest.json with app name, icons (512x512, 192x192), 
     theme_color matching our design system
   - Add service worker for offline shell (app loads even without internet, 
     shows "You're offline" for data-dependent features)
   - Add "Add to Home Screen" prompt for mobile users
   - Set display: "standalone" so it opens without browser chrome

2. Performance optimization:
   - Audit with Lighthouse (target: 90+ performance score)
   - Lazy load heavy components (chat history, flight cards)
   - Image optimization: next/image for all images, WebP format
   - Font optimization: subset fonts, preload critical fonts
   - Bundle analysis: remove unused dependencies
   - API response caching: cache flight search results for 5 minutes

3. Mobile touch optimizations:
   - Minimum tap target: 44x44px (Apple HIG)
   - Haptic feedback simulation (subtle CSS animations on tap)
   - Pull-to-refresh on bookings list
   - Swipe gestures in chat (swipe right on message to reply/quote)
   - Safe area insets for notched devices

4. Target metrics:
   - LCP (Largest Contentful Paint): < 2.0s
   - FID (First Input Delay): < 100ms
   - CLS (Cumulative Layout Shift): < 0.1
   - TTI (Time to Interactive): < 3.5s
```

---

## Deployment & Environment Checklist

### Environment Variables to Add to Vercel

| Variable | Where to get it |
|---|---|
| `DUFFEL_API_TOKEN` | Duffel Dashboard → Developers → Access Tokens (test token first) |
| `DUFFEL_LIVE_TOKEN` | Same, but create a live token after KYC |
| `NEXT_PUBLIC_APP_MODE` | Set to "sandbox" initially, "live" when ready |

All existing variables (Supabase, Stripe, Anthropic) stay the same.

### Go-Live Checklist

- [ ] All 11 prompts executed and tested locally
- [ ] Duffel sandbox: 5+ test bookings successful
- [ ] Stripe test mode: payments processing correctly
- [ ] Pricing engine: markup + service fee calculating correctly
- [ ] UX: tested on iPhone Safari, Android Chrome, Desktop Chrome/Safari
- [ ] Error handling: tested Stripe failure → no Duffel booking
- [ ] Error handling: tested Duffel failure → Stripe auto-refund
- [ ] Pushed to GitHub, Vercel deployed, live URL working
- [ ] Duffel KYC completed, live token created
- [ ] Duffel Balance funded ($500+ for first bookings)
- [ ] Stripe switched to live mode
- [ ] NEXT_PUBLIC_APP_MODE switched to "live"
- [ ] Book yourself a real flight → verify PNR on airline website
- [ ] 🎉 **FIRST REAL BOOKING!**

---

## Investor Readiness Summary

After completing this phase, you'll have:

| Metric | Target |
|---|---|
| Real bookings completed | 100+ |
| Booking success rate | 70%+ |
| Average booking time | < 2 minutes |
| Revenue per booking | $15-25 |
| Monthly revenue | $1,500-2,500 |
| Airlines available | 20+ (via Duffel) |
| UX quality | Apple-level, demo-ready |
| NPS | > 70 |

**What to show investors:**
1. Live demo: book a real flight in 30 seconds
2. Metrics dashboard: bookings, revenue, success rate
3. User feedback: testimonials from real travelers
4. Technical moat: supply abstraction layer + pricing engine
5. Growth path: Duffel → NDC → airline partnerships
