// ============================================================================
// Phase 3 — Preference Engine Types
// Maps to: user_preferences, onboarding_responses, flight_dna,
//          booking_feedback, failed_intents tables
// ============================================================================

// ── user_preferences JSON field shapes ──────────────────────────────────────

export interface TemporalPrefs {
  /** Preferred departure window per day-of-week */
  departure_windows: Record<string, string>;
  /** Average days booked before departure */
  booking_lead_time_avg: number;
  /** Average trip duration in days */
  preferred_trip_duration_days: number;
}

export interface AirlinePref {
  code: string;
  name: string;
  score: number; // 0.0–1.0
}

export interface AvoidedAirline {
  code: string;
  reason: string;
}

export interface AirlinePrefs {
  preferred: AirlinePref[];
  avoided: AvoidedAirline[];
  loyalty_programs: string[]; // airline codes
}

export interface ComfortPrefs {
  seat_type: "window" | "middle" | "aisle" | "no_preference";
  cabin_class: "economy" | "premium_economy" | "business" | "first";
  meal_preference: string;
  baggage: "cabin_only" | "15kg" | "25kg" | "no_preference";
  wifi_important: boolean;
}

export interface PriceSensitivity {
  /** 0.0 = always cheapest, 1.0 = ignores price */
  sensitivity_score: number;
  premium_willingness: boolean;
  /** Anchor prices per route in INR: { "BLR-DEL": 5000 } */
  price_anchors: Record<string, number>;
}

export interface ContextPatterns {
  primary_mode: "business" | "leisure" | "mixed";
  day_patterns: Record<string, "business" | "leisure">;
  seasonal_patterns: Record<string, string>;
}

export interface ConfidenceScores {
  temporal: number;
  airline: number;
  comfort: number;
  price: number;
  context: number;
  overall: number;
}

// ── user_preferences row ────────────────────────────────────────────────────

export interface UserPreferencesRow {
  id: string;
  user_id: string;
  temporal_prefs: TemporalPrefs;
  airline_prefs: AirlinePrefs;
  comfort_prefs: ComfortPrefs;
  price_sensitivity: PriceSensitivity;
  context_patterns: ContextPatterns;
  confidence_scores: ConfidenceScores;
  total_bookings: number;
  last_booking_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Default values for new users ────────────────────────────────────────────

export const DEFAULT_TEMPORAL_PREFS: TemporalPrefs = {
  departure_windows: {},
  booking_lead_time_avg: 7,
  preferred_trip_duration_days: 3,
};

export const DEFAULT_AIRLINE_PREFS: AirlinePrefs = {
  preferred: [],
  avoided: [],
  loyalty_programs: [],
};

export const DEFAULT_COMFORT_PREFS: ComfortPrefs = {
  seat_type: "no_preference",
  cabin_class: "economy",
  meal_preference: "no_preference",
  baggage: "cabin_only",
  wifi_important: false,
};

export const DEFAULT_PRICE_SENSITIVITY: PriceSensitivity = {
  sensitivity_score: 0.5,
  premium_willingness: false,
  price_anchors: {},
};

export const DEFAULT_CONTEXT_PATTERNS: ContextPatterns = {
  primary_mode: "mixed",
  day_patterns: {},
  seasonal_patterns: {},
};

export const DEFAULT_CONFIDENCE_SCORES: ConfidenceScores = {
  temporal: 0.0,
  airline: 0.0,
  comfort: 0.0,
  price: 0.0,
  context: 0.0,
  overall: 0.0,
};

// ── onboarding_responses row ────────────────────────────────────────────────

export type OnboardingQuestionKey =
  | "time_vs_price"       // Q1: earliest flight or cheapest?
  | "airline_loyalty"     // Q2: go-to airline or open?
  | "frequency"           // Q3: how often do you fly?
  | "seat_pref"           // Q4: aisle, window, or don't care?
  | "baggage";            // Q5: usually check a bag?

export interface OnboardingResponseRow {
  id: string;
  user_id: string;
  question_key: OnboardingQuestionKey;
  response: unknown; // flexible JSON
  created_at: string;
}

// ── flight_dna row ──────────────────────────────────────────────────────────

export interface FlightDNARow {
  id: string;
  airline_code: string;
  route: string;
  flight_number: string | null;
  aircraft_type: string | null;
  seat_pitch: number | null;       // inches
  wifi: boolean;
  ontime_pct: number | null;       // 0.0–100.0
  food_rating: number | null;      // 1.0–5.0
  power_outlets: boolean;
  entertainment: string | null;    // 'personal_screen' | 'streaming' | 'none'
  baggage_included: string | null; // 'cabin_only' | '15kg' | '25kg'
  notes: string | null;
  updated_at: string;
}

// ── booking_feedback row ────────────────────────────────────────────────────

export type FeedbackSignalType =
  | "accepted_recommendation"
  | "rejected_recommendation"
  | "chose_different_airline"
  | "chose_different_time"
  | "price_objection"
  | "positive_experience"
  | "negative_experience";

export interface BookingFeedbackRow {
  id: string;
  order_id: string | null;
  user_id: string;
  signal_type: FeedbackSignalType;
  signal_value: Record<string, unknown>;
  created_at: string;
}

// ── failed_intents row ──────────────────────────────────────────────────────

export type FailureReason =
  | "no_flights"
  | "unsupported_route"
  | "parse_error"
  | "supplier_error"
  | "payment_failed"
  | "unknown";

export interface FailedIntentRow {
  id: string;
  user_id: string | null;
  raw_input: string;
  parsed_intent: Record<string, unknown> | null;
  failure_reason: FailureReason;
  created_at: string;
}
