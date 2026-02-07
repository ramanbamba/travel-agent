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
