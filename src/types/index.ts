export * from "./flights";
export * from "./chat";
export * from "./preferences";
export * from "./organization";

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  message: string;
}

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  passport_vault_id: string | null;
  ktn_vault_id: string | null;
  redress_number: string | null;
  preferred_cabin: "economy" | "premium_economy" | "business" | "first";
  seat_preference: "window" | "middle" | "aisle" | "no_preference";
  meal_preference:
    | "standard"
    | "vegetarian"
    | "vegan"
    | "halal"
    | "kosher"
    | "gluten_free"
    | "no_preference";
  home_airport: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyProgram {
  id: string;
  user_id: string;
  airline_code: string;
  airline_name: string;
  program_name: string;
  member_number: string;
  tier: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbFlightSegment {
  id: string;
  booking_id: string;
  segment_order: number;
  airline_code: string;
  flight_number: string;
  departure_airport: string;
  arrival_airport: string;
  departure_time: string;
  arrival_time: string;
  aircraft_type: string | null;
  cabin_class: string;
  seat_number: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DbBooking {
  id: string;
  user_id: string;
  status: string;
  pnr: string | null;
  total_price_cents: number | null;
  currency: string;
  cabin_class: string;
  data_source: string;
  booked_at: string | null;
  cancelled_at: string | null;
  payment_status: string | null;
  stripe_payment_intent_id: string | null;
  payment_method_id: string | null;
  supplier_cost_cents: number | null;
  markup_cents: number | null;
  service_fee_cents: number | null;
  our_revenue_cents: number | null;
  supplier_name: string | null;
  supplier_booking_id: string | null;
  supplier_offer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingWithSegments extends DbBooking {
  flight_segments: DbFlightSegment[];
  payment_methods: { card_brand: string; card_last_four: string } | null;
}

export interface PaymentMethod {
  id: string;
  stripe_payment_method_id: string;
  card_brand: string;
  card_last_four: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
  created_at: string;
}
