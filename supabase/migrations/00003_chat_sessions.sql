-- ============================================================================
-- Chat Sessions — persistent chat history per user
-- ============================================================================

create table public.chat_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null default 'New booking',
  messages    jsonb not null default '[]'::jsonb,
  booking_id  uuid references public.bookings(id) on delete set null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Indexes
create index idx_chat_sessions_user_id on public.chat_sessions(user_id);
create index idx_chat_sessions_updated on public.chat_sessions(updated_at desc);

-- Auto-update updated_at
create trigger handle_updated_at_chat_sessions
  before update on public.chat_sessions
  for each row execute procedure moddatetime(updated_at);

-- RLS
alter table public.chat_sessions enable row level security;

create policy "Users can view own chat sessions"
  on public.chat_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own chat sessions"
  on public.chat_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own chat sessions"
  on public.chat_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own chat sessions"
  on public.chat_sessions for delete
  using (auth.uid() = user_id);
