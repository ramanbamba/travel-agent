# SkySwift — AI Travel Management for Indian Corporates

Corporate travel booking via WhatsApp in 30 seconds. Policy enforcement, GST compliance, and manager approvals — all automated.

## What is SkySwift?

SkySwift transforms the 47-click, 18-minute corporate flight booking process into a single WhatsApp message. Employees message the bot naturally ("Book BLR to DEL Monday morning"), the AI parses intent, searches real airline inventory, checks company travel policy, and books — all in chat.

**For travel managers:** A real-time dashboard with booking analytics, policy configuration, employee management, and automated GST/ITC tracking for Indian tax compliance.

## Key Features

- **WhatsApp Booking** — Employees book flights via WhatsApp. AI parses natural language, searches flights, enforces policy.
- **Policy Engine** — Seniority-aware cabin class rules, spend limits, blocked airlines, auto-approval thresholds.
- **Admin Dashboard** — KPIs, bookings table, employee management, policy editor, analytics with charts.
- **GST Compliance** — Automatic CGST/SGST/IGST breakdown, ITC tracking, Tally & Zoho CSV export.
- **Approval Workflow** — Out-of-policy bookings routed to managers. Auto-escalation on timeout.
- **Employee Web Portal** — Chat-based booking, trip history, editable preferences, learned insights.
- **Demo Mode** — Password-protected demo with pixel-perfect WhatsApp simulator for investor pitches.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| AI | Google Gemini 2.0 Flash (primary), Anthropic Claude (fallback) |
| Flights | Duffel API (primary), Amadeus (fallback), Mock (testing) |
| Payments | Stripe (global), Razorpay (India) |
| WhatsApp | Meta WhatsApp Business API |
| Email | Resend + React Email |
| Charts | Recharts |
| Monitoring | Sentry |
| Hosting | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project (free tier works)
- At minimum: Gemini API key

### Setup

```bash
# Clone
git clone https://github.com/ramanbamba/travel-agent.git
cd travel-agent

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Run database migrations
# (Apply migrations in supabase/migrations/ to your Supabase project)

# Seed demo data (optional)
npm run seed:demo          # B2C demo users
npm run seed:demo-corp     # Corporate demo (org, employees, bookings)

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo Mode

Set `DEMO_MODE=true` and `DEMO_PASSWORD=yourpassword` in `.env.local`, then visit `/demo` for a guided walkthrough with:
- Pixel-perfect WhatsApp chat simulator
- Pre-populated admin dashboard
- Employee booking interface

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, signup
│   ├── (dashboard)/         # B2C dashboard + corp admin dashboard
│   │   └── dashboard/corp/  # Corporate admin (overview, bookings, employees, policy, GST, analytics)
│   ├── (employee)/          # Employee web portal (book, history, preferences)
│   ├── demo/                # Demo landing + WhatsApp simulator
│   └── api/
│       ├── corp/            # Corporate admin APIs (auth-protected)
│       ├── demo/            # Demo APIs (no auth)
│       ├── flights/         # Flight search + booking
│       ├── whatsapp/        # WhatsApp webhook + simulator
│       └── org/             # Org management (create, invite)
├── components/
│   ├── corporate-dashboard/ # Reusable corp dashboard components
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── ai/                  # AI provider abstraction (Gemini, Anthropic, Mock)
│   ├── corp/                # Corporate auth helper
│   ├── demo/                # Demo mode utilities + mock flights
│   ├── gst/                 # GST export (Tally, Zoho CSV)
│   ├── policy/              # Deterministic policy evaluation engine
│   ├── supply/              # Flight supplier abstraction (Duffel, Amadeus, Mock)
│   ├── supabase/            # Database client
│   └── whatsapp/            # WhatsApp message handler + intent router
└── scripts/
    ├── seed-demo.ts         # B2C demo seed
    └── seed-demo-corp.ts    # Corporate demo seed
```

## Environment Variables

See [`.env.example`](.env.example) for the full list. Required:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `AI_PROVIDER` | `gemini`, `anthropic`, or `mock` |
| `GEMINI_API_KEY` | Google Gemini API key |

## Architecture

```
Employee (WhatsApp / Web) → AI Intent Parser → Flight Search (Duffel)
                                  ↓
                          Policy Evaluation
                                  ↓
                    ┌─────────────┴─────────────┐
                    │                           │
              Compliant → Auto-Book      Out of Policy → Manager Approval
                    │                           │
              PNR + E-ticket              WhatsApp notification
                    │                           │
              GST Invoice                 Approve/Reject
```

## License

Private — All rights reserved.
