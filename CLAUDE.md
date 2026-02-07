# Zero-Friction Autonomous Travel Agent

## Project Overview
An end-to-end autonomous flight booking agent that transforms the 47-click, 18-minute booking process into a 30-second conversational command. Built for high-frequency business travelers (12+ flights/year).

## Tech Stack
- **Framework:** Next.js 14 (App Router) with TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL + Auth + Row-Level Security)
- **Payments:** Stripe (tokenization via Stripe Elements — we NEVER touch raw card data)
- **AI:** Anthropic Claude API (Sonnet 4.5) for natural language intent parsing
- **Workflow Engine:** Temporal Cloud (durable execution for multi-step booking flows)
- **Flight Data:** British Airways NDC API (primary), Amadeus GDS (fallback)
- **Flight Tracking:** FlightAware AeroAPI (disruption monitoring)
- **Notifications:** SendGrid (email), Twilio (SMS), Firebase (push)
- **Hosting:** Vercel (frontend + API routes + Edge)
- **Monitoring:** Sentry (errors), Vercel Analytics (web vitals)
- **Secrets:** HashiCorp Vault (passport data, sensitive PII)

## Architecture Principles
1. **Modular monolith** — each feature is a separate Next.js API route, extract to microservices later
2. **Stateful workflows** — Temporal.io for durable execution (booking is multi-step with failure states)
3. **Security by design** — AES-256 encryption at rest, TLS 1.3 in transit, Stripe tokenization for payments
4. **Fail gracefully** — NDC fails → GDS fallback → manual Wizard-of-Oz fallback
5. **Observability from day 1** — log every API call, track booking funnel, alert on anomalies

## Key User Journeys
1. **Onboarding:** Sign up → conversational profile builder (name, passport, KTN, loyalty programs, seat prefs) → add payment method
2. **Booking:** Natural language input → Claude parses intent → search flights via NDC/GDS → show options → user confirms → execute booking → send confirmation
3. **Disruption management:** Monitor flights → detect cancellation/delay → auto-rebook → notify user

## Database Schema (Supabase PostgreSQL)
Core tables: users, user_profiles, loyalty_programs, payment_methods, bookings, flight_segments, disruption_events, workflow_states, audit_log
- All PII encrypted at rest
- Row-Level Security (RLS) enabled — users can only access their own data
- Passport/KTN stored in Vault, referenced by vault_id

## Project Structure Convention
```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (dashboard)/       # Protected pages (profile, bookings, settings)
│   ├── api/               # API routes
│   │   ├── booking/       # Booking endpoints
│   │   ├── flights/       # Flight search endpoints
│   │   ├── profile/       # Profile CRUD
│   │   └── webhooks/      # Stripe, flight tracking webhooks
│   └── layout.tsx
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── chat/             # Conversational booking interface
│   ├── flights/          # Flight cards, seat maps
│   └── profile/          # Profile forms
├── lib/                  # Shared utilities
│   ├── supabase/         # Supabase client + helpers
│   ├── stripe/           # Stripe client
│   ├── claude/           # Claude API intent parser
│   ├── ndc/              # BA NDC API client
│   ├── amadeus/          # Amadeus GDS client
│   └── flightaware/      # FlightAware client
├── types/                # TypeScript type definitions
└── hooks/                # Custom React hooks
```

## MVP Scope (12 weeks)
Must-have features only:
1. Conversational booking interface (chat UI + Claude intent parsing)
2. Identity vault (profile with passport, KTN, loyalty programs, seat/meal prefs)
3. Single-airline integration (BA NDC or Amadeus GDS)
4. Booking confirmation flow (review before payment)
5. Payment tokenization (Stripe Elements)
6. Email confirmation (itinerary delivery via SendGrid)

## Coding Standards
- Use TypeScript strict mode
- Use server components by default, client components only when needed
- Use Zod for all input validation
- Use React Hook Form for forms
- Use TanStack Query for data fetching on client
- API routes should return consistent JSON: `{ data, error, message }`
- All sensitive operations must have audit logging
- Never log PII (passport numbers, full card numbers, etc.)

## Environment Variables Needed
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
ANTHROPIC_API_KEY=
SENDGRID_API_KEY=
FLIGHTAWARE_API_KEY=
BA_NDC_CLIENT_ID=
BA_NDC_CLIENT_SECRET=
AMADEUS_API_KEY=
AMADEUS_API_SECRET=
```
