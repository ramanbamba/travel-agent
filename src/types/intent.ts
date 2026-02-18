// ============================================================================
// Phase 4 — Corporate Intent Types
// Used by AI intent parser + WhatsApp intent router
// ============================================================================

// ── Time Preferences ──

export type TimePreference =
  | "early_morning"  // 4-7 AM
  | "morning"        // 7-11 AM
  | "afternoon"      // 11 AM - 4 PM
  | "evening"        // 4-8 PM
  | "late_evening";  // 8 PM - midnight

// ── Intent Types ──

export interface BookingIntent {
  type: "book_flight";
  origin?: string;
  destination: string;
  departure_date?: string;
  return_date?: string;
  time_preference?: TimePreference;
  cabin_class?: string;
  passengers?: number;
  special_requests?: string[];
  purpose?: string;
  project_code?: string;
}

export interface FlightSearchIntent {
  type: "search_flights";
  origin?: string;
  destination: string;
  departure_date?: string;
  return_date?: string;
  time_preference?: TimePreference;
  cabin_class?: string;
  sort_by?: "price" | "duration" | "departure_time";
}

export interface PolicyQuestionIntent {
  type: "policy_question";
  question: string;
}

export interface BookingManagementIntent {
  type: "manage_booking";
  action: "cancel" | "change" | "status";
  booking_ref?: string;
  change_details?: Record<string, string>;
}

export interface ApprovalResponseIntent {
  type: "approval_response";
  action: "approve" | "reject";
  booking_id?: string;
  reason?: string;
}

export interface ExpenseQueryIntent {
  type: "expense_query";
  period?: string;
  department?: string;
  member_name?: string;
}

export interface PreferenceUpdateIntent {
  type: "preference_update";
  preferences: Record<string, string>;
}

export interface HelpIntent {
  type: "help";
}

export interface GreetingIntent {
  type: "greeting";
  message?: string;
}

export interface UnknownIntent {
  type: "unknown";
  raw_message: string;
}

// ── Union Type ──

export type CorporateIntent =
  | BookingIntent
  | FlightSearchIntent
  | PolicyQuestionIntent
  | BookingManagementIntent
  | ApprovalResponseIntent
  | ExpenseQueryIntent
  | PreferenceUpdateIntent
  | HelpIntent
  | GreetingIntent
  | UnknownIntent;

export type CorporateIntentType = CorporateIntent["type"];

// ── Context passed to AI for corporate-aware parsing ──

export interface CorporateAIContext {
  member_name: string;
  member_role: string;
  seniority_level: string;
  department: string | null;
  org_name: string;
  org_plan: string;
  policy_summary: PolicySummary;
  recent_bookings: RecentBookingSummary[];
  preferences: TravelerPreferenceSummary;
  pending_approvals: number;
  conversation_history: ConversationMessage[];
}

export interface PolicySummary {
  domestic_cabin_class: string;
  max_flight_price_domestic: number | null;
  max_flight_price_international: number | null;
  advance_booking_days_min: number;
  preferred_airlines: string[];
  blocked_airlines: string[];
  auto_approve_under: number | null;
  require_approval_over: number;
  per_trip_limit: number | null;
  per_month_limit: number | null;
  policy_mode: "soft" | "hard";
}

export interface RecentBookingSummary {
  booking_id: string;
  origin: string;
  destination: string;
  departure_date: string;
  status: string;
  airline_name: string | null;
  total_amount: number;
  pnr: string | null;
}

export interface TravelerPreferenceSummary {
  preferred_airlines: string[];
  preferred_departure_window: string;
  seat_preference: string;
  meal_preference: string | null;
  frequent_routes: Array<{ origin: string; destination: string; count: number }>;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}
