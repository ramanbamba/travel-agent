// ============================================================================
// Phase 3 — Preference Scoring Function
// Scores Duffel/supply offers against user preference vector + Flight DNA
//
// PRD weights:
//   Time match:    30%  (0–30 points)
//   Airline match: 25%  (0–25 points)
//   Price range:   20%  (0–20 points)
//   Stops:         15%  (0–15 points)
//   Amenity match: 10%  (0–10 points)  — from Flight DNA
//
// Returns ranked results with confidence %.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { FlightOffer } from "@/lib/supply/types";
import type {
  UserPreferencesRow,
  TemporalPrefs,
  AirlinePrefs,
  ComfortPrefs,
  PriceSensitivity,
  ContextPatterns,
  ConfidenceScores,
  FlightDNARow,
} from "@/types/preferences";
import {
  DEFAULT_TEMPORAL_PREFS,
  DEFAULT_AIRLINE_PREFS,
  DEFAULT_COMFORT_PREFS,
  DEFAULT_PRICE_SENSITIVITY,
  DEFAULT_CONTEXT_PATTERNS,
  DEFAULT_CONFIDENCE_SCORES,
} from "@/types/preferences";

// ── Score breakdown & result types ──────────────────────────────────────────

export interface P3ScoreBreakdown {
  time: number;       // 0–30
  airline: number;    // 0–25
  price: number;      // 0–20
  stops: number;      // 0–15
  amenity: number;    // 0–10
}

export interface P3OfferScore {
  /** Total score 0–100 */
  score: number;
  /** Confidence in the score (0.0–1.0) based on how much data we have */
  confidence: number;
  breakdown: P3ScoreBreakdown;
  /** Human-readable explanation of why this was recommended */
  reasons: string[];
}

export interface ScoredOffer {
  offer: FlightOffer;
  score: P3OfferScore;
  priceInsight: string | null;
  /** Flight DNA enrichment (if available) */
  dna: FlightDNARow | null;
}

export interface P3Recommendation {
  /** How many total offers were scored */
  totalScored: number;
  /** Top recommendations (count depends on familiarity) */
  offers: ScoredOffer[];
  /** Overall confidence in the recommendation set */
  confidence: number;
  /** Personalized commentary */
  commentary: string | null;
}

// ── Time window helpers ─────────────────────────────────────────────────────

type TimeWindow =
  | "early_morning"    // 05–08
  | "morning"          // 08–11
  | "afternoon"        // 12–16
  | "evening"          // 16–20
  | "late_evening";    // 20–23

const TIME_WINDOWS: { window: TimeWindow; start: number; end: number }[] = [
  { window: "early_morning", start: 5, end: 8 },
  { window: "morning", start: 8, end: 12 },
  { window: "afternoon", start: 12, end: 16 },
  { window: "evening", start: 16, end: 20 },
  { window: "late_evening", start: 20, end: 24 },
];

const DAY_NAMES = [
  "sunday", "monday", "tuesday", "wednesday",
  "thursday", "friday", "saturday",
];

function getTimeWindow(hour: number): TimeWindow {
  for (const tw of TIME_WINDOWS) {
    if (hour >= tw.start && hour < tw.end) return tw.window;
  }
  return hour < 5 ? "late_evening" : "early_morning";
}

function windowDistance(a: TimeWindow, b: TimeWindow): number {
  const idxA = TIME_WINDOWS.findIndex((tw) => tw.window === a);
  const idxB = TIME_WINDOWS.findIndex((tw) => tw.window === b);
  if (idxA === -1 || idxB === -1) return 3;
  return Math.abs(idxA - idxB);
}

// ── Core scoring function ───────────────────────────────────────────────────

/**
 * Score a single offer against user preferences + optional Flight DNA.
 * Returns 0–100 score with breakdown.
 */
export function scoreOffer(
  offer: FlightOffer,
  prefs: {
    temporal: TemporalPrefs;
    airline: AirlinePrefs;
    comfort: ComfortPrefs;
    priceSensitivity: PriceSensitivity;
    confidence: ConfidenceScores;
  },
  dna: FlightDNARow | null,
  route: string
): P3OfferScore {
  const reasons: string[] = [];

  // ── 1. Time match (30 points) ───────────────────────────────────────────

  let timeScore = 15; // neutral default
  const firstSeg = offer.segments[0];
  if (firstSeg?.departure?.time) {
    const depDate = new Date(firstSeg.departure.time);
    const hour = depDate.getHours();
    const offerWindow = getTimeWindow(hour);
    const dayName = DAY_NAMES[depDate.getDay()];

    const prefWindow = prefs.temporal.departure_windows[dayName];
    if (prefWindow) {
      const dist = windowDistance(offerWindow, prefWindow as TimeWindow);
      if (dist === 0) {
        timeScore = 30;
        reasons.push(`Departs in your preferred ${offerWindow.replace("_", " ")} window`);
      } else if (dist === 1) {
        timeScore = 22;
      } else if (dist === 2) {
        timeScore = 10;
      } else {
        timeScore = 5;
      }
    } else {
      // No preference data — neutral
      timeScore = 15;
    }
  }

  // ── 2. Airline match (25 points) ────────────────────────────────────────

  let airlineScore = 8; // neutral default
  const offerAirline = firstSeg?.airlineCode;
  if (offerAirline && prefs.airline.preferred.length > 0) {
    const match = prefs.airline.preferred.find((a) => a.code === offerAirline);
    if (match) {
      const rank = prefs.airline.preferred.indexOf(match);
      if (rank === 0) {
        airlineScore = 25;
        reasons.push(`Your preferred airline: ${match.name}`);
      } else if (rank === 1) {
        airlineScore = 18;
        reasons.push(`Frequent airline: ${match.name}`);
      } else {
        airlineScore = 12;
      }
    }
    // Check avoided airlines
    const avoided = prefs.airline.avoided.find((a) => a.code === offerAirline);
    if (avoided) {
      airlineScore = 0;
      reasons.push(`Note: you've avoided ${offerAirline} (${avoided.reason})`);
    }
  }

  // ── 3. Price range (20 points) ──────────────────────────────────────────

  let priceScore = 10; // neutral default
  const routeAnchor = prefs.priceSensitivity.price_anchors[route];
  if (routeAnchor && routeAnchor > 0) {
    const ratio = offer.price.total / routeAnchor;
    if (ratio <= 0.85) {
      priceScore = 20;
      reasons.push("Below your usual price — great deal");
    } else if (ratio <= 1.0) {
      priceScore = 18;
    } else if (ratio <= 1.15) {
      priceScore = 14;
    } else if (ratio <= 1.3) {
      priceScore = 8;
    } else {
      priceScore = 3;
      reasons.push("Above your usual price range");
    }

    // Adjust by sensitivity: low sensitivity_score → cares more about price
    const sens = prefs.priceSensitivity.sensitivity_score;
    // sens 0.0 = always cheapest → amplify price score
    // sens 1.0 = ignores price → dampen price score toward neutral
    priceScore = Math.round(priceScore * (1 - sens * 0.4) + 10 * (sens * 0.4));
  }

  // ── 4. Stops (15 points) ────────────────────────────────────────────────

  let stopsScore: number;
  if (offer.stops === 0) {
    stopsScore = 15;
    if (timeScore >= 22 && airlineScore >= 18) {
      reasons.push("Non-stop flight");
    }
  } else if (offer.stops === 1) {
    stopsScore = 7;
  } else {
    stopsScore = 0;
    reasons.push(`${offer.stops} stops — longer travel time`);
  }

  // ── 5. Amenity match (10 points) — from Flight DNA ──────────────────────

  let amenityScore = 5; // neutral default when no DNA
  if (dna) {
    let aPts = 0;
    let factors = 0;

    // Wi-Fi match
    if (prefs.comfort.wifi_important && dna.wifi) {
      aPts += 3;
      reasons.push("Wi-Fi available");
    } else if (prefs.comfort.wifi_important && !dna.wifi) {
      aPts += 0;
    } else {
      aPts += 1; // neutral
    }
    factors++;

    // On-time performance
    if (dna.ontime_pct != null) {
      if (dna.ontime_pct >= 90) {
        aPts += 3;
        reasons.push(`${dna.ontime_pct.toFixed(0)}% on-time`);
      } else if (dna.ontime_pct >= 80) {
        aPts += 2;
        reasons.push(`${dna.ontime_pct.toFixed(0)}% on-time`);
      } else if (dna.ontime_pct >= 70) {
        aPts += 1;
      } else {
        aPts += 0;
      }
      factors++;
    }

    // Seat pitch
    if (dna.seat_pitch != null) {
      if (dna.seat_pitch >= 32) {
        aPts += 2;
        reasons.push(`${dna.seat_pitch}" seat pitch`);
      } else if (dna.seat_pitch >= 30) {
        aPts += 1;
      } else {
        aPts += 0;
      }
      factors++;
    }

    // Power outlets
    if (dna.power_outlets) {
      aPts += 1;
      reasons.push("Power outlets");
    }
    factors++;

    // Food rating
    if (dna.food_rating != null && dna.food_rating >= 4.0) {
      aPts += 1;
    }
    factors++;

    // Normalize: max possible is 10 (3+3+2+1+1)
    amenityScore = Math.min(10, aPts);
  }

  // ── Total & confidence ──────────────────────────────────────────────────

  const totalScore = Math.min(100, timeScore + airlineScore + priceScore + stopsScore + amenityScore);

  // Confidence: weighted average of category confidences
  // Weight by the same proportions as scoring
  const conf = prefs.confidence;
  const confidence = Math.min(1.0,
    conf.temporal * 0.30 +
    conf.airline * 0.25 +
    conf.price * 0.20 +
    conf.comfort * 0.15 + // stops don't have a confidence dimension; use comfort
    conf.comfort * 0.10   // amenity confidence tracks with comfort
  );

  return {
    score: totalScore,
    confidence: Math.round(confidence * 100) / 100,
    breakdown: {
      time: timeScore,
      airline: airlineScore,
      price: priceScore,
      stops: stopsScore,
      amenity: amenityScore,
    },
    reasons: reasons.slice(0, 4), // max 4 reasons
  };
}

// ── Price insight (reusable) ────────────────────────────────────────────────

export function generatePriceInsight(
  currentPrice: number,
  currency: string,
  routeAnchor: number | undefined
): string | null {
  if (!routeAnchor || routeAnchor <= 0) return null;

  const symbol = currency === "INR" ? "₹" : "$";
  const diff = currentPrice - routeAnchor;
  const absDiff = Math.abs(Math.round(diff));

  if (diff <= -routeAnchor * 0.15) {
    return `${symbol}${absDiff.toLocaleString()} less than usual — great deal`;
  }
  if (Math.abs(diff) < routeAnchor * 0.05) {
    return "About what you normally pay";
  }
  if (diff > routeAnchor * 0.3) {
    return `${symbol}${absDiff.toLocaleString()} more than usual — prices are high`;
  }
  if (diff > 0) {
    return `${symbol}${absDiff.toLocaleString()} more than your average`;
  }
  return `${symbol}${absDiff.toLocaleString()} below your average`;
}

// ── Booking signal (input for learning) ─────────────────────────────────────

export interface BookingSignal {
  route: string;          // "BLR-DEL"
  airlineCode: string;
  airlineName: string;
  flightNumber: string;
  departureTime: string;  // ISO 8601
  arrivalTime: string;
  dayOfWeek: number;      // 0=Sunday, 6=Saturday
  pricePaid: number;
  currency: string;
  cabinClass: string;
  seatType?: string;      // "aisle" | "window" | "middle"
  bagsAdded?: number;
  daysBeforeDeparture: number;
  wasRecommended?: boolean;  // did user accept the top recommendation?
}

// ── Onboarding seed data ────────────────────────────────────────────────────

export interface OnboardingSeedData {
  /** Chat responses from the 5-question onboarding */
  responses: {
    time_vs_price: string;     // "earliest" | "cheapest" | "balanced"
    airline_loyalty: string;   // "6E" | "AI" | "UK" | "any"
    frequency: string;         // "weekly" | "monthly" | "occasional"
    seat_pref: string;         // "window" | "aisle" | "no_preference"
    baggage: string;           // "always" | "sometimes" | "cabin_only"
  };
  /** Loyalty airlines from onboarding step 2 */
  loyaltyAirlines?: Array<{ code: string; name: string }>;
  /** Home airport from profile */
  homeAirport?: string;
}

/** Airline name lookup */
const AIRLINE_NAMES: Record<string, string> = {
  "6E": "IndiGo",
  "AI": "Air India",
  "UK": "Vistara",
  "SG": "SpiceJet",
  "I5": "AirAsia India",
  "QP": "Akasa Air",
};

// ── PreferenceScorer class (DB-backed) ──────────────────────────────────────

export class PreferenceScorer {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Fetch the Phase 3 user_preferences row (or return defaults).
   */
  async getUserPreferences(userId: string): Promise<UserPreferencesRow> {
    const { data } = await this.supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) return data as UserPreferencesRow;

    // Return defaults (don't create row until onboarding completes)
    return {
      id: "",
      user_id: userId,
      temporal_prefs: DEFAULT_TEMPORAL_PREFS,
      airline_prefs: DEFAULT_AIRLINE_PREFS,
      comfort_prefs: DEFAULT_COMFORT_PREFS,
      price_sensitivity: DEFAULT_PRICE_SENSITIVITY,
      context_patterns: DEFAULT_CONTEXT_PATTERNS,
      confidence_scores: DEFAULT_CONFIDENCE_SCORES,
      total_bookings: 0,
      last_booking_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Fetch Flight DNA entries for a route (e.g. "BLR-DEL").
   * Returns a map keyed by "airlineCode-flightNumber" for easy lookup.
   */
  async getFlightDNA(route: string): Promise<Map<string, FlightDNARow>> {
    const { data } = await this.supabase
      .from("flight_dna")
      .select("*")
      .eq("route", route);

    const map = new Map<string, FlightDNARow>();
    if (!data) return map;

    for (const row of data as FlightDNARow[]) {
      // Index by airline+flight number for specific match
      if (row.flight_number) {
        map.set(`${row.airline_code}-${row.flight_number}`, row);
      }
      // Also index by airline+route for generic match
      const genericKey = `${row.airline_code}-*`;
      if (!map.has(genericKey)) {
        map.set(genericKey, row);
      }
    }

    return map;
  }

  /**
   * Find the best Flight DNA match for an offer.
   */
  private matchDNA(
    offer: FlightOffer,
    dnaMap: Map<string, FlightDNARow>
  ): FlightDNARow | null {
    const seg = offer.segments[0];
    if (!seg) return null;

    // Try specific flight number match first
    const specificKey = `${seg.airlineCode}-${seg.flightNumber}`;
    const specific = dnaMap.get(specificKey);
    if (specific) return specific;

    // Fallback to airline-level match
    const genericKey = `${seg.airlineCode}-*`;
    return dnaMap.get(genericKey) ?? null;
  }

  /**
   * Build a short DNA snippet for commentary
   * e.g. "87% on-time, Wi-Fi available, 32" seat pitch."
   */
  private static buildDNASnippetStatic(dna: FlightDNARow | null): string | null {
    if (!dna) return null;
    const parts: string[] = [];
    if (dna.ontime_pct != null && dna.ontime_pct >= 75) {
      parts.push(`${dna.ontime_pct.toFixed(0)}% on-time`);
    }
    if (dna.wifi) parts.push("Wi-Fi available");
    if (dna.seat_pitch != null && dna.seat_pitch >= 31) {
      parts.push(`${dna.seat_pitch}" seat pitch`);
    }
    if (dna.power_outlets) parts.push("power outlets");
    return parts.length > 0 ? parts.join(", ") + "." : null;
  }

  /**
   * Score and rank a set of flight offers for a user.
   * Main entry point for P3-02.
   */
  async scoreOffers(
    userId: string,
    route: string,
    offers: FlightOffer[]
  ): Promise<P3Recommendation> {
    const [userPrefs, dnaMap] = await Promise.all([
      this.getUserPreferences(userId),
      this.getFlightDNA(route),
    ]);

    const prefInput = {
      temporal: userPrefs.temporal_prefs ?? DEFAULT_TEMPORAL_PREFS,
      airline: userPrefs.airline_prefs ?? DEFAULT_AIRLINE_PREFS,
      comfort: userPrefs.comfort_prefs ?? DEFAULT_COMFORT_PREFS,
      priceSensitivity: userPrefs.price_sensitivity ?? DEFAULT_PRICE_SENSITIVITY,
      confidence: userPrefs.confidence_scores ?? DEFAULT_CONFIDENCE_SCORES,
    };

    const routeAnchor = prefInput.priceSensitivity.price_anchors[route];

    const scored: ScoredOffer[] = offers.map((offer) => {
      const dna = this.matchDNA(offer, dnaMap);
      const score = scoreOffer(offer, prefInput, dna, route);
      const priceInsight = generatePriceInsight(
        offer.price.total,
        offer.price.currency,
        routeAnchor
      );

      return { offer, score, priceInsight, dna };
    });

    // Sort by score descending, then by price ascending as tiebreaker
    scored.sort((a, b) => {
      if (b.score.score !== a.score.score) return b.score.score - a.score.score;
      return a.offer.price.total - b.offer.price.total;
    });

    // Overall confidence = average of individual scores' confidence
    const avgConfidence =
      scored.length > 0
        ? scored.reduce((sum, s) => sum + s.score.confidence, 0) / scored.length
        : 0;

    // Determine how many to return based on bookings (familiarity proxy)
    const bookings = userPrefs.total_bookings;
    let topCount: number;
    let commentary: string | null = null;

    if (bookings >= 6) {
      // Autopilot: show 1 top pick
      topCount = 1;
      const top = scored[0];
      if (top) {
        const dnaSnippets = PreferenceScorer.buildDNASnippetStatic(top.dna);
        commentary = `Based on ${bookings} bookings, this is your perfect match.${dnaSnippets ? ` ${dnaSnippets}` : ""}`;
      }
    } else if (bookings >= 3) {
      // Learning: show top 3
      topCount = 3;
      const top = scored[0];
      if (top) {
        const dnaSnippets = PreferenceScorer.buildDNASnippetStatic(top.dna);
        commentary = `Getting to know your preferences — here's my top pick.${dnaSnippets ? ` ${dnaSnippets}` : ""}`;
      }
    } else {
      // Discovery: show top 5
      topCount = 5;
      commentary = null;
    }

    return {
      totalScored: scored.length,
      offers: scored.slice(0, topCount),
      confidence: Math.round(avgConfidence * 100) / 100,
      commentary,
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // P3-05: Seed preferences from onboarding responses
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Generate initial preference vector from the 5-question onboarding.
   * Maps answers to weighted fields + sets initial confidence scores.
   *
   * PRD §5.3 mappings:
   *   Q1 time_vs_price: "earliest" → sensitivity 0.8, "cheapest" → 0.1
   *   Q2 airline_loyalty: specific code → preferred airline with score 0.4
   *   Q3 frequency: "weekly" → business context, short lead time
   *   Q4 seat_pref: directly maps to comfort_prefs.seat_type
   *   Q5 baggage: "always" → 15kg, "cabin_only" → cabin_only
   *
   * Confidence scores from onboarding (PRD §5.2):
   *   temporal: 0.3, airline: 0.4 (if specific) or 0.2, comfort: 0.5,
   *   price: 0.3, context: 0.2, overall: weighted avg
   */
  async seedFromOnboarding(
    userId: string,
    seed: OnboardingSeedData
  ): Promise<void> {
    const r = seed.responses;

    // ── 1. Temporal prefs ─────────────────────────────────────────────────

    const temporal: TemporalPrefs = { ...DEFAULT_TEMPORAL_PREFS };

    // Frequency → booking lead time estimate
    if (r.frequency === "weekly") {
      temporal.booking_lead_time_avg = 5;
      temporal.preferred_trip_duration_days = 2;
    } else if (r.frequency === "monthly") {
      temporal.booking_lead_time_avg = 9;
      temporal.preferred_trip_duration_days = 4;
    } else {
      temporal.booking_lead_time_avg = 21;
      temporal.preferred_trip_duration_days = 7;
    }

    // ── 2. Airline prefs ──────────────────────────────────────────────────

    const airline: AirlinePrefs = {
      preferred: [],
      avoided: [],
      loyalty_programs: [],
    };

    // From Q2: specific airline preference
    if (r.airline_loyalty && r.airline_loyalty !== "any") {
      const code = r.airline_loyalty;
      const name = AIRLINE_NAMES[code] ?? code;
      airline.preferred.push({ code, name, score: 0.4 });
    }

    // From loyalty programs (onboarding step 2)
    if (seed.loyaltyAirlines && seed.loyaltyAirlines.length > 0) {
      for (const la of seed.loyaltyAirlines) {
        airline.loyalty_programs.push(la.code);

        // Add to preferred if not already there
        const existing = airline.preferred.find((a) => a.code === la.code);
        if (existing) {
          // Boost if both Q2 and loyalty match
          existing.score = Math.min(1.0, existing.score + 0.15);
        } else {
          airline.preferred.push({
            code: la.code,
            name: la.name,
            score: 0.3, // Loyalty alone = smaller seed
          });
        }
      }
    }

    // Sort by score
    airline.preferred.sort((a, b) => b.score - a.score);

    // ── 3. Comfort prefs ──────────────────────────────────────────────────

    const comfort: ComfortPrefs = { ...DEFAULT_COMFORT_PREFS };

    // Q4: seat preference
    if (r.seat_pref === "window") comfort.seat_type = "window";
    else if (r.seat_pref === "aisle") comfort.seat_type = "aisle";
    else comfort.seat_type = "no_preference";

    // Q5: baggage
    if (r.baggage === "always") comfort.baggage = "15kg";
    else if (r.baggage === "cabin_only") comfort.baggage = "cabin_only";
    else comfort.baggage = "no_preference";

    // Infer from frequency: weekly flyers care about Wi-Fi
    if (r.frequency === "weekly") comfort.wifi_important = true;

    // ── 4. Price sensitivity ──────────────────────────────────────────────

    const priceSens: PriceSensitivity = { ...DEFAULT_PRICE_SENSITIVITY };

    // Q1: time vs price (most predictive dimension per PRD)
    if (r.time_vs_price === "earliest") {
      priceSens.sensitivity_score = 0.8; // Ignores price, values time
      priceSens.premium_willingness = true;
    } else if (r.time_vs_price === "cheapest") {
      priceSens.sensitivity_score = 0.1; // Very price-sensitive
      priceSens.premium_willingness = false;
    } else {
      priceSens.sensitivity_score = 0.5; // Balanced
      priceSens.premium_willingness = false;
    }

    // ── 5. Context patterns ───────────────────────────────────────────────

    const context: ContextPatterns = { ...DEFAULT_CONTEXT_PATTERNS };

    // Infer from frequency
    if (r.frequency === "weekly") {
      context.primary_mode = "business";
    } else if (r.frequency === "occasional") {
      context.primary_mode = "leisure";
    } else {
      context.primary_mode = "mixed";
    }

    // ── 6. Confidence scores ──────────────────────────────────────────────

    const hasSpecificAirline = r.airline_loyalty !== "any";
    const confidence: ConfidenceScores = {
      temporal: 0.3,  // From onboarding Q3 (frequency)
      airline: hasSpecificAirline ? 0.4 : 0.2,
      comfort: 0.5,   // From onboarding Q4 + Q5
      price: 0.3,     // From onboarding Q1
      context: 0.2,   // Inferred from frequency
      overall: 0,     // Computed below
    };
    confidence.overall = clamp01(
      confidence.temporal * 0.30 +
      confidence.airline * 0.25 +
      confidence.price * 0.20 +
      confidence.comfort * 0.15 +
      confidence.context * 0.10
    );

    // ── 7. Upsert to user_preferences ─────────────────────────────────────

    const { error } = await this.supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: userId,
          temporal_prefs: temporal,
          airline_prefs: airline,
          comfort_prefs: comfort,
          price_sensitivity: priceSens,
          context_patterns: context,
          confidence_scores: confidence,
          total_bookings: 0,
          last_booking_at: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error(
        "[PreferenceScorer] seedFromOnboarding upsert failed:",
        error.message
      );
      throw error;
    }

    console.log(
      `[PreferenceScorer] Seeded Phase 3 preferences for ${userId}: ` +
      `price_sens=${priceSens.sensitivity_score}, ` +
      `airline=${airline.preferred[0]?.code ?? "none"}, ` +
      `seat=${comfort.seat_type}, ` +
      `context=${context.primary_mode}, ` +
      `confidence=${(confidence.overall * 100).toFixed(0)}%`
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // P3-03: Preference Update Logic — learn from each booking
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Update the Phase 3 user_preferences after a booking.
   * Updates each JSON field and increments confidence scores.
   *
   * Confidence growth curves (from PRD §5.2):
   *   temporal:  0.3 → 0.6 (3 bookings) → 0.9 (10 bookings)
   *   airline:   0.4 initial → 0.8 (5 same-airline bookings)
   *   comfort:   0.5 from onboarding, +0.1 per consistent choice
   *   price:     emerges after 3+ bookings on same route
   *   context:   0.3 after 5 bookings
   *   overall:   weighted average
   */
  async learnFromBooking(userId: string, signal: BookingSignal): Promise<void> {
    const current = await this.getUserPreferences(userId);

    const newTotalBookings = current.total_bookings + 1;

    // ── 1. Update temporal_prefs ──────────────────────────────────────────

    const temporal = { ...DEFAULT_TEMPORAL_PREFS, ...current.temporal_prefs };
    const depDate = new Date(signal.departureTime);
    const depHour = depDate.getHours();
    const depWindow = getTimeWindow(depHour);
    const dayName = DAY_NAMES[signal.dayOfWeek];

    // Update departure window for this day-of-week (mode-like: new data wins)
    temporal.departure_windows = {
      ...temporal.departure_windows,
      [dayName]: depWindow,
    };

    // Rolling average of booking lead time
    temporal.booking_lead_time_avg = rollingAvg(
      temporal.booking_lead_time_avg,
      signal.daysBeforeDeparture,
      newTotalBookings
    );

    // ── 2. Update airline_prefs ───────────────────────────────────────────

    const airline: AirlinePrefs = {
      preferred: [...(current.airline_prefs?.preferred ?? [])],
      avoided: [...(current.airline_prefs?.avoided ?? [])],
      loyalty_programs: [...(current.airline_prefs?.loyalty_programs ?? [])],
    };

    const existingIdx = airline.preferred.findIndex(
      (a) => a.code === signal.airlineCode
    );
    if (existingIdx >= 0) {
      // Boost score (max 1.0), with diminishing returns
      const old = airline.preferred[existingIdx];
      airline.preferred[existingIdx] = {
        ...old,
        score: Math.min(1.0, old.score + 0.1 * (1 - old.score)),
      };
    } else {
      // New airline — add with starter score
      airline.preferred.push({
        code: signal.airlineCode,
        name: signal.airlineName,
        score: 0.3,
      });
    }

    // Decay other airlines slightly (recency weighting)
    for (let i = 0; i < airline.preferred.length; i++) {
      if (airline.preferred[i].code !== signal.airlineCode) {
        airline.preferred[i] = {
          ...airline.preferred[i],
          score: Math.max(0.05, airline.preferred[i].score * 0.95),
        };
      }
    }

    // Sort by score descending
    airline.preferred.sort((a, b) => b.score - a.score);

    // ── 3. Update comfort_prefs ───────────────────────────────────────────

    const comfort: ComfortPrefs = {
      ...DEFAULT_COMFORT_PREFS,
      ...current.comfort_prefs,
    };

    // Update seat type if provided
    if (signal.seatType && signal.seatType !== "no_preference") {
      comfort.seat_type = signal.seatType as ComfortPrefs["seat_type"];
    }

    // Update cabin class
    if (signal.cabinClass) {
      comfort.cabin_class = signal.cabinClass as ComfortPrefs["cabin_class"];
    }

    // Update baggage preference
    if (signal.bagsAdded != null) {
      comfort.baggage = signal.bagsAdded > 0 ? "15kg" : "cabin_only";
    }

    // ── 4. Update price_sensitivity ───────────────────────────────────────

    const priceSens: PriceSensitivity = {
      ...DEFAULT_PRICE_SENSITIVITY,
      ...current.price_sensitivity,
      price_anchors: { ...(current.price_sensitivity?.price_anchors ?? {}) },
    };

    // Update route price anchor (exponential moving average)
    const currentAnchor = priceSens.price_anchors[signal.route];
    if (currentAnchor && currentAnchor > 0) {
      // EMA with alpha = 0.3 (recent prices weighted more)
      priceSens.price_anchors[signal.route] = Math.round(
        currentAnchor * 0.7 + signal.pricePaid * 0.3
      );
    } else {
      priceSens.price_anchors[signal.route] = signal.pricePaid;
    }

    // Update sensitivity score based on price variance behavior
    // If booking higher-than-anchor → less price-sensitive
    // If booking lower-than-anchor → more price-sensitive
    if (currentAnchor && currentAnchor > 0) {
      const ratio = signal.pricePaid / currentAnchor;
      if (ratio > 1.1) {
        // Paid more than usual → less sensitive
        priceSens.sensitivity_score = Math.min(
          1.0,
          priceSens.sensitivity_score + 0.05
        );
      } else if (ratio < 0.9) {
        // Paid less → more sensitive
        priceSens.sensitivity_score = Math.max(
          0.0,
          priceSens.sensitivity_score - 0.05
        );
      }
    }

    // Premium willingness from cabin class
    if (signal.cabinClass === "business" || signal.cabinClass === "first") {
      priceSens.premium_willingness = true;
    }

    // ── 5. Update context_patterns ────────────────────────────────────────

    const context: ContextPatterns = {
      ...DEFAULT_CONTEXT_PATTERNS,
      ...current.context_patterns,
      day_patterns: { ...(current.context_patterns?.day_patterns ?? {}) },
    };

    // Infer business vs leisure from signals
    const isLikelyBusiness =
      signal.daysBeforeDeparture < 14 &&
      signal.dayOfWeek >= 1 &&
      signal.dayOfWeek <= 5; // weekday
    const isLikelyLeisure =
      signal.daysBeforeDeparture > 30 ||
      signal.dayOfWeek === 0 ||
      signal.dayOfWeek === 6;

    const mode = isLikelyBusiness
      ? "business"
      : isLikelyLeisure
        ? "leisure"
        : context.day_patterns[dayName] ?? "mixed";

    context.day_patterns[dayName] = mode as "business" | "leisure";

    // Update primary mode based on majority of day patterns
    const modeValues = Object.values(context.day_patterns);
    const bizCount = modeValues.filter((m) => m === "business").length;
    const leisCount = modeValues.filter((m) => m === "leisure").length;
    if (bizCount > leisCount + 1) context.primary_mode = "business";
    else if (leisCount > bizCount + 1) context.primary_mode = "leisure";
    else context.primary_mode = "mixed";

    // ── 6. Compute confidence scores ──────────────────────────────────────

    const n = newTotalBookings;
    const confidence: ConfidenceScores = { ...DEFAULT_CONFIDENCE_SCORES };

    // Temporal: 0.3 base → 0.6 at 3 bookings → 0.9 at 10
    // Formula: 0.3 + 0.6 * (1 - e^(-0.25 * n))
    confidence.temporal = clamp01(0.3 + 0.6 * (1 - Math.exp(-0.25 * n)));

    // Airline: grows with consistent same-airline usage
    const topAirline = airline.preferred[0];
    const topAirlineScore = topAirline?.score ?? 0;
    // 0.4 base when have any data, scales with top airline's score
    confidence.airline = clamp01(
      n > 0 ? 0.3 + topAirlineScore * 0.5 : 0.0
    );

    // Comfort: 0.5 from onboarding (if done), +0.05 per booking (consistent choices)
    const onboardingBase = current.confidence_scores?.comfort >= 0.4 ? 0.4 : 0.2;
    confidence.comfort = clamp01(onboardingBase + n * 0.05);

    // Price: emerges after 3+ bookings (needs route price history)
    const routeCount = Object.keys(priceSens.price_anchors).length;
    confidence.price = clamp01(
      routeCount >= 3 ? 0.5 + n * 0.03 : routeCount * 0.15 + n * 0.02
    );

    // Context: 0.3 after 5 bookings
    confidence.context = clamp01(n >= 5 ? 0.3 + (n - 5) * 0.05 : n * 0.06);

    // Overall: weighted average matching scoring weights
    confidence.overall = clamp01(
      confidence.temporal * 0.30 +
      confidence.airline * 0.25 +
      confidence.price * 0.20 +
      confidence.comfort * 0.15 +
      confidence.context * 0.10
    );

    // ── 7. Upsert to user_preferences ─────────────────────────────────────

    const { error } = await this.supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: userId,
          temporal_prefs: temporal,
          airline_prefs: airline,
          comfort_prefs: comfort,
          price_sensitivity: priceSens,
          context_patterns: context,
          confidence_scores: confidence,
          total_bookings: newTotalBookings,
          last_booking_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("[PreferenceScorer] user_preferences upsert failed:", error.message);
      return;
    }

    // ── 8. Record booking feedback signal ─────────────────────────────────

    const signalType = signal.wasRecommended
      ? "accepted_recommendation"
      : "chose_different_airline";

    this.supabase
      .from("booking_feedback")
      .insert({
        user_id: userId,
        signal_type: signalType,
        signal_value: {
          route: signal.route,
          airline: signal.airlineCode,
          price: signal.pricePaid,
          currency: signal.currency,
        },
      })
      .then(() => {});

    console.log(
      `[PreferenceScorer] Updated preferences for ${userId}: ` +
      `bookings=${newTotalBookings}, confidence=${(confidence.overall * 100).toFixed(0)}%, ` +
      `top_airline=${airline.preferred[0]?.code ?? "none"}`
    );
  }
}

// ── Utility helpers ─────────────────────────────────────────────────────────

/** Clamp a value between 0 and 1, rounded to 2 decimals. */
function clamp01(v: number): number {
  return Math.round(Math.min(1.0, Math.max(0.0, v)) * 100) / 100;
}

/** Rolling average: incorporate a new value into an existing average. */
function rollingAvg(current: number, newValue: number, n: number): number {
  if (n <= 1) return newValue;
  // Exponential moving average with decreasing alpha
  const alpha = Math.max(0.1, 1 / n);
  return Math.round((current * (1 - alpha) + newValue * alpha) * 10) / 10;
}
