-- ============================================================================
-- Travel Agent — Initial Database Schema
-- Run this in the Supabase SQL Editor (or via supabase db push)
-- ============================================================================

-- 0. Extensions
-- ============================================================================
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "moddatetime"; -- auto-update updated_at triggers

-- 1. ENUM types
-- ============================================================================
create type booking_status as enum (
  'pending',        -- user reviewing options
  'confirmed',      -- booking confirmed with airline
  'ticketed',       -- ticket issued
  'cancelled',      -- booking cancelled
  'failed'          -- booking attempt failed
);

create type payment_status as enum (
  'pending',
  'authorized',
  'captured',
  'refunded',
  'failed'
);

create type cabin_class as enum (
  'economy',
  'premium_economy',
  'business',
  'first'
);

create type seat_preference as enum (
  'window',
  'middle',
  'aisle',
  'no_preference'
);

create type meal_preference as enum (
  'standard',
  'vegetarian',
  'vegan',
  'halal',
  'kosher',
  'gluten_free',
  'no_preference'
);

create type disruption_type as enum (
  'delay',
  'cancellation',
  'gate_change',
  'equipment_change',
  'diversion'
);

create type disruption_action as enum (
  'notify_only',
  'auto_rebook',
  'manual_review'
);

create type workflow_status as enum (
  'running',
  'completed',
  'failed',
  'timed_out',
  'cancelled'
);

create type data_source as enum (
  'ndc',       -- BA NDC API
  'gds',       -- Amadeus GDS
  'manual'     -- Wizard-of-Oz fallback
);

-- 2. User Profiles
-- ============================================================================
-- Supabase Auth already provides auth.users. This table extends it.
create table public.user_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  first_name    text not null,
  last_name     text not null,
  phone         text,
  date_of_birth date,

  -- Sensitive PII stored in Vault; we only keep a reference here
  passport_vault_id  text,   -- pointer to HashiCorp Vault secret
  ktn_vault_id       text,   -- Known Traveller Number (TSA PreCheck / Global Entry)

  -- Travel preferences
  preferred_cabin     cabin_class     default 'economy',
  seat_preference     seat_preference default 'no_preference',
  meal_preference     meal_preference default 'no_preference',
  home_airport        text,           -- IATA code, e.g. 'LHR'

  -- Metadata
  onboarding_completed boolean   default false,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- 3. Loyalty Programs
-- ============================================================================
create table public.loyalty_programs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.user_profiles(id) on delete cascade,
  airline_code    text not null,      -- IATA carrier code, e.g. 'BA'
  airline_name    text not null,      -- e.g. 'British Airways'
  program_name    text not null,      -- e.g. 'Executive Club'
  member_number   text not null,
  tier            text,               -- e.g. 'Gold', 'Silver'
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),

  unique (user_id, airline_code)      -- one program per airline per user
);

-- 4. Payment Methods (Stripe-tokenized — NO raw card data)
-- ============================================================================
create table public.payment_methods (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.user_profiles(id) on delete cascade,
  stripe_payment_method_id  text not null unique,   -- pm_xxx from Stripe
  card_brand          text,            -- visa, mastercard, amex
  card_last_four      text,            -- last 4 digits only
  card_exp_month      int,
  card_exp_year       int,
  is_default          boolean default false,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- 5. Bookings
-- ============================================================================
create table public.bookings (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.user_profiles(id) on delete cascade,
  payment_method_id   uuid references public.payment_methods(id) on delete set null,

  -- Booking details
  status              booking_status  default 'pending',
  data_source         data_source     not null,
  pnr                 text,           -- airline confirmation / PNR code
  total_price_cents   int,            -- price in smallest currency unit
  currency            text default 'GBP',
  cabin_class         cabin_class     default 'economy',

  -- Payment
  payment_status      payment_status  default 'pending',
  stripe_payment_intent_id  text,     -- pi_xxx from Stripe

  -- AI context
  original_query      text,           -- user's natural language request
  parsed_intent       jsonb,          -- Claude's structured intent output

  -- Timestamps
  booked_at           timestamptz,
  cancelled_at        timestamptz,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- 6. Flight Segments (one booking can have multiple legs)
-- ============================================================================
create table public.flight_segments (
  id                  uuid primary key default gen_random_uuid(),
  booking_id          uuid not null references public.bookings(id) on delete cascade,
  segment_order       int not null,     -- 1 = first leg, 2 = second, etc.

  -- Flight info
  airline_code        text not null,    -- IATA carrier code
  flight_number       text not null,    -- e.g. 'BA117'
  departure_airport   text not null,    -- IATA code
  arrival_airport     text not null,    -- IATA code
  departure_time      timestamptz not null,
  arrival_time        timestamptz not null,
  aircraft_type       text,             -- e.g. 'A380'
  cabin_class         cabin_class,

  -- Seat assignment
  seat_number         text,

  -- Status
  operating_carrier   text,             -- if codeshare
  status              text default 'scheduled',

  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),

  unique (booking_id, segment_order)
);

-- 7. Disruption Events
-- ============================================================================
create table public.disruption_events (
  id                  uuid primary key default gen_random_uuid(),
  flight_segment_id   uuid not null references public.flight_segments(id) on delete cascade,
  booking_id          uuid not null references public.bookings(id) on delete cascade,

  disruption_type     disruption_type not null,
  description         text,
  original_departure  timestamptz,
  new_departure       timestamptz,

  -- Resolution
  action_taken        disruption_action default 'notify_only',
  rebooked_segment_id uuid references public.flight_segments(id),
  resolved            boolean default false,

  detected_at         timestamptz default now(),
  resolved_at         timestamptz,
  created_at          timestamptz default now()
);

-- 8. Workflow States (Temporal durable execution tracking)
-- ============================================================================
create table public.workflow_states (
  id                  uuid primary key default gen_random_uuid(),
  booking_id          uuid references public.bookings(id) on delete set null,
  user_id             uuid not null references public.user_profiles(id) on delete cascade,

  temporal_workflow_id  text not null unique,  -- Temporal workflow ID
  temporal_run_id       text,                  -- Temporal run ID
  workflow_type         text not null,         -- e.g. 'booking_flow', 'disruption_rebook'
  status                workflow_status default 'running',

  input_payload         jsonb,
  output_payload        jsonb,
  error_message         text,

  started_at            timestamptz default now(),
  completed_at          timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- 9. Audit Log (append-only, immutable)
-- ============================================================================
create table public.audit_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete set null,
  action        text not null,          -- e.g. 'booking.created', 'profile.updated'
  resource_type text,                   -- e.g. 'booking', 'profile'
  resource_id   uuid,
  metadata      jsonb default '{}',     -- extra context (NEVER include PII)
  ip_address    inet,
  user_agent    text,
  created_at    timestamptz default now()
);

-- Audit log is append-only: no UPDATE or DELETE allowed via RLS
-- (enforced below in RLS policies)

-- ============================================================================
-- 10. INDEXES
-- ============================================================================

-- User Profiles
create index idx_user_profiles_home_airport on public.user_profiles(home_airport);

-- Loyalty Programs
create index idx_loyalty_programs_user_id on public.loyalty_programs(user_id);

-- Payment Methods
create index idx_payment_methods_user_id on public.payment_methods(user_id);

-- Bookings
create index idx_bookings_user_id on public.bookings(user_id);
create index idx_bookings_status on public.bookings(status);
create index idx_bookings_pnr on public.bookings(pnr);
create index idx_bookings_created_at on public.bookings(created_at desc);

-- Flight Segments
create index idx_flight_segments_booking_id on public.flight_segments(booking_id);
create index idx_flight_segments_departure on public.flight_segments(departure_time);
create index idx_flight_segments_flight_number on public.flight_segments(airline_code, flight_number);

-- Disruption Events
create index idx_disruptions_segment on public.disruption_events(flight_segment_id);
create index idx_disruptions_booking on public.disruption_events(booking_id);
create index idx_disruptions_unresolved on public.disruption_events(resolved) where resolved = false;

-- Workflow States
create index idx_workflows_booking on public.workflow_states(booking_id);
create index idx_workflows_user on public.workflow_states(user_id);
create index idx_workflows_status on public.workflow_states(status);

-- Audit Log
create index idx_audit_log_user on public.audit_log(user_id);
create index idx_audit_log_action on public.audit_log(action);
create index idx_audit_log_resource on public.audit_log(resource_type, resource_id);
create index idx_audit_log_created on public.audit_log(created_at desc);

-- ============================================================================
-- 11. AUTO-UPDATE updated_at TRIGGERS
-- ============================================================================

create trigger handle_updated_at_user_profiles
  before update on public.user_profiles
  for each row execute procedure moddatetime(updated_at);

create trigger handle_updated_at_loyalty_programs
  before update on public.loyalty_programs
  for each row execute procedure moddatetime(updated_at);

create trigger handle_updated_at_payment_methods
  before update on public.payment_methods
  for each row execute procedure moddatetime(updated_at);

create trigger handle_updated_at_bookings
  before update on public.bookings
  for each row execute procedure moddatetime(updated_at);

create trigger handle_updated_at_flight_segments
  before update on public.flight_segments
  for each row execute procedure moddatetime(updated_at);

create trigger handle_updated_at_workflow_states
  before update on public.workflow_states
  for each row execute procedure moddatetime(updated_at);

-- ============================================================================
-- 12. ROW-LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
alter table public.user_profiles     enable row level security;
alter table public.loyalty_programs  enable row level security;
alter table public.payment_methods   enable row level security;
alter table public.bookings          enable row level security;
alter table public.flight_segments   enable row level security;
alter table public.disruption_events enable row level security;
alter table public.workflow_states   enable row level security;
alter table public.audit_log         enable row level security;

-- ── User Profiles ──────────────────────────────────────────────────────────
create policy "Users can view own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── Loyalty Programs ───────────────────────────────────────────────────────
create policy "Users can view own loyalty programs"
  on public.loyalty_programs for select
  using (auth.uid() = user_id);

create policy "Users can insert own loyalty programs"
  on public.loyalty_programs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own loyalty programs"
  on public.loyalty_programs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own loyalty programs"
  on public.loyalty_programs for delete
  using (auth.uid() = user_id);

-- ── Payment Methods ────────────────────────────────────────────────────────
create policy "Users can view own payment methods"
  on public.payment_methods for select
  using (auth.uid() = user_id);

create policy "Users can insert own payment methods"
  on public.payment_methods for insert
  with check (auth.uid() = user_id);

create policy "Users can update own payment methods"
  on public.payment_methods for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own payment methods"
  on public.payment_methods for delete
  using (auth.uid() = user_id);

-- ── Bookings ───────────────────────────────────────────────────────────────
create policy "Users can view own bookings"
  on public.bookings for select
  using (auth.uid() = user_id);

create policy "Users can insert own bookings"
  on public.bookings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own bookings"
  on public.bookings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Flight Segments ────────────────────────────────────────────────────────
-- Users can see segments belonging to their bookings
create policy "Users can view own flight segments"
  on public.flight_segments for select
  using (
    exists (
      select 1 from public.bookings
      where bookings.id = flight_segments.booking_id
        and bookings.user_id = auth.uid()
    )
  );

create policy "Users can insert own flight segments"
  on public.flight_segments for insert
  with check (
    exists (
      select 1 from public.bookings
      where bookings.id = flight_segments.booking_id
        and bookings.user_id = auth.uid()
    )
  );

-- ── Disruption Events ──────────────────────────────────────────────────────
create policy "Users can view own disruption events"
  on public.disruption_events for select
  using (
    exists (
      select 1 from public.bookings
      where bookings.id = disruption_events.booking_id
        and bookings.user_id = auth.uid()
    )
  );

-- ── Workflow States ────────────────────────────────────────────────────────
create policy "Users can view own workflow states"
  on public.workflow_states for select
  using (auth.uid() = user_id);

-- ── Audit Log (append-only for users) ──────────────────────────────────────
create policy "Users can view own audit log"
  on public.audit_log for select
  using (auth.uid() = user_id);

create policy "Users can insert audit log entries"
  on public.audit_log for insert
  with check (auth.uid() = user_id);

-- No UPDATE or DELETE policies on audit_log — it is immutable for users.

-- ============================================================================
-- 13. HELPER FUNCTION: ensure only one default payment method per user
-- ============================================================================
create or replace function public.ensure_single_default_payment()
returns trigger as $$
begin
  if new.is_default = true then
    update public.payment_methods
    set is_default = false
    where user_id = new.user_id
      and id != new.id
      and is_default = true;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_single_default_payment
  after insert or update of is_default on public.payment_methods
  for each row
  when (new.is_default = true)
  execute function public.ensure_single_default_payment();
