# SkySwift.ai — Product Requirements Document v3.0

**Date:** February 11, 2026
**Author:** Raman (Founder & Product Lead)
**Status:** Active — Phase 3 Planning
**Target:** Y Combinator S26 Application
**Goal:** 100 real bookings with paying customers

---

## 1. Executive Summary & Vision

### The One-Line Pitch

> SkySwift is the Spotify of travel — an AI-native flight booking platform that learns how you travel and gets smarter with every booking. Instead of showing 50 results sorted by price, we show ONE perfect recommendation.

### 1.1 The Problem

Every flight booking platform — MakeMyTrip, Expedia, Google Flights — shows the same search results to every user. A consultant flying BLR→DEL for the 40th time sees the same price-sorted grid as a family planning their annual holiday. Travelport's analysis of 1B+ GDS bookings confirms: only 36% of travel executives rate their personalization efforts highly. The industry knows it's broken but hasn't fixed it.

### 1.2 Our Insight

Supply is commoditized. Every OTA has the same flights at the same prices via the same GDS/NDC pipes. The real moat is **preference intelligence** — an AI layer that transforms commoditized supply into personalized recommendations. This is exactly how Spotify won music: they didn't have different songs than Apple Music; they had better recommendations.

### 1.3 Target Market

India's domestic business travelers. 50M+ annual domestic air passengers. **ICP:** Frequent business traveler flying high-frequency routes (BLR→DEL, BLR→MUM, BLR→HYD) 2-4x/month. Values speed over price, books 9 days in advance, 4-day avg trip length. Currently endures MakeMyTrip's 47-click booking flow.

### 1.4 Y Combinator Goal

100 real bookings with actual payments. Revenue target: ₹1,000-2,000 per booking ($12-25 in service fees). Timeline: 8 weeks from Phase 3 kickoff.

---

## 2. Strategic Decisions Log

Every major product and architecture decision with rationale. Institutional memory for the founding team.

### 2.1 Market Pivot: UK → India

| Dimension | Decision | Rationale |
|-----------|----------|-----------|
| Target Market | India domestic | Larger addressable market (50M+ flyers), UPI makes payment instant (5s vs 2min card entry), domestic = simpler NLP (no passport/visa), sharper pain vs bloated MakeMyTrip |
| ICP | Business travelers, BLR→DEL corridor | 13% of global bookings per Travelport, 9-day lead time, 4-day trips, values speed > price, highest repeat frequency |
| Currency | INR | All pricing, markups, service fees in Indian Rupees |
| Scaling Story | India → SE Asia → Global | Prove preference engine in one market, expand same architecture globally for YC |

### 2.2 Technology Choices

| Component | Chosen | Rejected | Why |
|-----------|--------|----------|-----|
| Flight API | Duffel | TBO, Amadeus, Akbar Travels | Modern REST/JSON API, startup-friendly, pay-per-booking, handles ticketing authority. TBO is XML/SOAP with sales-driven onboarding. Supply abstraction layer means we add TBO later if Duffel has India coverage gaps |
| Payments | Razorpay | Stripe | Native UPI support essential for India. UPI = 5s payment vs 2min card entry. Razorpay is the Stripe of India |
| AI Layer | Google Gemini 2.0 Flash | Claude API (paid) | Free tier sufficient for MVP. Handles NLP intent parsing, preference scoring, conversational UI. Swap to Claude API if quality gaps emerge |
| Database | Supabase (free tier) | Firebase, PlanetScale | PostgreSQL with RLS, real-time subscriptions, generous free tier (500MB, 50K rows). Auth built-in |
| Frontend | Next.js on Vercel | React Native | Web-first for speed to market. PWA for mobile feel. Vercel free tier hosting |
| Dev Tool | Claude Code | Traditional dev team | Founder-led development without engineering hire. Structured prompts for each feature module |

### 2.3 Legal & Business Structure

| Decision | Detail | Status |
|----------|--------|--------|
| Entity | Indian Pvt Ltd company | Required for Razorpay merchant account |
| Ticketing | Via Duffel (they hold ticketing authority) | No ARC/IATA accreditation needed |
| Revenue Model | Hidden markup + visible service fee + optional concierge fee | Configurable via admin dashboard |
| Privacy | DPDPA (India) compliant | Required for preference data storage |

### 2.4 Architecture Philosophy

> **CORE PRINCIPLE:** Build abstraction layers everywhere. Supply layer abstracts Duffel/TBO/future providers. Payment layer abstracts Razorpay/Stripe. AI layer abstracts Gemini/Claude. The preference engine sits on top and is provider-agnostic. Every component is swappable without rewriting the product.

---

## 3. Product Architecture

### 3.1 System Architecture Overview

| Layer | Components | Purpose |
|-------|-----------|---------|
| Presentation | Next.js + Liquid Glass UI, PWA | Apple-quality conversational booking interface with glassmorphism |
| Intelligence | Gemini 2.0 Flash + Preference Engine | NLP intent parsing, preference scoring, recommendation generation |
| Business Logic | Pricing Engine + Booking Orchestrator | Markup calculation, service fees, payment→booking sequencing, error recovery |
| Supply Abstraction | Unified Flight API interface | Single interface over Duffel (primary), TBO (secondary), future NDC direct |
| Data | Supabase (PostgreSQL) | User profiles, preference vectors, booking history, orders, analytics |
| Payments | Razorpay (UPI + Cards) | Payment processing, refund automation, reconciliation |

### 3.2 Data Model (Offers & Orders Native)

**Critical decision:** Our data model aligns with IATA's Offers & Orders paradigm from day one. We don't integrate with IATA directly, but our schema mirrors the modern retailing structure = zero migration cost when the industry completes transition (2028-2030).

#### Core Tables

**`users`** — Authentication and profile
- id, email, phone, name, created_at

**`user_preferences`** — Living taste profile (THE MOAT)
- user_id, temporal_prefs (JSON), airline_prefs (JSON), comfort_prefs (JSON), price_sensitivity (JSON), context_patterns (JSON), confidence_scores (JSON)

**`offers`** — Flight search results (Offers paradigm)
- id, user_id, search_params (JSON), results (JSON), supplier, created_at, expires_at

**`orders`** — Bookings (Orders paradigm)
- id, user_id, offer_id, status, pnr, total_amount, markup, service_fee, payment_id, supplier_order_id

**`order_items`** — Line items within an order
- id, order_id, type (flight/ancillary/seat), details (JSON), amount

**`onboarding_responses`** — Initial preference questionnaire
- id, user_id, question_key, response, created_at

**`booking_feedback`** — Post-booking preference signals
- id, order_id, user_id, signal_type, signal_value

**`failed_intents`** — What users tried that we couldn't do
- id, user_id, raw_input, parsed_intent, failure_reason, created_at

**`flight_dna`** — Rich product data per flight/route
- id, airline_code, route, flight_number, aircraft_type, seat_pitch, wifi (boolean), ontime_pct, food_rating, power_outlets (boolean), updated_at

> **Why this matters for YC:** When an investor asks "what happens when IATA completes Offers & Orders?" we say: "Our data model is already native. Legacy OTAs will spend years migrating PNR/e-ticket/EMD. We're already there."

### 3.3 Booking Flow Architecture

Target: 30-second end-to-end completion.

1. **User Input:** Natural language query ("BLR to DEL next Tuesday morning")
2. **Intent Parse:** Gemini extracts origin, destination, date, time preference, seat preference
3. **Preference Load:** Fetch user_preferences from Supabase, merge with parsed intent
4. **Supply Query:** Hit Duffel API with search params → receive 15-30 flight offers
5. **Preference Score:** Each offer scored against user preference vector → top-scored = Recommended
6. **Presentation:** Show ONE recommended flight with confidence score + "see other options" link
7. **Payment:** User confirms → Razorpay charges (UPI/card) → payment confirmed
8. **Booking:** Duffel creates order → PNR generated → confirmation in chat
9. **Learning:** Update user_preferences with booking signal (confidence scores increase)
10. **Recovery:** If Duffel fails after payment → automatic Razorpay refund

---

## 4. Industry Intelligence: Modern Airline Retailing

The airline industry is undergoing its biggest tech shift since the GDS was invented in the 1960s. This context is critical for YC positioning — we reference these initiatives in pitch narrative, not as things to build now.

### 4.1 IATA Modern Airline Retailing Program

**Three pillars, each relevant to SkySwift:**

#### Pillar 1: NDC (New Distribution Capability) — How Airlines Sell

NDC replaces legacy EDIFACT text messaging with XML-based APIs enabling rich content (images, seat maps, meal descriptions, bundled ancillaries, dynamic pricing) through third-party channels.

- **Current state:** 72% of airlines recognize the need, only 27% have begun. NDC bookings ~10% of indirect channel.
- **Leading adopters:** Lufthansa Group (49 capabilities), Emirates, Singapore Airlines, BA, Finnair.
- **SkySwift leverage:** Duffel provides NDC content. Rich offer data feeds our preference engine. No legacy OTA uses this for intelligent recommendations.

#### Pillar 2: ONE Order — How Airlines Deliver

Consolidates PNRs, e-tickets, EMDs into a single order reference. In May 2025, Finnair completed the world's first "Native Order" booking.

- **Timeline:** Core capabilities by 2026, expanded by 2028, full readiness by 2030.
- **Impact:** Single order ID tracks everything purchase→delivery. Enables consumption tracking, disruption management, post-travel engagement.
- **SkySwift leverage:** Our `orders` table already mirrors ONE Order structure. Zero migration cost when airlines transition.

#### Pillar 3: One ID — How Airlines Know You

Paperless biometric-based travel using digital wallets with verifiable credentials. IATA demonstrated fully digital travel on Cathay Pacific HKG↔NRT flights, cutting processing time 40%.

- **Standards:** W3C Verifiable Credentials, ICAO Digital Travel Credentials, EU Digital Identity Wallets by 2027.
- **SkySwift leverage:** Our user profile architecture (preferences, documents, loyalty) is conceptually aligned with the wallet model.

### 4.2 ATPCO Routehappy — Flight Product Intelligence

Routehappy provides structured data about every flight's product experience: seat pitch, Wi-Fi, entertainment, power, food, visual content. From Jan 2026, all Community Participation airlines have full access.

Key stats: 80% of travelers want to see seat before booking, 66% say visuals increase likelihood of paying for better seat.

> **STRATEGIC DECISION:** We will NOT integrate Routehappy API for MVP. Instead, manually curate Flight DNA data for top 10 ICP routes using free public data (DGCA on-time reports, airline websites). Same demo impact, zero API cost. Provision for real integration in Phase 4.

### 4.3 Positioning: SkySwift vs Legacy

| Dimension | Legacy OTAs (MMT, Expedia) | SkySwift |
|-----------|---------------------------|----------|
| Distribution | Built on 1990s EDIFACT/GDS, retrofitting NDC | Born NDC-native via Duffel, no legacy |
| Data Model | PNR + e-ticket + EMD (fragmented) | Order-native single record (ONE Order aligned) |
| Personalization | Sort by price. Maybe filter by airline. | AI preference engine: learns travel DNA, recommends ONE flight |
| Rich Content | Flat text grid | Flight DNA scoring (seat, Wi-Fi, food, on-time %) |
| User Identity | Email + password | Unified taste profile evolving per booking (wallet-ready) |
| AI Integration | Chatbots for customer service | AI IS the product |

---

## 5. The Preference Engine: SkySwift's Moat

Core IP. Supply is commoditized — the preference engine transforms commodity supply into personalized intelligence.

### 5.1 Three-Layer Architecture (Spotify Model)

#### Layer 1: Collaborative Filtering (Cohort Intelligence)

"People like you book flights like this." Identifies patterns across similar users. Example: consultants flying BLR→DEL Mondays prefer 6:15 AM IndiGo, aisle seat, Thursday evening return. New McKinsey associate gets 80% accuracy first booking.

- **MVP:** Not needed for first 100 bookings. Requires scale data. Placeholder architecture only.
- **Phase 4+:** Train on route→preference patterns when bookings reach 1,000+.

#### Layer 2: Content-Based Filtering (Flight DNA)

Every flight has DNA (departure time, duration, airline reputation, on-time %, seat pitch, baggage, Wi-Fi, price-to-value). Every user has preference DNA. Engine matches flight DNA to user preference DNA.

- **MVP:** Simple weighted scoring function. Weights: time match (30%) + airline match (25%) + price range (20%) + stops (15%) + amenity match (10%).
- **Data:** Manually curated for top 10 routes from DGCA + airline websites.

#### Layer 3: Natural Language Understanding (Context Intelligence)

AI understands travel context, not keywords. "Need to be at Connaught Place by 10 AM Tuesday" → flight landing before 8:30 AM (accounting for 90-min airport-to-CBD transfer in morning traffic).

- **MVP:** Gemini 2.0 Flash with structured system prompt. Handles: natural date parsing, implicit time prefs, repeat booking shortcuts ("the usual", "Delhi again Thursday"), meeting-time-to-flight-time logic.

### 5.2 The User Taste Profile

JSON object in `user_preferences`. Each field has confidence score (0.0–1.0) increasing per booking.

| Category | What's Stored | Signal Source | Confidence Growth |
|----------|--------------|---------------|-------------------|
| Temporal | Departure windows per day-of-week, booking lead time | Booking patterns, onboarding Q1 | 0.3 → 0.6 (3 bookings) → 0.9 (10) |
| Route | Frequent routes, preferred airports, connection tolerance | Booking history | +0.5 per unique route booking |
| Airline | Preferred carriers, avoided carriers (with reasons), loyalty | Bookings, onboarding Q2, negative signals | 0.4 initial → 0.8 (5 same-airline bookings) |
| Comfort | Seat type, baggage, meal prefs, Wi-Fi importance | Onboarding Q3-Q5, booking patterns | 0.5 from onboarding, +0.1 per consistent choice |
| Price Sensitivity | Premium willingness, price anchors per route | Booking price patterns | Emerges after 3+ bookings same route |
| Context | Business vs leisure mode, seasonal patterns | Day-of-week, lead time, duration signals | Inferred automatically, 0.3 after 5 bookings |

### 5.3 Cold-Start Solution

30-second conversational onboarding creates initial preference vector.

#### The 5-Question Quick Profile

| # | Question | What It Reveals | Weight |
|---|----------|----------------|--------|
| Q1 | "When you fly, care more about earliest flight or cheapest?" | Price vs time sensitivity — most predictive dimension | High |
| Q2 | "Go-to airline or open to whoever's best?" | Brand loyalty vs value-seeking | High |
| Q3 | "How often do you fly? Weekly, monthly, occasionally?" | Frequency → confidence in recommendations | Medium |
| Q4 | "Aisle, window, or don't care?" | Comfort preference (aisle = business signal) | Medium |
| Q5 | "Usually check a bag?" | Ancillary needs, trip type indicator | Low |

#### Future Cold-Start Methods (Post-MVP)

- **Gmail/Calendar Scan:** Parse past booking confirmations. 2-3 years of behavior in one scan.
- **Loyalty Program Import:** IndiGo/AI/Vistara number → airline pref, frequency, routes.
- **Calendar Integration:** Upcoming meetings in Delhi → proactive flight suggestions.

---

## 6. Traveler Persona Research (Travelport)

Source: Travelport study, 1B+ GDS bookings globally. Validates our personalization thesis.

### 6.1 The Six Personas

| Persona | % Bookings | Lead Time | Trip Length | Key Behavior | Priority |
|---------|-----------|-----------|-------------|-------------|----------|
| **Business (ICP)** | 13% | 9 days | 4 days | Speed > price, shortest flight, mid-week, premium cabin | PRIMARY |
| Weekenders | 25% | 32 days | 3 days | Largest segment, early arrive/late depart, 67% domestic | FUTURE |
| Families | 23% | 70 days | 10 days | Entertainment > price, convenience, packages (47%), child-friendly | FUTURE |
| Solo | 18% | 49 days | 19 days | Longest trips, mobile-first, 7% YoY growth | FUTURE |
| Couples | 16% | 78 days | 14 days | Longest advance booking, 62% share data for personalization | FUTURE |
| Groups | 5% | 93 days | 6 days | Installments (72%), complex booking, online chat (43%) | FUTURE |

### 6.2 Key Findings Validating Our Strategy

- **Personalization is #1 gap:** Only 36% of execs rate efforts highly
- **Same person, different behavior:** Business vs leisure = completely different. AI must detect context, not require self-ID
- **Mobile-first mandatory:** 61% business travelers book entire trip on mobile
- **Business via OTAs growing:** 83% book some business travel through OTAs. Better UX than corporate tools.
- **One-stop-shop demand:** 73% want to book entire trip in one place
- **Chat preferred:** 43% group travelers prefer online chat, 37% solo want app chat

### 6.3 How Personas Feed the Engine

The preference engine is persona-agnostic. We infer persona from behavior:

| Signal | Inference | Action |
|--------|-----------|--------|
| Short lead time (<14d) + mid-week + short trip | Business traveler | Prioritize shortest flight, show premium, skip price-sort |
| Long lead time (>60d) + weekend + 7+ day trip | Leisure (family/couple) | Show packages, include baggage, child-friendly times |
| Repeat same route weekly | Commuter/frequent business | Enable "the usual" shortcut, pattern recommendations |
| Weekend-only, 2-3 day, domestic | Weekender | Optimize departure/arrival to maximize trip time |

---

## 7. Phase 3 Implementation Plan

> **NORTH STAR:** Ship the intelligence layer that transforms SkySwift from a booking engine into the Spotify of travel. Every feature must pass: "Does this get us closer to 100 real bookings or make the YC demo more compelling?" If no, it's cut.

### 7.1 Phase Summary

| Phase | Focus | Status |
|-------|-------|--------|
| Phase 1 | MVP: Conversational booking engine, Amadeus integration, basic UI | ✅ COMPLETED |
| Phase 2 | Production: Duffel supply layer, pricing engine, Liquid Glass UX, live mode | ✅ COMPLETED |
| Phase 2.5 | Intelligence prompts: NLP upgrades, context parsing, repeat user logic | ✅ COMPLETED |
| **Phase 3** | **Preference Engine + YC Demo: onboarding, Flight DNA, scoring, demo, 100 bookings** | 🔵 CURRENT |
| Phase 4 | Scale: Routehappy API, collaborative filtering, Gmail scan, international | 📋 PLANNED |

### 7.2 Workstreams & Timeline (8 Weeks, Free Tier Only)

---

#### Workstream 1: Preference Engine Core (Weeks 1-2)

Build user_preferences data model and scoring function.

| Prompt | Deliverable | Details |
|--------|-------------|---------|
| **P3-01** | Database schema: `user_preferences` + `onboarding_responses` + `flight_dna` tables | Supabase migration. JSON fields for each preference category with confidence scores. Row-level security. |
| **P3-02** | Preference scoring function | JS function scoring Duffel results against user preference vector. Weights: time match (30%) + airline match (25%) + price range (20%) + stops (15%) + amenity match (10%). Returns ranked results with confidence %. |
| **P3-03** | Preference update logic | After each booking, update preference fields and increment confidence scores. Track: chosen airline, departure time, seat type, price, route. |

- **Cost:** ₹0 — Supabase free tier + existing codebase
- **Validation:** Search BLR→DEL, verify recommended flight changes based on stored preferences

---

#### Workstream 2: Cold-Start Onboarding (Weeks 2-3)

Conversational 5-question onboarding → initial preference vector in 30 seconds.

| Prompt | Deliverable | Details |
|--------|-------------|---------|
| **P3-04** | Onboarding chat flow UI | Liquid Glass conversational cards. Each question as chat bubble with tap-to-select options. Progress indicator (5 steps). Feels like chatting, not form-filling. |
| **P3-05** | Preference vector generation from onboarding | Map answers to initial weights. "Earliest flight" → time_weight: 0.8, price_weight: 0.3. "Go-to airline" + "IndiGo" → airline_pref: IndiGo, confidence: 0.4. Store in user_preferences immediately. |

- **Cost:** ₹0 — UI components + Supabase writes
- **Validation:** New user completes onboarding → first search shows personalized recommendation ≠ default price sort

---

#### Workstream 3: Flight DNA & Sample Data (Weeks 3-4)

Manually curate rich product data for ICP routes. "Fake it till you make it" Routehappy.

| Prompt | Deliverable | Details |
|--------|-------------|---------|
| **P3-06** | Flight DNA seed data | Curate top 10 flights on BLR→DEL, BLR→MUM, BLR→HYD: aircraft type, seat pitch, Wi-Fi, on-time % (DGCA), food rating, power outlets. Store in `flight_dna` table. |
| **P3-07** | Flight DNA → scoring integration | Match Duffel results against flight_dna by airline+route+time. Enrich recommendation: "IndiGo 6E-302 — 95% on-time, Wi-Fi available, 30" seat pitch." Graceful fallback if no DNA data. |

- **Cost:** ₹0 — Manual data entry + Supabase
- **Data sources:** DGCA on-time reports (free, public), airline websites for seat specs

---

#### Workstream 4: Conversational Intelligence (Weeks 4-5)

Upgrade AI for contextual understanding, not just keyword extraction.

| Prompt | Deliverable | Details |
|--------|-------------|---------|
| **P3-08** | Context-aware intent parsing | Gemini system prompt upgrade: "the usual" (repeat last booking), "Delhi again Thursday" (same route, new date), "need to be in CP by 10 AM" (meeting-time-to-flight-time), "same day return" (infer return). |
| **P3-09** | Returning user intelligence | Detect returning users. Pre-load preferences. Pattern-aware greeting: "Your usual Thursday Delhi flight? IndiGo 6E-185, 5:45 PM, ₹5,120." One-tap rebooking. |

- **Cost:** ₹0 — Gemini free tier + prompt engineering
- **Validation:** User types "the usual" after 3 bookings → system correctly recommends their pattern

---

#### Workstream 5: YC Demo Polish (Weeks 5-7)

End-to-end demo flow with compelling narrative.

| Prompt | Deliverable | Details |
|--------|-------------|---------|
| **P3-10** | Demo mode with seed users | Pre-configured accounts: User A (cold start, 0 history), User B (3 bookings, emerging pattern), User C (10 bookings, strong prefs). Toggle to show preference evolution. |
| **P3-11** | Preference profile visualization | Taste profile card in settings: top airlines, preferred times, routes, confidence scores. Visual "how well AI knows you." |
| **P3-12** | Metrics dashboard (admin) | Real-time: total bookings, revenue, avg booking time, preference accuracy (% accepted recommendations), top routes, conversion funnel. |

- **Cost:** ₹0 — All UI/logic within existing stack

---

#### Workstream 6: Go-Live & First 100 Bookings (Weeks 6-8)

| Prompt | Deliverable | Details |
|--------|-------------|---------|
| **P3-13** | Live mode activation | Duffel live token, Razorpay live mode, real payment→booking. Pre-booking safety confirms. Error recovery (failed Duffel → auto-refund). |
| **P3-14** | Referral & growth loop | Share booking confirmation with referral link. "Booked in 22 seconds on SkySwift." WhatsApp share for India. First 100 users: fee waiver. |

---

### 7.3 Prompt Execution Sequence

Execute in strict order. Each prompt depends on previous.

| # | Prompt Name | Depends On | Week |
|---|-------------|-----------|------|
| P3-01 | Preference Engine Schema | Phase 2 complete | 1 |
| P3-02 | Preference Scoring Function | P3-01 | 1-2 |
| P3-03 | Preference Update Logic | P3-02 | 2 |
| P3-04 | Onboarding Chat Flow UI | P3-01 | 2-3 |
| P3-05 | Onboarding → Preference Vector | P3-04 + P3-02 | 3 |
| P3-06 | Flight DNA Seed Data | P3-01 | 3-4 |
| P3-07 | Flight DNA → Scoring Integration | P3-06 + P3-02 | 4 |
| P3-08 | Context-Aware Intent Parsing | P3-02 | 4-5 |
| P3-09 | Returning User Intelligence | P3-08 + P3-03 | 5 |
| P3-10 | Demo Mode + Seed Users | P3-01 through P3-09 | 5-6 |
| P3-11 | Preference Profile Visualization | P3-03 | 6 |
| P3-12 | Metrics Dashboard | All above | 6-7 |
| P3-13 | Live Mode Activation | P3-12 | 7 |
| P3-14 | Referral & Growth Loop | P3-13 | 7-8 |

---

## 8. YC Demo Script & Investor Metrics

### 8.1 The Three-Act Demo

**Act 1: The Cold Start (30 seconds)**
New user → 5-question onboarding → types "BLR to DEL next Tuesday" → SkySwift shows ONE recommended flight: "Based on your profile, I'd suggest IndiGo 6E-302 at 6:15 AM — non-stop, arrives 8:45 AM, ₹4,890. 95% on-time. Aisle seat available." → Confirm → UPI payment 5 seconds → PNR in chat. Total: 30 seconds. MakeMyTrip: 47 clicks, 4 minutes.

**Act 2: The Returning User (15 seconds)**
5th booking → types "Delhi again Thursday" → "Your usual Thursday flight? IndiGo 6E-185, 5:45 PM, ₹5,120. Aisle 14C like last time. Fares ₹400 cheaper Wednesday — want me to check?" → Demonstrates memory, pattern recognition, proactive value.

**Act 3: The Intelligence Moment (Wow factor)**
Types "Need to be at Connaught Place by 10 AM Tuesday, coming back same day" → SkySwift calculates: flight time + airport transfer + morning Delhi traffic = 5:30 AM departure. Recommends specific flight + 9 PM return. No booking platform understands meeting-time-to-flight-time logic.

> **YC Partner Takeaway:** "This isn't a booking engine. This is an AI that understands how I travel."

### 8.2 The Timing Narrative (Pitch Deck Slide)

> "The airline industry is in its biggest tech shift since the GDS (1960s). IATA's Modern Airline Retailing replaces legacy systems with Offers & Orders — 72% of airlines recognize the need, only 27% have started. Every incumbent OTA retrofits decades of legacy. SkySwift is the first AI-native platform built on this new infrastructure. We don't adapt to NDC — we're born in it. As airlines complete this by 2028-2030, every platform needs rebuilding. We're already there."

### 8.3 Investor Readiness Metrics

| Metric | Target | How Measured |
|--------|--------|-------------|
| Real bookings | 100+ | orders WHERE status = confirmed |
| Booking success rate | > 70% | Confirmed / total attempts |
| Avg booking time | < 60 seconds | search → confirmation timestamp |
| Revenue per booking | ₹1,000-2,000 ($12-25) | markup + service fee per order |
| Preference accuracy | > 60% | % accepting top recommendation |
| Returning user rate | > 30% | Users with 2+ bookings / total |
| NPS | > 70 | Post-booking survey |

---

## 9. Risk Register & Mitigations

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Duffel limited India domestic coverage | HIGH | MEDIUM | Supply abstraction layer from Phase 2. Add TBO as secondary. Manual coverage testing pre-launch. |
| Gemini free tier rate limits during demo | HIGH | LOW | Cache common intents. Pre-compute demo recommendations. Fallback: paid tier ($0 at low volume). |
| Razorpay merchant onboarding delays | HIGH | MEDIUM | Start KYC immediately. Requires Indian Pvt Ltd. Timeline: 2-4 weeks. |
| Users don't complete onboarding | MEDIUM | MEDIUM | Max 5 questions. Allow skip with defaults. Conversational UI feels effortless. |
| Preference accuracy too low | MEDIUM | LOW | Start simple — even "remember last airline + time" beats any OTA. Improves per booking. |
| Supabase free tier limits | LOW | LOW | 500MB/50K rows far exceeds 100 bookings (100 users × 100 bookings ≈ 10K rows). |
| Legal: no travel agency license | MEDIUM | LOW | Duffel holds ticketing authority. SkySwift = tech platform. Legal opinion before scale. |

---

## 10. Appendix

### 10.1 Technology Stack & Costs

| Layer | Technology | Tier | Monthly Cost |
|-------|-----------|------|-------------|
| Frontend | Next.js 14 + React | Open source | ₹0 |
| Hosting | Vercel | Free (hobby) | ₹0 |
| Database | Supabase | Free (500MB, 50K rows) | ₹0 |
| AI/NLP | Gemini 2.0 Flash | Free tier | ₹0 |
| Flight API | Duffel | Pay per booking (~$2-3) | ~₹250/booking |
| Payments | Razorpay | 2% per transaction | Variable |
| Design | Liquid Glass (CSS/Tailwind) | N/A | ₹0 |
| Dev Tool | Claude Code | Claude Pro | ₹1,700/mo |
| Domain | skyswift.ai | Annual | ~₹1,200/yr |

**Total for 100 bookings:** ~₹28,000 ($340) variable costs → generating ₹1,00,000-2,00,000 ($1,200-2,400) revenue. Net positive from booking #3.

### 10.2 Phase Roadmap

| Phase | Timeline | Key Deliverable | Status |
|-------|----------|----------------|--------|
| Phase 1: MVP | Weeks 1-6 | Conversational booking engine | ✅ DONE |
| Phase 2: Production | Weeks 7-18 | Duffel + pricing + Liquid Glass + live mode | ✅ DONE |
| Phase 2.5: Intelligence | Weeks 18-20 | NLP upgrades, context parsing | ✅ DONE |
| **Phase 3: Preference + YC** | **Weeks 20-28** | **Onboarding, Flight DNA, scoring, demo, 100 bookings** | 🔵 CURRENT |
| Phase 4: Scale | Post-YC | Routehappy API, collaborative filtering, international | 📋 PLANNED |

---

*SkySwift.ai — Confidential | PRD v3.0 | February 11, 2026*
