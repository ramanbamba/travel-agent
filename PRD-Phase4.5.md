# SkySwift Phase 4.5 — The Refinement Phase

## Polish, Wow Factor, and Production Readiness

**Version:** 4.5 | **Date:** February 21, 2026 | **Status:** 🔵 CURRENT

---

## 0. Phase 4.5 North Star

> **Make everything we've built feel inevitable — like it couldn't have been designed any other way. Fix what's broken, polish what's rough, and add the moments that make people say "wow."**

This phase has THREE mandates:

1. **Fix the AI brain** — the chat losing context mid-conversation is a deal-breaker. An AI agent that forgets what you just said isn't an agent, it's a form with extra steps.
2. **Redesign the front door** — the landing page is the first thing investors, cofounders, and pilot customers see. It needs to feel premium, modern, and alive. Not "startup MVP" — more "this company has taste."
3. **Clean the house** — dead code from Phase 1-3, inconsistent patterns, missing error states, half-baked flows. Get every module to production-grade before we put real customers on it.

### What's IN scope

| Area | Work |
|------|------|
| **Conversational AI** | Fix context loss, improve multi-turn memory, better error recovery, faster response times |
| **Landing Page** | Full redesign — sarvam.ai-level design quality, Navan/SkyLink-level content, dynamic components |
| **Codebase Health** | Dead code removal, pattern unification, TypeScript strictness, component library cleanup |
| **Dashboard Polish** | Visual tightening, loading states, empty states, micro-interactions, responsive fixes |
| **WhatsApp Flow** | Refinement of message formatting, edge case handling, session reliability |
| **Web Booking Chat** | Fix bugginess, sync behavior with WhatsApp flow, better fallback handling |
| **Slack/Teams Demo** | Lightweight demo-ready prototype showing cross-platform booking |
| **Demo Paths** | Polish the demo simulator, pre-seeded scenarios, one-click demo setup |

### What's OUT of scope

- Hotels, rail, ground transport (post-first-customers)
- Tally direct API integration (CSV export is sufficient for now)
- Mobile app (WhatsApp IS the mobile app)
- New database schema changes (Phase 4 schema is final)
- New pricing tiers or billing (free pilot mode is all we need)

---

## 1. The AI Context Problem — Diagnosis & Fix

### 1.1 The Problem

The conversational AI loses context mid-conversation. Specifically:

- User says "Book BLR to DEL Monday morning" → AI responds with options
- User says "The second one" → AI doesn't remember what "the second one" refers to
- User says "Actually make it Tuesday instead" → AI starts a fresh search instead of modifying the existing one

This happens because the current implementation treats each message as an independent request rather than maintaining a conversation state machine.

### 1.2 Root Causes (Claude Code should audit for these)

1. **No conversation history in the Gemini prompt** — each message goes to Gemini with only the system prompt and the new user message. Previous messages aren't included.
2. **Session context not threaded through** — the `whatsapp_sessions.context` JSON field exists but isn't being read back and injected into subsequent AI calls.
3. **No structured state machine** — the session `state` field ('idle', 'searching', 'selecting', etc.) exists but transitions aren't enforced. The AI re-parses intent from scratch even when the user is in the middle of a selection flow.
4. **Flight results not cached in session** — when the AI shows 3 options, those options aren't stored anywhere the next message handler can find them. So "the second one" or "option 2" has no referent.

### 1.3 The Fix (Architecture)

```
CONVERSATION MEMORY ARCHITECTURE:

whatsapp_sessions.context = {
  // Rolling conversation history (last 10 messages)
  "messages": [
    {"role": "user", "content": "Book BLR to DEL Monday morning", "ts": "..."},
    {"role": "assistant", "content": "Found 3 options...", "ts": "..."},
    {"role": "user", "content": "The second one", "ts": "..."}
  ],

  // Current state machine position
  "state": "selecting",  // idle → searching → selecting → confirming → booked

  // Active search results (cached for reference)
  "active_search": {
    "query": {"origin": "BLR", "dest": "DEL", "date": "2026-02-23", "time": "morning"},
    "results": [
      {"id": "offer_1", "airline": "IndiGo", "price": 4850, "dep": "06:15", ...},
      {"id": "offer_2", "airline": "Air India", "price": 5200, "dep": "08:30", ...},
      {"id": "offer_3", "airline": "Vistara", "price": 5680, "dep": "07:00", ...}
    ]
  },

  // Selected option (when in confirming state)
  "selected_offer": null,

  // Member context (loaded once, refreshed on session start)
  "member": {"name": "Priya", "role": "employee", "seniority": "ic", ...},
  "policy_summary": "Economy domestic, auto-approve under ₹8000"
}
```

**The key insight:** Gemini should receive the FULL conversation context — not just the latest message. And the state machine should handle "the second one" deterministically (no AI needed — just look up `active_search.results[1]`), reserving Gemini for genuinely ambiguous inputs.

---

## 2. Landing Page Redesign — Design & Content Spec

### 2.1 Design Philosophy

**Reference:** sarvam.ai for feel, SkyLink for content structure, Navan for trust-building.

The current landing page is functional but doesn't create a visceral first impression. The redesign targets three emotional reactions:

1. **First 3 seconds:** "This looks premium" (dark gradient hero, crisp typography, animated elements)
2. **First 30 seconds:** "I understand what this does" (clear headline, visual demo, problem-solution)
3. **First 3 minutes:** "I want to try this" (interactive demo, social proof, clear pricing, easy CTA)

### 2.2 Design System Updates

```
VISUAL LANGUAGE:

Hero: Dark gradient background (navy #0A0F1E → deep blue #0F172A → subtle purple tint)
      with animated gradient mesh or grain texture overlay.
      White and cyan text for maximum contrast.
      Inspired by sarvam.ai's hero section.

Sections: Alternate between dark (navy/charcoal) and light (white/off-white #FAFBFC).
          This creates visual rhythm and keeps attention as user scrolls.
          Sarvam does this masterfully — dark hero → light features → dark CTA.

Typography:
  - Headlines: Inter or Plus Jakarta Sans. Bold. Large (48-72px hero, 36-48px sections).
  - Body: Inter. Regular/Medium. 16-18px with generous leading (1.6-1.8).
  - Accents: Monospace for numbers/metrics (JetBrains Mono or SF Mono).

Colors:
  Primary: #2563EB (blue) — for CTAs, links, accents
  Accent: #06B6D4 (cyan) — for highlights, gradients, glows
  Dark BG: #0A0F1E to #0F172A gradient
  Light BG: #FFFFFF to #FAFBFC
  Text on dark: #F8FAFC (near-white), #94A3B8 (muted)
  Text on light: #0F172A (near-black), #64748B (muted)
  Success: #10B981 (green) — for checkmarks, policy compliance
  Warning: #F59E0B (amber)

Spacing: Generous. 120-160px between major sections. 80-100px internal padding.
         Let the content breathe. White space IS the design.

Animations (framer-motion):
  - Hero: Gradient mesh animation (subtle, continuous), text reveal on load
  - Scroll: Sections fade-in + slight upward translate on scroll-into-view
  - Numbers: Count-up animation when metrics scroll into view
  - WhatsApp demo: Auto-typing message bubbles (like a real conversation)
  - Logo ticker: Smooth infinite horizontal scroll (like sarvam.ai partner logos)
  - Hover: Cards lift slightly with soft shadow on hover
  - Transitions: 0.4-0.6s duration, ease-out curves. Never jarring.

Interactive Elements:
  - WhatsApp chat simulator embedded in the page (auto-plays a booking demo)
  - Feature tabs (For Companies / For Employees) with animated panel switching
  - Pricing toggle or comparison
  - FAQ accordion with smooth expand/collapse

Mobile:
  - Hero text scales down gracefully (48px → 32px)
  - Feature grid goes 1-column
  - WhatsApp demo remains interactive (this is the hero moment on mobile)
  - Bottom sticky CTA bar on mobile: "Start Free Pilot"
```

### 2.3 Page Structure & Content

```
SECTION-BY-SECTION SPEC:
(Each section described with: layout, content, design notes, animations)

─────────────────────────────────────────────────────────
NAVBAR (sticky, transparent on hero, white/blurred on scroll)
─────────────────────────────────────────────────────────
- Logo: "SkySwift" wordmark (white on hero, dark on scroll)
- Links: How It Works · Platform · Pricing
- CTA: "Start Free Pilot" (blue button, always visible)
- On scroll: backdrop-blur glass effect, subtle border-bottom
- Mobile: hamburger menu, CTA remains visible

─────────────────────────────────────────────────────────
HERO (dark gradient, full viewport height)
─────────────────────────────────────────────────────────
Layout: Two-column on desktop. Left: text. Right: animated WhatsApp mockup.
         Single column on mobile: text above, WhatsApp below.

Background: Dark gradient (#0A0F1E → #0F172A) with:
  - Subtle animated gradient mesh (CSS or canvas, very subtle movement)
  - Fine grain/noise texture overlay (3-5% opacity)
  - Optional: faint grid pattern or dot matrix (like sarvam.ai's motif)

Left column:
  Eyebrow: "AI-NATIVE CORPORATE TRAVEL FOR INDIA" (cyan, uppercase, tracked, small)

  Headline: "Your AI travel desk.
             30 seconds. WhatsApp."
  (White, bold, 56-64px. Each line on its own line for impact.
   Animated: words fade/slide in sequentially on page load, 0.1s stagger)

  Subheadline: "SkySwift replaces your travel desk with an AI agent that
  books flights in 30 seconds, enforces policy automatically, and recovers
  your GST credits. Used by teams across India."
  (Muted white #94A3B8, 18px, max-width 540px)

  CTAs:
    Primary: "Start Free Pilot →" (blue bg, white text, rounded-lg, px-8 py-4)
    Secondary: "See How It Works" (transparent border, white text, same size)
    (Both have subtle hover glow effect)

  Trust line below CTAs:
    "Built by ex-Booking.com & Amadeus" + small security lock icon + "India data residency"
    (Muted text, 14px)

Right column:
  ANIMATED WHATSAPP MOCKUP — this is the hero moment.

  A phone frame (iPhone-style, dark bezel) containing a WhatsApp-like chat
  that auto-plays a booking conversation:

  1. (pause 1s) User bubble appears: "Book me a flight to Delhi Monday morning"
  2. (pause 0.5s) Typing indicator (three dots)
  3. (pause 1.5s) Bot bubble appears with search results (3 options, formatted)
  4. (pause 1s) User bubble: "1"
  5. (pause 0.5s) Typing indicator
  6. (pause 1s) Bot bubble: Booking confirmation with ✅ PNR, GST captured
  7. (pause 2s) Loop back to start

  Messages should appear with WhatsApp-authentic styling:
  - Green bubbles for user, white for bot
  - Timestamps, read receipts (blue ticks)
  - The phone frame should have a slight 3D tilt (perspective transform)
  - Subtle shadow beneath the phone

  On mobile: the phone mockup goes full-width below the text, no tilt.

─────────────────────────────────────────────────────────
LOGO TICKER (light section, slim)
─────────────────────────────────────────────────────────
"Trusted by teams at" + infinite horizontal scroll of company logos.

For now: use placeholder logos or text like:
"Join 10+ companies already using SkySwift" with logos of pilot companies.
If no logos yet, skip this section OR use a styled text strip:
"From startups to enterprises — built for Indian teams."

Animation: smooth CSS marquee, infinite loop, pausable on hover.
Same pattern as sarvam.ai's partner logo strip.

─────────────────────────────────────────────────────────
PROBLEM STATEMENT (dark section)
─────────────────────────────────────────────────────────
Background: Dark charcoal #111827

Headline: "Corporate travel in India is stuck in 2005."
(White, bold, 40px, center-aligned)

Three problem cards in a row (dark cards with subtle border):

Card 1:
  Icon: 📱 (or custom SVG — a WhatsApp screenshot icon)
  Metric: "60%" (cyan, 48px, monospace, count-up animation)
  Label: "of Indian corporate travel is managed via WhatsApp screenshots
          to an admin — no policy, no visibility, no GST compliance."

Card 2:
  Icon: ₹ (or money icon)
  Metric: "₹12-18L" (cyan, count-up)
  Label: "lost annually by mid-size companies in unclaimed GST input tax
          credits on business travel. Invoices buried in email, never filed."

Card 3:
  Icon: ⏱ (clock)
  Metric: "10+ min" (cyan, count-up)
  Label: "per booking on traditional corporate tools. Employees default to
          personal OTAs — 44% book outside authorized channels."

Cards fade-in + slide-up on scroll.

─────────────────────────────────────────────────────────
HOW IT WORKS (light section)
─────────────────────────────────────────────────────────
Background: White

Headline: "3 messages. 30 seconds. Done."
(Dark, bold, 40px, center)

Subheadline: "No apps to install. No forms to fill. Your team books flights
on the tool they already use — WhatsApp."
(Muted, 18px, center)

Three-step horizontal flow (connected by a subtle line/arrow):

Step 1:
  Visual: WhatsApp message bubble mockup — "Book BLR to DEL Monday morning"
  Label: "Message your AI travel agent"
  Detail: "Just tell it where you need to go, like you'd message a colleague."

Step 2:
  Visual: AI response with 3 flight options (policy-compliant badges ✅)
  Label: "AI finds the best flights within policy"
  Detail: "Company policy applied automatically. Preferences learned from history."

Step 3:
  Visual: Confirmation message with PNR + GST captured badge
  Label: "Confirm and you're booked"
  Detail: "E-ticket sent. GST invoice captured. Manager notified. All automatic."

Steps should animate in sequence as user scrolls — left-to-right reveal.
On mobile: stack vertically with connecting line on the left.

─────────────────────────────────────────────────────────
DUAL VALUE — TABS (light section, continues)
─────────────────────────────────────────────────────────
Layout: Two large tabs at top, content panel below.
Animation: Smooth crossfade when switching tabs.

Tab 1: "For Travel Managers & Finance"
Tab 2: "For Employees"

TAB 1 CONTENT — MANAGERS:
Left: Text content
  Headline: "Complete control. Zero manual work."
  Features (as icon + title + one-line description, vertically stacked):

  🛡️ Policy on Autopilot
     "Set rules once. Cabin class, spend limits, preferred airlines — the AI
      enforces everything before the booking happens, not after."

  📊 Real-Time Spend Visibility
     "See every rupee your team spends on travel. By department, by employee,
      by route. No more quarterly surprises."

  🧾 GST Compliance, Automated
     "Every booking captures GST invoices with your GSTIN. One-click export to
      Tally. Recover 12-18% in input tax credits automatically."

  ✅ Approval Workflows on WhatsApp
     "Out-of-policy bookings route to managers for approval — on WhatsApp, not
      buried in email. Approve with one tap."

Right: Dashboard screenshot/mockup
  (Show the admin dashboard overview page — KPI cards, activity feed, charts.
   Apply a subtle perspective tilt and shadow for depth.)

TAB 2 CONTENT — EMPLOYEES:
Left: Text content
  Headline: "The fastest way to book a work trip."
  Features:

  💬 Book on WhatsApp
     "No app to install. No portal to remember. Message SkySwift on WhatsApp
      and get booked in 30 seconds."

  🧠 Learns Your Preferences
     "Prefers IndiGo? Always want an aisle seat? Morning flights? SkySwift
      remembers, so you never have to repeat yourself."

  ⚡ One-Tap Changes
     "'Change my Delhi flight to Thursday' — that's it. No hold music,
      no rebooking forms."

  📱 Works Everywhere
     "WhatsApp, Slack, Microsoft Teams, or web. Book from wherever you work."

Right: WhatsApp conversation mockup (different from hero — show preference
  learning: "I see you usually fly IndiGo. Here's the best IndiGo option...")

─────────────────────────────────────────────────────────
PLATFORM FEATURES (dark section)
─────────────────────────────────────────────────────────
Background: Dark navy #0F172A

Headline: "One platform. Everything your travel program needs."
(White, 40px)

Feature grid: 2 columns × 3 rows (6 features)
Each feature card: Dark card with subtle border, icon, title, 2-line desc.
Cards have a soft glow effect on hover.

1. 🤖 AI Booking Agent
   "Natural language booking via WhatsApp, Slack, or web. Handles 80%+ of
    corporate trips end-to-end without human intervention."

2. 🛡️ Policy Engine
   "Rules-based enforcement with AI interpretation. Hard blocks, soft warnings,
    exception requests — all configurable by your travel manager."

3. 🧾 GST Compliance
   "Automatic invoice capture, GSTIN validation, ITC tracking, and Tally-ready
    exports. The feature Indian CFOs didn't know they needed."

4. 📊 Spend Analytics
   "Real-time dashboards, department breakdowns, route analysis, advance booking
    insights. From zero visibility to complete picture."

5. 🧠 Preference Learning
   "Gets smarter with every booking. Airline preferences, time-of-day patterns,
    seat choices — applied automatically without asking."

6. 🔗 Works Where You Work
   "WhatsApp for the field. Slack for the office. Teams for the enterprise.
    Web for everything else. One agent, every channel."

─────────────────────────────────────────────────────────
INTERACTIVE DEMO (light section) — OPTIONAL BUT HIGH-IMPACT
─────────────────────────────────────────────────────────
Headline: "Try it yourself"
Subheadline: "Type a booking request and watch the AI respond in real-time."

Embed a simplified version of the WhatsApp simulator directly on the page.
- Pre-populated with demo org context
- User can type a message (or click suggested prompts)
- AI responds with flight options (mock data)
- Limited to 3-4 turns to prevent abuse

Suggested prompt buttons:
  "Book BLR to DEL Monday" · "Show cheapest Mumbai flights" · "Can I fly business class?"

This is a HIGH EFFORT feature. Include it only if time permits. The auto-playing
hero animation is sufficient for MVP. Mark this as P4.5-STRETCH.

─────────────────────────────────────────────────────────
PRICING (light section)
─────────────────────────────────────────────────────────
Headline: "Start free. Scale when ready."
Subheadline: "No credit card required. No contracts. Cancel anytime."

Three pricing cards in a row. Middle card (Growth) highlighted.

FREE:
  Price: "₹0"
  Subtitle: "For startups getting started"
  Features: Up to 20 bookings/mo · WhatsApp AI agent · Basic policy rules ·
            GST invoice capture · Email support
  CTA: "Start Free" (outline button)

GROWTH (highlighted, blue border/glow):
  Price: "₹25,000/mo"
  Subtitle: "For growing teams"
  Badge: "MOST POPULAR"
  Features: Unlimited bookings · Advanced policy engine · Spend analytics
            dashboard · Tally/Zoho export · Approval workflows · Slack & Teams ·
            Priority support
  CTA: "Start Free Pilot" (filled blue button)

ENTERPRISE:
  Price: "Custom"
  Subtitle: "For large organizations"
  Features: Everything in Growth · Multi-entity support · SSO/SAML · API access ·
            Dedicated account manager · Custom integrations · SLA guarantee
  CTA: "Contact Sales" (outline button)

Below pricing: "SkySwift pays for itself — companies recover ₹6-15 lakhs/year
in GST credits alone."

─────────────────────────────────────────────────────────
FOUNDER / TRUST SECTION (dark section)
─────────────────────────────────────────────────────────
Background: Dark

Layout: Centered text block.

"Built by people who know travel from the inside."

Brief founder credential block:
  - "10+ years at Booking.com and Amadeus"
  - "Deep expertise in airline distribution, NDC, and travel technology"
  - "Building the travel infrastructure India deserves"

Optional: small headshot + name + brief bio.

Security badges row: "SOC 2 compliant" · "India data residency" ·
"Encrypted at rest & in transit" · "DPDP Act ready"
(Use shield/lock icons, muted treatment)

─────────────────────────────────────────────────────────
FAQ (light section, accordion)
─────────────────────────────────────────────────────────
Clean accordion, smooth expand/collapse animation.

Questions:
1. How does WhatsApp booking work?
2. What airlines do you support?
3. How does the policy engine work?
4. How is GST compliance handled?
5. What happens if someone books out of policy?
6. Can I use Slack or Microsoft Teams instead of WhatsApp?
7. Is my data secure?
8. What does the free plan include?

─────────────────────────────────────────────────────────
FOOTER CTA (dark section, gradient)
─────────────────────────────────────────────────────────
Background: Dark gradient with subtle animated gradient mesh (echoes hero)

Headline: "Ready to fix corporate travel?"
(White, bold, 48px, center)

Subheadline: "Start your free pilot today. 20 bookings on us."
(Muted, 18px, center)

CTA button: "Start Free Pilot →" (large, blue, centered, with glow)

─────────────────────────────────────────────────────────
FOOTER (standard)
─────────────────────────────────────────────────────────
Dark background. Minimal.
Logo · Product links · Company links · Legal links · Social icons
"© 2026 SkySwift Technologies Pvt. Ltd."
```

---

## 3. Slack & Teams Demo Prototype

### 3.1 Scope

This is NOT a production integration. It's a demo-ready prototype that proves cross-platform capability in pitches. The goal: show a Slack conversation and a Teams conversation doing the same thing as WhatsApp — booking a flight in 30 seconds.

### 3.2 Implementation Approach

Build a unified demo page at `/demo/channels` that shows three side-by-side panels:
- WhatsApp conversation (existing simulator, restyled)
- Slack conversation (Slack-themed UI)
- Microsoft Teams conversation (Teams-themed UI)

All three show the SAME booking flow happening simultaneously (or sequentially with a tab switcher). All powered by the same AI backend. The visual difference is the message styling — WhatsApp green bubbles, Slack's flat design with thread UI, Teams' blue-purple theme.

This is a visual demo, not a real Slack/Teams integration. No Slack API, no Teams bot. Just themed chat UIs hitting our existing API.

---

## 4. Implementation Plan — Prompts

### 4.1 Phase Summary

| Phase | Focus | Status |
|-------|-------|--------|
| Phase 1 | MVP: Conversational booking engine | ✅ COMPLETED |
| Phase 2 | Production: Duffel, pricing, Liquid Glass, live mode | ✅ COMPLETED |
| Phase 2.5 | Intelligence: NLP, context parsing | ✅ COMPLETED |
| Phase 3 | Preference Engine: onboarding, Flight DNA, scoring | ✅ COMPLETED |
| Phase 4 | Corporate Pivot: B2B, WhatsApp, policy, GST, admin | ✅ COMPLETED |
| **Phase 4.5** | **Refinement: AI fix, landing page redesign, polish, demo** | 🔵 CURRENT |

### 4.2 Workstreams & Prompts

---

#### Workstream 1: Codebase Health (Week 1)

---

**P4.5-01 — Code Audit, Cleanup & Pattern Unification**

```
Context: Read PRD-Phase4.5.md. This is the refinement phase.

We need to clean the codebase before adding polish. The app has been built
across 4 phases and has accumulated:
- Dead code from Phase 1-3 that's no longer used after the B2B pivot
- Inconsistent patterns (some pages use server components, some don't;
  some API routes use middleware, some validate inline)
- Missing TypeScript strictness
- Components that could be shared but are duplicated
- Console.logs left in production code

TASK: Comprehensive code audit and cleanup.

1. DEAD CODE REMOVAL:
   - Identify and remove any pages, components, API routes, and utilities
     from Phase 1-3 that are no longer referenced after the Phase 4 pivot.
   - Check for unused npm packages in package.json. Remove any that aren't
     imported anywhere.
   - Remove any commented-out code blocks longer than 5 lines.
   - Remove all console.log statements (replace critical ones with a proper
     logger if needed).
   - DO NOT remove the Duffel integration, Razorpay integration, Gemini
     integration, or preference scoring — these are still active.

2. PATTERN UNIFICATION:
   - Audit all API routes. Ensure every route:
     * Validates auth (checks Supabase session)
     * Validates org_id from session (never trusts client-sent org_id)
     * Returns consistent error format: { error: string, code: string }
     * Uses try/catch with proper error handling
   - Create a shared API utility if one doesn't exist:
     /lib/api/response.ts — success(), error(), unauthorized(), notFound()
   - Audit all pages. Ensure:
     * Server components used where possible
     * Client components only where interactivity is needed ("use client")
     * Loading states via loading.tsx for every route segment
     * Error boundaries via error.tsx for every route segment

3. TYPESCRIPT STRICTNESS:
   - Enable strict mode in tsconfig.json if not already
   - Fix any resulting type errors
   - Replace all `any` types with proper types
   - Ensure all Supabase queries use generated types

4. COMPONENT AUDIT:
   - List all components in /components/
   - Identify duplicates or near-duplicates
   - Merge into shared components where appropriate
   - Ensure every component has:
     * Proper TypeScript props interface
     * Sensible defaults
     * Loading state (where applicable)
     * Empty state (where applicable)

5. ENV VARIABLE AUDIT:
   - Check .env.example includes ALL variables needed
   - Ensure no secrets are in client-side code (NEXT_PUBLIC_ prefix)
   - Verify all API keys are loaded from env, not hardcoded

6. DEPENDENCY AUDIT:
   - Run `npm audit` and fix any high/critical vulnerabilities
   - Update any outdated dependencies that don't require major refactors
   - Ensure package-lock.json is committed and clean

After cleanup, run full build: `npm run build` must succeed with 0 errors.
Run lint: `npm run lint` must pass. TypeScript: 0 type errors.

Generate a cleanup report: what was removed, what was refactored, any issues found.
```

---

#### Workstream 2: Fix the AI Brain (Week 1-2)

---

**P4.5-02 — Conversational Context & Memory System**

```
Context: Read PRD-Phase4.5.md section 1 (The AI Context Problem) completely.

The core issue: the chat AI loses context mid-conversation. This is the
#1 bug that breaks the demo and destroys user trust.

TASK: Implement a proper conversation memory and state machine.

1. CONVERSATION MEMORY:
   Refactor the WhatsApp message handler AND the web chat handler to
   maintain a rolling conversation history.

   For WhatsApp (whatsapp_sessions table):
   - On every incoming message: append to context.messages array
   - On every outgoing response: append to context.messages array
   - Cap at last 20 messages (10 turns). Drop oldest when exceeded.
   - When calling Gemini, include the FULL message history as the
     conversation, not just the latest message.

   For Web Chat:
   - If using an in-memory store or React state, ensure the same pattern:
     all messages in the conversation are sent to Gemini on each turn.
   - If the web chat has a separate backend state (e.g., a session table),
     update it the same way as WhatsApp sessions.

   CRITICAL: The Gemini API call should look like this:

   ```js
   const response = await model.generateContent({
     contents: [
       // System instruction embedded in first message or via systemInstruction
       ...sessionMessages.map(m => ({
         role: m.role === 'assistant' ? 'model' : 'user',
         parts: [{ text: m.content }]
       })),
       { role: 'user', parts: [{ text: currentMessage }] }
     ]
   });
   ```

   NOT like this (current broken pattern):
   ```js
   // ❌ WRONG — no conversation history
   const response = await model.generateContent(currentMessage);
   ```

2. STATE MACHINE ENFORCEMENT:
   Refactor the message handler to use an explicit state machine:

   STATE: idle
     → User sends booking intent → parse with Gemini → search flights
     → Store results in context.active_search → transition to: selecting
     → User sends anything non-booking → parse normally (policy Q, help, etc.)

   STATE: selecting
     → User sends "1", "2", "3", "the first one", "IndiGo one"
       → DETERMINISTIC lookup in context.active_search.results (no Gemini needed)
       → Store selected offer in context.selected_offer
       → transition to: confirming
     → User sends "actually make it Tuesday" or other modification
       → Gemini re-parses with conversation history → new search with modified params
       → transition back to: selecting (with new results)
     → User sends "cancel" or "start over"
       → Clear context.active_search → transition to: idle
     → User sends completely unrelated message
       → Respond helpfully but remind them: "You have a pending flight selection.
         Reply 1-3 to pick one, or say 'start over' to search again."

   STATE: confirming
     → User sends "yes", "confirm", "book it"
       → Execute booking flow → transition to: booked → then: idle
     → User sends "no", "cancel", "go back"
       → transition to: selecting (re-show options)
     → User sends modification ("different time", "add a return")
       → Gemini re-parses → new search → transition to: selecting

   STATE: awaiting_approval
     → User asks "any update?" → Check approval_requests status → respond
     → User sends new booking request → Handle normally (can have multiple)

3. DETERMINISTIC SELECTION PARSER:
   Create /lib/ai/selection-parser.ts:
   This handles "the second one", "option 2", "2", "Air India one", "the
   cheapest", "the earliest" WITHOUT calling Gemini. Pure JavaScript.

   function parseSelection(input: string, results: FlightResult[]): FlightResult | null {
     // Direct number: "1", "2", "3"
     // Ordinal: "first", "second", "third", "the first one"
     // Airline name: "IndiGo", "the IndiGo one", "6E"
     // Superlative: "cheapest", "earliest", "latest", "fastest"
     // Returns the matched result or null (if ambiguous, fall back to Gemini)
   }

4. CONTEXT INJECTION FOR GEMINI:
   When calling Gemini for intent parsing, always include in the system prompt:

   - Member context (name, role, org, seniority)
   - Policy summary (one-liner: "Economy domestic, auto-approve under ₹8000")
   - Active state (if in 'selecting': "User is currently choosing from 3 flight
     options for BLR→DEL on Monday. Don't re-search unless they ask.")
   - Preferences summary ("Prefers IndiGo, morning flights, aisle seat")

   This prevents Gemini from starting fresh on every message and lets it
   understand references like "my usual airline" or "same time as last week."

5. SESSION TIMEOUT:
   - If context.last_message_at is > 30 minutes ago, reset session to idle
   - Clear active_search and selected_offer
   - On next message, treat as fresh conversation but KEEP preferences

6. TESTING:
   Test these specific multi-turn conversations end-to-end:

   Test A — Basic selection:
   "Book BLR to DEL Monday" → [shows 3 options] → "2" → [confirms] → "Yes" → [booked]

   Test B — Reference:
   "Book BLR to DEL Monday" → [shows 3 options] → "The IndiGo one" → [correct one selected]

   Test C — Modification:
   "Book BLR to DEL Monday" → [shows 3 options] → "Actually Tuesday" → [new search for Tuesday]

   Test D — Context memory:
   "Book BLR to DEL Monday" → [shows options] → "How much is option 2?" → [answers price from cached results]

   Test E — State recovery:
   "Book BLR to DEL Monday" → [shows options] → "What's the weather in Delhi?" → [answers, then reminds about pending selection]

   All 5 tests must pass on both WhatsApp simulator AND web chat.
```

---

**P4.5-03 — AI Response Quality & Speed**

```
Context: Build on top of P4.5-02's context system.

Now that the AI maintains context, improve the quality and speed of
responses across all channels.

1. SYSTEM PROMPT REFINEMENT:
   Rewrite the Gemini system prompt with these principles:

   PERSONALITY:
   - Professional but warm. Like a really good executive assistant.
   - Concise — WhatsApp messages should be SHORT. No essays.
   - Proactive — anticipate what the user needs next.
   - Never apologize excessively. If something goes wrong, explain and offer
     alternatives immediately.

   FORMATTING FOR WHATSAPP:
   - Use emoji sparingly and purposefully (✈️ for flights, ✅ for confirmed,
     ⚠️ for warnings, 📋 for summaries). Never more than one per line.
   - Use line breaks generously — WhatsApp reads top-to-bottom, not as paragraphs.
   - Flight options: numbered list, one option per block, key info only
     (airline, time, duration, price, compliance status).
   - Keep messages under 300 words. If more info is needed, split into
     multiple messages.

   FORMATTING FOR WEB CHAT:
   - Can be slightly more detailed than WhatsApp.
   - Use markdown formatting (bold, italic, lists) since web chat renders it.
   - Flight cards should render as rich components, not just text.

   ERROR RESPONSES (improve these significantly):
   - Instead of: "Sorry, I didn't understand that."
   - Use: "I didn't catch that. Are you looking to book a flight? Try
     something like 'Book BLR to DEL next Monday morning'."

   - Instead of: "An error occurred."
   - Use: "Hmm, I'm having trouble searching flights right now. This usually
     fixes itself in a minute — want me to try again?"

   - Instead of: [silence / hang]
   - Use: Always respond within 3 seconds with at least a "Searching..." 
     status, then follow up with results.

2. RESPONSE SPEED:
   - Add a "Searching..." or "🔍 Looking for flights..." message that sends
     IMMEDIATELY when processing a booking request (before Duffel API responds).
   - For WhatsApp: use the markAsRead + typing indicator while processing.
   - For Web: show a typing animation / skeleton while AI is thinking.
   - Target: first response within 1 second, full results within 5 seconds.

3. SMART SUGGESTIONS:
   After completing a booking or when the user seems idle, proactively suggest:
   - "Need a hotel in Delhi too?" (future feature tease — respond with
     "Hotels coming soon! For now, I've got flights covered.")
   - "Want me to set a reminder to book your return flight?"
   - "Your next usual trip is BLR-BOM — want me to search?"

4. EDGE CASE HANDLING:
   Build explicit handlers for these common failure modes:

   a) Ambiguous city: "Book to Hyderabad" → "Rajiv Gandhi International (HYD)?
      Just confirming since there's also Begumpet."
   b) Past date: "Book Delhi yesterday" → "That date has already passed!
      Did you mean next [same weekday]?"
   c) Missing date: "Book Delhi" → "When do you need to fly? Tomorrow,
      next week, or a specific date?"
   d) Gibberish/typo: "Bolk BLR DO DEL" → Attempt fuzzy match. If confident:
      "Did you mean 'Book BLR to DEL'?" If not: friendly error.
   e) Non-travel request: "What's the meaning of life?" → "I'm great at
      booking flights, but philosophy is above my pay grade 😄 Where do you
      need to fly?"

5. WEB CHAT SYNC:
   Ensure the web chat (/book) uses the EXACT same AI backend, prompt,
   and state machine as WhatsApp. The only differences should be:
   - Message formatting (markdown vs plain text)
   - Flight result rendering (rich cards vs text list)
   - Payment flow (inline Razorpay vs link-based)

   If the web chat has a separate intent parser or response formatter,
   refactor to share the same /lib/ai/ modules.
```

---

#### Workstream 3: Landing Page Redesign (Weeks 2-3)

---

**P4.5-04 — Landing Page: Dark Hero, Animated WhatsApp Demo, Trust Building**

```
Context: Read PRD-Phase4.5.md section 2 completely. This is the most
important visual deliverable of the phase.

Design references:
- sarvam.ai — dark gradient hero, animated mesh, minimal-premium aesthetic,
  smooth scroll animations, logo ticker, generous whitespace
- tryskylink.com — product-focused messaging, dual value (managers + travelers),
  integration logos, WhatsApp/Slack screenshots
- navan.com — trust logos, interactive hero, "solved" confidence,
  role-based navigation, review score

TASK: Rebuild the landing page from scratch at /app/(marketing)/page.tsx.
The current landing page is replaced entirely.

1. INSTALL / CONFIGURE:
   - framer-motion (for all animations — scroll-triggered, entrance, hover)
   - @fontsource/inter and @fontsource/plus-jakarta-sans (or use next/font)
   - If not present: ensure Tailwind is configured with extended colors
     matching the design system in the PRD section 2.2.

2. BUILD THE HERO SECTION:
   Follow the spec in PRD section 2.3 exactly.

   Hero background:
   - Dark gradient from #0A0F1E to #0F172A
   - Add a subtle animated gradient effect. Options (pick the most performant):
     a) CSS conic-gradient with slow rotation (lightweight)
     b) Radial gradient blobs that slowly move (framer-motion)
     c) SVG mesh gradient with subtle animation
   - Add a grain/noise texture overlay (use a tiny repeating PNG at 3-5% opacity
     or CSS filter). This adds visual richness.

   Left column: Headline with staggered word animation on mount.
   Each word/line fades in + slides up with 0.1s stagger. Use framer-motion variants.

   Right column: THE ANIMATED WHATSAPP MOCKUP.
   This is the hero moment and must be pixel-perfect.

   Build a React component: <WhatsAppHeroDemo />
   - Phone frame: rounded rectangle with dark bezel, notch at top,
     status bar, and WhatsApp-style header ("SkySwift AI" + green circle)
   - Messages auto-type on a loop:
     * User message slides in from right (green bubble)
     * Brief pause + typing indicator (three animated dots)
     * Bot message slides in from left (white bubble)
     * Repeat through the full booking flow (5-6 messages)
     * Pause 3 seconds at the confirmation, then fade-reset and loop
   - Messages should feel real:
     * Timestamps on each message
     * Blue double-check marks (read receipts)
     * Proper WhatsApp-style bubble tails
   - The phone should have a subtle 3D perspective tilt on desktop (rotateY(3deg)
     or similar). Remove tilt on mobile.
   - The entire phone should float with a large soft shadow beneath it.

   Trust bar: Below CTAs, single line with small icons:
   "Built by ex-Booking.com & Amadeus  ·  🔒 India data residency  ·  SOC 2 ready"

   Navbar: Transparent on hero (white text), transitions to white/glass on scroll.
   Use IntersectionObserver or scroll event with backdrop-blur.

3. BUILD THE PROBLEM SECTION:
   Dark charcoal background. Three metric cards with count-up animation
   (use framer-motion + useInView). Metrics start at 0 and count up to
   their value over 1.5 seconds when scrolled into view.

4. BUILD "HOW IT WORKS":
   Three steps connected by a subtle line/dots. Each step fades in
   sequentially on scroll. Include small WhatsApp-style mockups for
   each step (simpler than the hero — static bubbles in a small frame).

5. BUILD THE DUAL VALUE TABS:
   Tab component that switches between "For Travel Managers" and "For Employees"
   with a smooth crossfade animation on the content panel. Each tab has text
   on the left and a product screenshot/mockup on the right.

   For the dashboard screenshot: take an actual screenshot of the dashboard
   or render a realistic mockup. Apply a subtle perspective transform and
   drop shadow.

6. BUILD THE FEATURES GRID:
   Dark section. 2×3 grid of feature cards. Each card:
   - Subtle dark background (#1E293B) with soft border (#334155)
   - Icon (use Lucide icons or custom SVGs)
   - Title (white, bold)
   - Description (muted, 2 lines)
   - Soft cyan/blue glow on hover (box-shadow transition)

7. BUILD PRICING SECTION:
   Three cards. Middle card elevated + highlighted with blue border/glow.
   Badge "MOST POPULAR" on the Growth card.
   Clean, trustworthy. No gimmicks.

8. BUILD FAQ:
   Accordion component. Smooth height animation on expand/collapse.
   Chevron icon rotates on toggle.

9. BUILD FOOTER CTA:
   Dark gradient section (echoes hero). Large centered headline + CTA.
   Subtle background animation matching hero.

10. BUILD FOOTER:
    Dark, minimal. Four columns: Product, Company, Legal, Social.

11. PERFORMANCE:
    - Use next/image for any raster images
    - Lazy-load everything below the fold
    - Hero animation should start immediately (no lazy load)
    - Target: Lighthouse performance 90+, FCP < 1.5s

12. SEO:
    - Title: "SkySwift — AI Corporate Travel Management for India"
    - Description: "Book corporate flights in 30 seconds on WhatsApp. Policy
      enforcement, GST compliance, spend analytics. Free pilot for Indian companies."
    - OpenGraph tags with a compelling social preview image
    - Proper heading hierarchy (one H1 in hero, H2 for sections)

13. RESPONSIVE:
    - Test at: 375px (mobile), 768px (tablet), 1024px (laptop), 1440px (desktop)
    - Mobile: single column everywhere, smaller typography, bottom sticky CTA
    - Tablet: 2-column where appropriate
    - Desktop: full layout as designed

This must be the best page you've ever built. It's the front door to
everything we've worked on across 4 phases. Take your time. Get it right.
```

---

#### Workstream 4: Dashboard & Flow Polish (Week 3-4)

---

**P4.5-05 — Dashboard Visual Polish & UX Refinement**

```
Context: The dashboard is functionally complete from Phase 4. This prompt
is about making it feel polished and professional.

1. VISUAL CONSISTENCY:
   - Audit every dashboard page for visual consistency:
     * Same spacing patterns (16/24/32/48px increments)
     * Same card styles (consistent border-radius, shadow, padding)
     * Same text hierarchy (same font sizes for page titles, section
       titles, labels, values)
     * Same color usage (blue for primary actions, green for success,
       red for errors, amber for warnings)
   - If there are inconsistencies, create/update a shared styles config
     or component set.

2. LOADING STATES:
   Every page and data-fetching component should have a proper skeleton:
   - Page-level loading.tsx with skeleton that matches the page layout
   - Component-level loading (chart placeholders, table row skeletons)
   - Use Tailwind's animate-pulse on skeleton elements
   - Skeletons should match the SHAPE of the real content (not just gray boxes)

3. EMPTY STATES:
   Every page should handle zero-data gracefully:
   - Bookings (0): Illustration + "No bookings yet. Share the WhatsApp bot with
     your team to get started." + "Copy WhatsApp Link" button
   - Employees (0): "Invite your first team member" + Invite button
   - Analytics (no data): "Analytics will appear after your team's first bookings"
   - GST (no invoices): "GST invoices are captured automatically with each booking"
   - Make empty states feel inviting, not broken.

4. MICRO-INTERACTIONS:
   Add subtle polish animations:
   - Table rows: gentle fade-in on load (stagger 0.05s each)
   - KPI cards: number count-up on mount (like landing page metrics)
   - Status badges: subtle pulse on 'pending' status
   - Save confirmation: brief green flash / toast on successful save
   - Delete/remove: brief red confirmation toast
   - Sidebar: smooth expand/collapse, active item has a subtle background

5. RESPONSIVE FIXES:
   - Test dashboard at 768px (iPad). Sidebar should collapse to icons-only
     or hamburger menu.
   - Tables on mobile: either horizontal scroll or card-based layout
     (each row becomes a card)
   - Policy editor forms: stack to single column on mobile
   - Charts: resize gracefully (Recharts responsive containers)

6. DATA TABLE COMPONENT:
   If not already polished, ensure the shared DataTable component has:
   - Column sorting (click header to sort asc/desc)
   - Pagination (20 per page, previous/next buttons, page count)
   - Search/filter bar
   - Row click → detail panel (slide-over from right)
   - CSV export button
   - "Showing X of Y results" counter
   - Column width should accommodate content without wrapping where possible

7. NOTIFICATION SYSTEM:
   If not already present, add a simple notification/toast system:
   - Success toasts (green, bottom-right, auto-dismiss 3s)
   - Error toasts (red, bottom-right, persists until dismissed)
   - Info toasts (blue, bottom-right, auto-dismiss 5s)
   - Use a lightweight toast library (sonner is excellent with Next.js)
     or build a minimal one.

8. CHARTS POLISH:
   - Ensure all Recharts have proper tooltips
   - Use consistent color palette across all charts
   - Add proper axis labels
   - Responsive container wrapping
   - Smooth animation on data load
```

---

**P4.5-06 — WhatsApp & Web Chat Flow Refinement**

```
Context: The AI context fixes from P4.5-02 and P4.5-03 are in place.
Now refine the end-to-end booking flows for reliability and polish.

1. WHATSAPP MESSAGE FORMATTING:
   Review and improve every outgoing WhatsApp message template:

   a) Flight results message:
      - Clean, scannable format
      - Use WhatsApp interactive list (not just text) when showing 3+ options
      - Each option: airline icon (emoji), flight number, times, duration,
        price, policy status badge (✅/⚠️)
      - "🏷️ RECOMMENDED" tag on the AI's top pick (highest preference score)

   b) Booking confirmation:
      - Clean summary with all essential info
      - Include PNR prominently
      - "📧 Confirmation sent to your email"
      - "📊 GST Invoice: GSTIN captured ✓" (if org has GSTIN)
      - Friendly sign-off: "Have a great trip! ✈️"

   c) Policy violation messages:
      - Never make the employee feel punished
      - Explain WHAT rule was triggered and WHY
      - Always offer alternatives immediately
      - If exception possible, make it one-tap to request

   d) Approval request (to manager):
      - Clean, all essential info at a glance
      - Interactive buttons: "Approve" / "Reject"
      - Requester's reason included prominently

   e) Error messages:
      - Specific and helpful (never generic)
      - Always include a suggested next action
      - Never just "an error occurred"

2. WEB CHAT POLISH:
   - Ensure chat interface on /book matches WhatsApp quality
   - Flight results render as rich cards (not just text) with:
     * Airline logo (use a mapping of airline code → logo URL)
     * Clear time display with duration
     * Price with ₹ symbol, properly formatted
     * Policy compliance badge
     * "Select" button on each card
   - Booking confirmation renders as a styled card with download buttons
     (e-ticket PDF, GST invoice PDF)
   - Typing indicator while AI is processing
   - Chat auto-scrolls to latest message
   - Message input: auto-focus, submit on Enter, multiline with Shift+Enter
   - Suggested quick replies: chips below the input field
     ("Book a flight", "Check my bookings", "Help")

3. EDGE CASE FLOWS:
   Test and fix these specific scenarios:

   a) Double-booking protection:
      If user tries to book the same route on the same date where they
      already have an active booking → warn them before proceeding.

   b) Session reconnect:
      If WhatsApp session was in 'selecting' state and user comes back
      after 10 minutes (but before 30-minute timeout) → remind them
      where they left off: "You were looking at BLR→DEL flights. Still
      want to pick one? Here are your options again:"

   c) Concurrent conversations:
      If user sends rapid messages while a search is in progress →
      queue the messages and process them after search completes,
      don't start parallel searches.

   d) Booking failure recovery:
      If Duffel booking fails after payment → immediate refund trigger
      → clear error message to user → suggest rebooking with a different
      option: "That fare is no longer available. Here's the next best option:"

4. DEMO SIMULATOR SYNC:
   Ensure /demo/whatsapp uses the EXACT same formatting and flows as
   the real WhatsApp handler. If we change a message template, it should
   update in both places. Ideally they share the same formatting module
   (/lib/whatsapp-formatters.ts).
```

---

#### Workstream 5: Cross-Platform Demo & Final Polish (Week 4-5)

---

**P4.5-07 — Slack & Teams Demo Prototype**

```
Context: Read PRD-Phase4.5.md section 3.

Build a cross-platform demo page that shows SkySwift working across
WhatsApp, Slack, and Microsoft Teams. This is for investor pitches and
pilot sales calls — not a real integration.

1. DEMO PAGE: /demo/channels
   Layout: Tab bar at top with three options:
   - "WhatsApp" (green icon)
   - "Slack" (purple icon)
   - "Microsoft Teams" (blue icon)

   Below the tabs: a chat simulator styled to match the selected platform.
   All three share the same backend (the existing AI + mock flight data).

2. WHATSAPP THEME (existing, restyled):
   - Already built from P4-11. Ensure it's working with the new AI
     context system from P4.5-02.
   - Match real WhatsApp styling exactly.

3. SLACK THEME:
   Build a Slack-styled chat component:
   - White background with Slack's characteristic purple sidebar hint
   - Channel header: "#travel-bookings" with channel info
   - Bot messages styled as Slack app messages:
     * "SkySwift AI" avatar (bot icon) + "APP" badge
     * Message blocks with attachment styling (left color bar for flight results)
     * Button actions ("Book This", "See More Options") styled as Slack buttons
     * Thread indicator
   - User messages: plain text with user avatar
   - Input bar: Slack-style with formatting toolbar hint
   - React with accurate Slack visual details:
     * Timestamp format: "2:34 PM"
     * Subtle dividers between message groups
     * Hover actions (emoji, thread, bookmark — non-functional, just visual)

4. MICROSOFT TEAMS THEME:
   Build a Teams-styled chat component:
   - Teams purple/blue header (#464EB8)
   - "SkySwift AI" bot with Teams bot icon
   - Adaptive Card-style rendering for flight results:
     * Card with header, body, action buttons
     * Teams' flat design with colored containers
   - User messages in Teams' bubble style
   - Input bar: Teams-style with attachments/emoji icons

5. UNIFIED BACKEND:
   All three themes must hit the same handler:
   - Create a /lib/demo/demo-handler.ts that processes messages
   - Uses the same intent parser and mock flight data
   - Returns platform-agnostic response that each theme formats differently
   - Each theme has its own formatter:
     /lib/demo/format-whatsapp.ts
     /lib/demo/format-slack.ts
     /lib/demo/format-teams.ts

6. AUTO-PLAY MODE:
   Add a "Watch Demo" toggle/button that auto-plays a booking conversation
   in the selected platform. Same script for all three:
   - "Book me a flight to Delhi next Monday morning"
   - [Shows 3 options]
   - "1"
   - [Confirms and books]

   This auto-play is critical for presentations where you want to
   narrate over the demo without typing.

7. DESIGN QUALITY:
   This page needs to feel REAL. Someone watching the Slack demo should
   think "wait, is this actually Slack?" The details matter:
   - Correct fonts (Slack uses Lato, Teams uses Segoe UI)
   - Correct spacing and border-radius
   - Correct icon styles
   - Correct colors (Slack purple #4A154B, Teams blue #464EB8)

8. Access: Password-protected via DEMO_PASSWORD env var.
   Add a link from /demo/page.tsx: "Try Cross-Platform Demo →"
```

---

**P4.5-08 — Demo Polish & Seed Data Perfection**

```
Context: Final demo polish. This prompt ensures the demo experience
is flawless end-to-end.

1. DEMO SEED DATA REFRESH:
   Update the demo seed script to create ultra-realistic data:

   Organization: "Acme Technologies"
   - 200-person tech company based in Bangalore
   - GSTIN: 29AABCT1234F1ZP
   - Domain: acmetech.com
   - Industry: IT Services
   - Annual travel spend: ₹50L-1Cr

   Members (8):
   - Vikram Patel (Admin/Founder) — vikram@acmetech.com
   - Priya Singh (Travel Manager) — priya@acmetech.com
   - Ravi Kumar (Sales Director) — ravi@acmetech.com
   - Anita Sharma (Engineer, IC) — anita@acmetech.com
   - Deepak Gupta (Consultant, IC) — deepak@acmetech.com
   - Megha Iyer (Marketing Manager) — megha@acmetech.com
   - Arjun Reddy (Sales Rep, IC) — arjun@acmetech.com
   - Sneha Nair (HR Lead) — sneha@acmetech.com

   Travel Policy:
   - Economy for IC/Manager, Business allowed for Director+
   - Per-trip limit: ₹15,000 domestic, ₹80,000 international
   - Auto-approve under ₹8,000
   - Preferred airlines: IndiGo, Air India
   - Minimum 3 days advance booking (recommended 7)

   Bookings: 60 bookings across 3 months (realistic distribution):
   - 70% BLR↔DEL, 15% BLR↔BOM, 10% BLR↔HYD, 5% other
   - 85% economy, 10% premium economy, 5% business (directors only)
   - 90% policy-compliant, 7% approved exceptions, 3% policy violations
   - Mix of WhatsApp (70%), web (20%), admin-booked (10%)
   - Realistic Indian airline names, flight numbers, prices, times

   GST Invoices: Matching invoices for all 60 bookings with proper
   GSTIN, SAC codes, CGST/SGST/IGST breakdowns. Some reconciled,
   some pending.

   Analytics: Pre-computed monthly/quarterly aggregates showing:
   - Upward trend in bookings (month over month)
   - ₹2.3L GST ITC recovered across 3 months
   - 94% average policy compliance
   - Average advance booking: 5.2 days
   - WhatsApp adoption growing month over month

2. DEMO ENTRY POINTS:
   Update /demo page with clear, polished entry points:

   Card 1: "📱 WhatsApp Demo"
   → Opens /demo/whatsapp
   → Description: "Experience the booking flow as an employee"
   → Pre-loaded as "Anita Sharma" (IC employee)

   Card 2: "💬 Cross-Platform Demo"
   → Opens /demo/channels
   → Description: "See SkySwift on WhatsApp, Slack, and Teams"

   Card 3: "📊 Admin Dashboard"
   → Opens /dashboard (with demo data)
   → Description: "See the travel manager's command center"
   → Pre-loaded as "Priya Singh" (Travel Manager)

   Card 4: "🛡️ Policy in Action"
   → Opens /demo/whatsapp with a pre-loaded scenario
   → Description: "Watch policy enforcement and approval flows"
   → Auto-plays the business class rejection → approval flow

   Design: Clean, centered, dark background. Cards with subtle
   hover effects. Company logo at top. "SkySwift Demo" title.

3. ONE-CLICK SCENARIO BUTTONS:
   In the WhatsApp simulator, add a row of scenario buttons at the top:

   "Standard Booking" → auto-types "Book BLR to DEL Monday morning"
   "Out of Policy" → auto-types "Book me business class to Mumbai"
   "Preference Learning" → auto-types "Book my usual Delhi flight"
   "Modify Booking" → starts with a confirmed booking, then "Change to Thursday"

   These make it easy to demo specific scenarios in investor meetings
   without memorizing what to type.

4. DEMO ANALYTICS DASHBOARD:
   Ensure the analytics page shows beautiful, meaningful charts:
   - Monthly spend: clear upward-then-stabilizing trend
   - Department breakdown: Engineering (40%), Sales (35%), Marketing (15%), Other (10%)
   - Top routes: visual bar chart with Indian city names
   - Booking channel: WhatsApp dominant (70%) — this tells the story
   - GST recovery: cumulative line chart showing ₹2.3L recovered

5. DEMO PERFORMANCE:
   - Demo pages should load instantly (all data pre-seeded, no API waits)
   - Auto-play animations should be smooth (60fps)
   - WhatsApp typing animation should feel natural (variable speed)
```

---

**P4.5-09 — Final QA, Performance & Production Readiness**

```
Context: Last prompt. Everything must be production-ready.

1. FULL APPLICATION TEST:
   Run through every page and flow. Fix any issues found.

   Pages to test:
   - / (landing page) — all sections render, animations work, responsive
   - /signup — full org creation flow works end-to-end
   - /login — auth works, redirects to dashboard
   - /dashboard — overview loads with correct data
   - /dashboard/bookings — table, filters, detail panel
   - /dashboard/employees — CRUD, invite flow
   - /dashboard/policy — edit and save policy, verify it applies
   - /dashboard/analytics — charts render, responsive
   - /dashboard/gst — invoices table, CSV export works
   - /dashboard/settings — org settings save correctly
   - /book — web chat booking flow, end-to-end
   - /book/history — booking list loads
   - /book/preferences — prefs save and affect search results
   - /demo — all demo entry points work
   - /demo/whatsapp — full booking flow + scenarios
   - /demo/channels — all three platforms render correctly

2. LIGHTHOUSE AUDIT:
   Run Lighthouse on:
   - Landing page: target 90+ performance, 90+ accessibility
   - Dashboard: target 80+ performance
   Fix any critical/high issues found.

3. CROSS-BROWSER:
   Test on: Chrome, Safari, Firefox, Edge (latest versions).
   Fix any rendering issues.

4. MOBILE TESTING:
   Test all pages at 375px width (iPhone SE/13 mini):
   - Landing page hero: text readable, WhatsApp demo visible
   - Dashboard: sidebar collapses, tables scroll or card-ify
   - Demo: WhatsApp simulator usable on mobile
   Fix any overflow, text cutoff, or touch target issues.

5. SECURITY AUDIT:
   - Verify no API keys in client-side bundles
   - Verify all protected routes require auth
   - Verify RLS is active on all tables
   - Verify demo mode can't access real data
   - Check for XSS vectors in chat input

6. PERFORMANCE:
   - Verify no unnecessary re-renders in React components
   - Verify images use next/image with proper sizing
   - Verify dynamic imports for heavy components (charts, phone mockup)
   - Check bundle size: `npx next build` — flag any page over 200KB

7. ERROR HANDLING:
   - Every page has error.tsx boundary
   - Every async operation has try/catch
   - User-facing errors are friendly and actionable
   - Network failures show retry option

8. FINAL DEPLOYMENT:
   - Update .env.example with all variables
   - Update README.md with Phase 4.5 changes
   - Verify Vercel deployment works
   - Test production URL end-to-end
   - Generate final test report

Commit message: "Phase 4.5 complete: AI context fix, landing page redesign,
dashboard polish, cross-platform demo, production readiness"
```

---

## 5. Success Criteria

Phase 4.5 is complete when:

| Criteria | Metric |
|----------|--------|
| AI context retention | 5/5 multi-turn test conversations pass (both WhatsApp + web) |
| Landing page Lighthouse | Performance ≥ 90, Accessibility ≥ 90 |
| Landing page load time | FCP < 1.5 seconds |
| Hero animation | WhatsApp demo auto-plays smoothly at 60fps |
| Dashboard empty states | Every page handles zero-data gracefully |
| Demo flows | All 4 scenario buttons work flawlessly in WhatsApp simulator |
| Cross-platform demo | Slack + Teams themes are visually authentic |
| Code health | 0 build errors, 0 lint errors, 0 TypeScript errors |
| Mobile responsive | All pages usable at 375px width |
| Zero dead code | No unused pages, components, or packages from Phase 1-3 |

---

## 6. What Comes After Phase 4.5

Once Phase 4.5 is complete, the product is demo-ready and pilot-ready. Next steps:

1. **Acquire 5-10 pilot customers** — target Bangalore tech companies through personal network, startup ecosystem, LinkedIn outreach
2. **Go live on WhatsApp** — connect real WhatsApp Business number, switch to Duffel live mode
3. **Submit YC S26 application** — with working product + pilot traction
4. **Phase 5 (post-pilots):** Hotels, rail, ground transport, Tally API, Slack production integration

---

*SkySwift — Confidential | PRD v4.5 | February 21, 2026*
*Phase 4.5: The Refinement Phase — "Make it inevitable."*
