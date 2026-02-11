export interface FlightSegment {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  departure: {
    airport: string;
    airportCode: string;
    time: string; // ISO 8601
    terminal?: string;
  };
  arrival: {
    airport: string;
    airportCode: string;
    time: string;
    terminal?: string;
  };
  duration: string; // e.g. "7h 30m"
  cabin: "economy" | "premium_economy" | "business" | "first";
  aircraft?: string;
}

export interface FlightOption {
  id: string;
  segments: FlightSegment[];
  totalDuration: string;
  stops: number;
  price: {
    amount: number;
    currency: string;
    serviceFee?: number;
    /** Internal: markup baked into fare (not shown to customer) */
    markup?: number;
  };
  seatsRemaining?: number;
  /** Phase 3: Preference score (0–100) — higher = better match */
  preferenceScore?: number;
  /** Phase 3: Confidence in the score (0.0–1.0) */
  scoreConfidence?: number;
  /** Phase 3: Human-readable reasons for the recommendation */
  scoreReasons?: string[];
  /** Phase 3: Price insight relative to user's history */
  priceInsight?: string | null;
  /** Phase 3: Flight DNA enrichment */
  flightDNA?: {
    ontime_pct?: number;
    wifi?: boolean;
    seat_pitch?: number;
    power_outlets?: boolean;
    food_rating?: number;
  } | null;
}

export interface BookingSummary {
  id: string;
  flight: FlightOption;
  passenger: {
    firstName: string;
    lastName: string;
    email: string;
    seatPreference?: string;
    loyaltyProgram?: string;
    loyaltyNumber?: string;
    passportOnFile?: boolean;
  };
  totalPrice: {
    amount: number;
    currency: string;
    serviceFee?: number;
    markup?: number;
  };
  status: "pending" | "confirmed" | "failed";
}

export interface BookingConfirmation {
  bookingId: string;
  confirmationCode: string;
  flight: FlightOption;
  passenger: {
    firstName: string;
    lastName: string;
    email: string;
  };
  totalPrice: {
    amount: number;
    currency: string;
    serviceFee?: number;
    markup?: number;
  };
  bookedAt: string;
}
