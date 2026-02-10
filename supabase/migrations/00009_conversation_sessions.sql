-- ============================================================================
-- Migration: Conversation sessions for multi-turn AI state tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  state TEXT DEFAULT 'idle',
  -- States: 'idle', 'gathering_intent', 'searching',
  -- 'presenting_options', 'awaiting_selection',
  -- 'confirming_booking', 'processing_payment',
  -- 'post_booking', 'modifying'
  current_intent JSONB DEFAULT '{}',
  -- Accumulated intent: {origin, destination, date, airline, etc.}
  missing_fields TEXT[] DEFAULT '{}',
  search_results_cache JSONB,
  -- Cached Duffel results so we don't re-search unnecessarily
  selected_offer_id TEXT,
  messages_in_session INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own conv sessions" ON conversation_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service manage conv sessions" ON conversation_sessions
  FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conv_sessions_user
  ON conversation_sessions(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_conv_sessions_chat
  ON conversation_sessions(chat_session_id);
