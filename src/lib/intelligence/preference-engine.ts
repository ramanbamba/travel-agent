import type { SupabaseClient } from "@supabase/supabase-js";
import type { FlightOffer } from "@/lib/supply/types";
import { PreferenceScorer } from "./preference-scoring";

// ── Types ───────────────────────────────────────────────────────────────────

export interface AirlinePreference {
  code: string;
  name: string;
  score: number;
}

export interface UserPreferences {
  id: string;
  userId: string;
  homeAirport: string;
  preferredAirlines: AirlinePreference[];
  preferredDepartureWindows: Record<string, string>;
  seatPreference: string;
  cabinClass: string;
  mealPreference: string | null;
  bagPreference: string;
  priceSensitivity: number;
  advanceBookingDaysAvg: number;
  communicationStyle: string;
}

export interface RouteFamiliarityData {
  route: string;
  timesBooked: number;
  lastBookedAt: string | null;
  avgPricePaid: number | null;
  minPricePaid: number | null;
  maxPricePaid: number | null;
  preferredAirlineCode: string | null;
  preferredAirlineName: string | null;
  preferredFlightNumber: string | null;
  preferredDepartureWindow: string | null;
  avgDaysBeforeDeparture: number | null;
  familiarityLevel: "discovery" | "learning" | "autopilot";
}

export interface BookingData {
  route: string; // "BLR-DEL"
  airlineCode: string;
  airlineName: string;
  flightNumber: string;
  departureTime: string; // ISO
  arrivalTime: string;
  dayOfWeek: number;
  pricePaid: number;
  currency: string;
  cabinClass: string;
  seatSelected?: string;
  seatType?: string;
  bagsAdded?: number;
  daysBeforeDeparture: number;
  bookingSource?: string;
  duffelOfferId?: string;
  duffelOrderId?: string;
}

export interface ScoreBreakdown {
  airline: number;
  time: number;
  price: number;
  flight: number;
  seat: number;
}

export interface OfferScore {
  score: number;
  breakdown: ScoreBreakdown;
}

export interface Recommendation {
  familiarityLevel: "discovery" | "learning" | "autopilot";
  offers: Array<{
    offer: FlightOffer;
    score: OfferScore;
    priceInsight: string | null;
  }>;
  commentary: string | null;
}

// ── Time window helpers ─────────────────────────────────────────────────────

type TimeWindow =
  | "early_morning"
  | "morning"
  | "afternoon"
  | "evening"
  | "late_evening";

const TIME_WINDOWS: { window: TimeWindow; start: number; end: number }[] = [
  { window: "early_morning", start: 5, end: 8 },
  { window: "morning", start: 8, end: 11 },
  { window: "afternoon", start: 12, end: 16 },
  { window: "evening", start: 16, end: 20 },
  { window: "late_evening", start: 20, end: 23 },
];

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function getTimeWindow(hour: number): TimeWindow {
  for (const tw of TIME_WINDOWS) {
    if (hour >= tw.start && hour < tw.end) return tw.window;
  }
  return hour < 5 ? "late_evening" : "early_morning";
}

function areAdjacentWindows(a: string, b: string): boolean {
  const idx = TIME_WINDOWS.findIndex((tw) => tw.window === a);
  const jdx = TIME_WINDOWS.findIndex((tw) => tw.window === b);
  return Math.abs(idx - jdx) <= 1;
}

/** Mode of an array (most frequent value) */
function mode<T>(arr: T[]): T | undefined {
  const freq = new Map<string, { val: T; count: number }>();
  for (const v of arr) {
    const key = String(v);
    const entry = freq.get(key);
    if (entry) entry.count++;
    else freq.set(key, { val: v, count: 1 });
  }
  let best: { val: T; count: number } | undefined;
  freq.forEach((entry) => {
    if (!best || entry.count > best.count) best = entry;
  });
  return best?.val;
}

// ── PreferenceEngine ────────────────────────────────────────────────────────

export class PreferenceEngine {
  constructor(private supabase: SupabaseClient) {}

  // ── a) learnFromBooking ─────────────────────────────────────────────────

  async learnFromBooking(userId: string, data: BookingData): Promise<void> {
    const depTime = new Date(data.departureTime);
    const depTimeOnly = `${depTime.getHours().toString().padStart(2, "0")}:${depTime.getMinutes().toString().padStart(2, "0")}:00`;

    const arrTime = new Date(data.arrivalTime);
    const arrTimeOnly = `${arrTime.getHours().toString().padStart(2, "0")}:${arrTime.getMinutes().toString().padStart(2, "0")}:00`;

    // 1. Insert booking pattern
    await this.supabase.from("booking_patterns").insert({
      user_id: userId,
      route: data.route,
      airline_code: data.airlineCode,
      airline_name: data.airlineName,
      flight_number: data.flightNumber,
      departure_time: depTimeOnly,
      arrival_time: arrTimeOnly,
      day_of_week: data.dayOfWeek,
      price_paid: data.pricePaid,
      currency: data.currency,
      cabin_class: data.cabinClass,
      seat_selected: data.seatSelected ?? null,
      seat_type: data.seatType ?? null,
      bags_added: data.bagsAdded ?? 0,
      days_before_departure: data.daysBeforeDeparture,
      booking_source: data.bookingSource ?? "chat",
      duffel_offer_id: data.duffelOfferId ?? null,
      duffel_order_id: data.duffelOrderId ?? null,
    });

    // 2. Update route_familiarity
    await this.updateRouteFamiliarity(userId, data);

    // 3. Update user_travel_preferences (Phase 2 — backward compat)
    await this.updateGlobalPreferences(userId);

    // 4. Update Phase 3 user_preferences (JSON fields + confidence scores)
    const scorer = new PreferenceScorer(this.supabase);
    await scorer.learnFromBooking(userId, {
      route: data.route,
      airlineCode: data.airlineCode,
      airlineName: data.airlineName,
      flightNumber: data.flightNumber,
      departureTime: data.departureTime,
      arrivalTime: data.arrivalTime,
      dayOfWeek: data.dayOfWeek,
      pricePaid: data.pricePaid,
      currency: data.currency,
      cabinClass: data.cabinClass,
      seatType: data.seatType,
      bagsAdded: data.bagsAdded,
      daysBeforeDeparture: data.daysBeforeDeparture,
    });

  }

  private async updateRouteFamiliarity(
    userId: string,
    data: BookingData
  ): Promise<void> {
    // Get all patterns for this route
    const { data: patterns } = await this.supabase
      .from("booking_patterns")
      .select("*")
      .eq("user_id", userId)
      .eq("route", data.route)
      .order("created_at", { ascending: false });

    const allPatterns = patterns ?? [];
    const timesBooked = allPatterns.length;
    const prices = allPatterns.map((p) => parseFloat(p.price_paid));
    const avgPrice = prices.length > 0
      ? prices.reduce((a, b) => a + b, 0) / prices.length
      : null;
    const minPrice = prices.length > 0 ? Math.min(...prices) : null;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

    // Mode of airline codes
    const airlineCodes = allPatterns.map((p) => p.airline_code).filter(Boolean);
    const prefAirlineCode = mode(airlineCodes) ?? null;
    const prefAirlineName =
      allPatterns.find((p) => p.airline_code === prefAirlineCode)
        ?.airline_name ?? null;

    // Mode of flight numbers
    const flightNumbers = allPatterns
      .map((p) => p.flight_number)
      .filter(Boolean);
    const prefFlightNumber = mode(flightNumbers) ?? null;

    // Mode of departure windows
    const depWindows = allPatterns
      .map((p) => {
        if (!p.departure_time) return null;
        const hour = parseInt(p.departure_time.split(":")[0]);
        return getTimeWindow(hour);
      })
      .filter(Boolean) as string[];
    const prefDepWindow = mode(depWindows) ?? null;

    // Average days before departure
    const daysArr = allPatterns
      .map((p) => p.days_before_departure)
      .filter((d): d is number => d != null);
    const avgDays =
      daysArr.length > 0
        ? daysArr.reduce((a, b) => a + b, 0) / daysArr.length
        : null;

    // Familiarity level
    let familiarityLevel: "discovery" | "learning" | "autopilot" = "discovery";
    if (timesBooked >= 6) familiarityLevel = "autopilot";
    else if (timesBooked >= 3) familiarityLevel = "learning";

    // Upsert
    const { error } = await this.supabase
      .from("route_familiarity")
      .upsert(
        {
          user_id: userId,
          route: data.route,
          times_booked: timesBooked,
          last_booked_at: new Date().toISOString(),
          avg_price_paid: avgPrice,
          min_price_paid: minPrice,
          max_price_paid: maxPrice,
          preferred_airline_code: prefAirlineCode,
          preferred_airline_name: prefAirlineName,
          preferred_flight_number: prefFlightNumber,
          preferred_departure_window: prefDepWindow,
          avg_days_before_departure: avgDays,
          familiarity_level: familiarityLevel,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,route" }
      );

    if (error) {
      console.error("[PreferenceEngine] route_familiarity upsert failed:", error.message);
    }
  }

  private async updateGlobalPreferences(userId: string): Promise<void> {
    // Get last 20 booking patterns (recent weighted)
    const { data: patterns } = await this.supabase
      .from("booking_patterns")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    const allPatterns = patterns ?? [];
    if (allPatterns.length === 0) return;

    // Preferred airlines: weighted by recency
    const airlineScores = new Map<
      string,
      { code: string; name: string; total: number; count: number }
    >();
    allPatterns.forEach((p, i) => {
      if (!p.airline_code) return;
      const weight = 1 / (i + 1); // recent = higher weight
      const entry = airlineScores.get(p.airline_code);
      if (entry) {
        entry.total += weight;
        entry.count++;
      } else {
        airlineScores.set(p.airline_code, {
          code: p.airline_code,
          name: p.airline_name ?? p.airline_code,
          total: weight,
          count: 1,
        });
      }
    });
    const maxAirlineScore = Math.max(
      ...Array.from(airlineScores.values()).map((a) => a.total)
    );
    const preferredAirlines: AirlinePreference[] = Array.from(
      airlineScores.values()
    )
      .map((a) => ({
        code: a.code,
        name: a.name,
        score: Math.round((a.total / maxAirlineScore) * 100) / 100,
      }))
      .sort((a, b) => b.score - a.score);

    // Preferred departure windows by day
    const dayWindowMap: Record<string, string[]> = {};
    for (const p of allPatterns) {
      if (!p.departure_time || p.day_of_week == null) continue;
      const hour = parseInt(p.departure_time.split(":")[0]);
      const window = getTimeWindow(hour);
      const dayName = DAY_NAMES[p.day_of_week];
      if (!dayWindowMap[dayName]) dayWindowMap[dayName] = [];
      dayWindowMap[dayName].push(window);
    }
    const preferredDepartureWindows: Record<string, string> = {};
    for (const [day, windows] of Object.entries(dayWindowMap)) {
      const m = mode(windows);
      if (m) preferredDepartureWindows[day] = m;
    }

    // Price sensitivity (0 = cheapest picker, 1 = ignores price)
    // We approximate: if they consistently don't pick cheapest, sensitivity is high
    // For now, use a simple heuristic based on price variance
    const prices = allPatterns.map((p) => parseFloat(p.price_paid)).filter((p) => !isNaN(p));
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const priceSensitivity = avgPrice > 0 && minPrice > 0
      ? Math.min(1, Math.max(0, 1 - minPrice / avgPrice + 0.3))
      : 0.5;

    // Average advance booking days
    const daysArr = allPatterns
      .map((p) => p.days_before_departure)
      .filter((d): d is number => d != null);
    const advanceBookingDaysAvg =
      daysArr.length > 0
        ? daysArr.reduce((a, b) => a + b, 0) / daysArr.length
        : 7;

    // Upsert preferences
    await this.supabase
      .from("user_travel_preferences")
      .upsert(
        {
          user_id: userId,
          preferred_airlines: preferredAirlines,
          preferred_departure_windows: preferredDepartureWindows,
          price_sensitivity: Math.round(priceSensitivity * 100) / 100,
          advance_booking_days_avg: Math.round(advanceBookingDaysAvg * 10) / 10,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
  }

  // ── b) getPreferences ───────────────────────────────────────────────────

  async getPreferences(userId: string): Promise<UserPreferences> {
    const { data } = await this.supabase
      .from("user_travel_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) {
      return this.mapPreferences(data);
    }

    // Create defaults
    const { data: created } = await this.supabase
      .from("user_travel_preferences")
      .insert({ user_id: userId })
      .select("*")
      .single();

    return this.mapPreferences(created ?? { user_id: userId });
  }

  private mapPreferences(row: Record<string, unknown>): UserPreferences {
    return {
      id: (row.id as string) ?? "",
      userId: (row.user_id as string) ?? "",
      homeAirport: (row.home_airport as string) ?? "BLR",
      preferredAirlines: (row.preferred_airlines as AirlinePreference[]) ?? [],
      preferredDepartureWindows:
        (row.preferred_departure_windows as Record<string, string>) ?? {},
      seatPreference: (row.seat_preference as string) ?? "aisle",
      cabinClass: (row.cabin_class as string) ?? "economy",
      mealPreference: (row.meal_preference as string) ?? null,
      bagPreference: (row.bag_preference as string) ?? "cabin_only",
      priceSensitivity: (row.price_sensitivity as number) ?? 0.5,
      advanceBookingDaysAvg: (row.advance_booking_days_avg as number) ?? 7,
      communicationStyle: (row.communication_style as string) ?? "balanced",
    };
  }

  // ── c) getRouteFamiliarity ──────────────────────────────────────────────

  async getRouteFamiliarity(
    userId: string,
    route: string
  ): Promise<RouteFamiliarityData> {
    const { data } = await this.supabase
      .from("route_familiarity")
      .select("*")
      .eq("user_id", userId)
      .eq("route", route)
      .single();

    if (data) {
      return {
        route: data.route,
        timesBooked: data.times_booked ?? 0,
        lastBookedAt: data.last_booked_at,
        avgPricePaid: data.avg_price_paid
          ? parseFloat(data.avg_price_paid)
          : null,
        minPricePaid: data.min_price_paid
          ? parseFloat(data.min_price_paid)
          : null,
        maxPricePaid: data.max_price_paid
          ? parseFloat(data.max_price_paid)
          : null,
        preferredAirlineCode: data.preferred_airline_code,
        preferredAirlineName: data.preferred_airline_name,
        preferredFlightNumber: data.preferred_flight_number,
        preferredDepartureWindow: data.preferred_departure_window,
        avgDaysBeforeDeparture: data.avg_days_before_departure,
        familiarityLevel: data.familiarity_level ?? "discovery",
      };
    }

    // No data yet
    return {
      route,
      timesBooked: 0,
      lastBookedAt: null,
      avgPricePaid: null,
      minPricePaid: null,
      maxPricePaid: null,
      preferredAirlineCode: null,
      preferredAirlineName: null,
      preferredFlightNumber: null,
      preferredDepartureWindow: null,
      avgDaysBeforeDeparture: null,
      familiarityLevel: "discovery",
    };
  }

  // ── d) getRecommendation ────────────────────────────────────────────────

  async getRecommendation(
    userId: string,
    route: string,
    offers: FlightOffer[]
  ): Promise<Recommendation> {
    const prefs = await this.getPreferences(userId);
    const routeData = await this.getRouteFamiliarity(userId, route);

    const scored = offers.map((offer) => ({
      offer,
      score: this.scoreOffer(offer, prefs, routeData),
      priceInsight: this.generatePriceInsight(
        offer.price.total,
        offer.price.currency,
        routeData
      ),
    }));

    // Sort by score descending
    scored.sort((a, b) => b.score.score - a.score.score);

    const level = routeData.familiarityLevel;
    let commentary: string | null = null;

    if (level === "autopilot") {
      const top = scored[0];
      if (top) {
        commentary = `Based on your ${routeData.timesBooked} previous trips, this is your best match.`;
      }
      return {
        familiarityLevel: level,
        offers: scored.slice(0, 1),
        commentary,
      };
    }

    if (level === "learning") {
      const top = scored[0];
      if (top && routeData.preferredAirlineName) {
        commentary = `Based on your last few trips, I'd go with the ${routeData.preferredAirlineName} option.`;
      }
      return {
        familiarityLevel: level,
        offers: scored.slice(0, 3),
        commentary,
      };
    }

    // Discovery
    return {
      familiarityLevel: "discovery",
      offers: scored.slice(0, 5),
      commentary: null,
    };
  }

  // ── e) scoreOffer ───────────────────────────────────────────────────────

  scoreOffer(
    offer: FlightOffer,
    preferences: UserPreferences,
    routeData: RouteFamiliarityData
  ): OfferScore {
    let airlineScore = 5;
    let timeScore = 0;
    let priceScore = 15;
    let flightScore = 0;
    let seatScore = 0;

    // Airline match (0-30)
    const offerAirline = offer.segments[0]?.airlineCode;
    if (offerAirline && preferences.preferredAirlines.length > 0) {
      const match = preferences.preferredAirlines.find(
        (a) => a.code === offerAirline
      );
      if (match) {
        const rank = preferences.preferredAirlines.indexOf(match);
        if (rank === 0) airlineScore = 30;
        else if (rank === 1) airlineScore = 20;
        else airlineScore = 10;
      }
    }

    // Time window match (0-25)
    const depTime = offer.segments[0]?.departure?.time;
    if (depTime) {
      const hour = new Date(depTime).getHours();
      const offerWindow = getTimeWindow(hour);
      const dayOfWeek = new Date(depTime).getDay();
      const dayName = DAY_NAMES[dayOfWeek];
      const prefWindow =
        preferences.preferredDepartureWindows[dayName] ??
        routeData.preferredDepartureWindow;

      if (prefWindow) {
        if (offerWindow === prefWindow) timeScore = 25;
        else if (areAdjacentWindows(offerWindow, prefWindow)) timeScore = 15;
        else timeScore = 0;
      } else {
        timeScore = 12; // No preference data, neutral
      }
    }

    // Price score (0-25)
    if (routeData.avgPricePaid != null && routeData.avgPricePaid > 0) {
      const ratio = offer.price.total / routeData.avgPricePaid;
      if (ratio <= 1.0) priceScore = 25;
      else if (ratio <= 1.2) priceScore = 15;
      else priceScore = 5;

      // Weight by sensitivity: low sensitivity → price matters more
      const sensWeight = 1 - preferences.priceSensitivity;
      priceScore = Math.round(priceScore * (0.5 + sensWeight * 0.5));
    }

    // Specific flight match (0-10)
    const offerFlightNum = offer.segments[0]?.flightNumber;
    if (
      offerFlightNum &&
      routeData.preferredFlightNumber &&
      offerFlightNum === routeData.preferredFlightNumber
    ) {
      flightScore = 10;
    } else if (offerAirline === routeData.preferredAirlineCode) {
      flightScore = 5;
    }

    // Seat availability (0-10) — can't reliably check from offer data,
    // so give partial credit if airline is preferred (implies familiarity with seat map)
    if (offerAirline === routeData.preferredAirlineCode) {
      seatScore = 7;
    } else {
      seatScore = 3;
    }

    const score = airlineScore + timeScore + priceScore + flightScore + seatScore;

    return {
      score: Math.min(100, score),
      breakdown: {
        airline: airlineScore,
        time: timeScore,
        price: priceScore,
        flight: flightScore,
        seat: seatScore,
      },
    };
  }

  // ── f) generatePriceInsight ─────────────────────────────────────────────

  generatePriceInsight(
    currentPrice: number,
    currency: string,
    routeData: RouteFamiliarityData
  ): string | null {
    if (!routeData.avgPricePaid || routeData.timesBooked < 2) return null;

    const symbol = currency === "INR" ? "₹" : "$";
    const diff = currentPrice - routeData.avgPricePaid;
    const absDiff = Math.abs(Math.round(diff));

    if (routeData.minPricePaid != null && currentPrice <= routeData.minPricePaid) {
      return `Lowest I've seen for you on ${routeData.route} — great deal`;
    }

    if (diff < -50) {
      return `${symbol}${absDiff.toLocaleString()} less than you usually pay — good deal`;
    }

    if (Math.abs(diff) <= 50) {
      return "About what you normally pay for this route";
    }

    if (diff > 200) {
      return `${symbol}${absDiff.toLocaleString()} more than usual — prices are high right now`;
    }

    return `${symbol}${absDiff.toLocaleString()} more than your average on this route`;
  }

  // ── Preference seeding ────────────────────────────────────────────────

  /**
   * Seed initial preferences from onboarding data.
   * Called after onboarding completes.
   */
  async seedFromOnboarding(
    userId: string,
    data: {
      homeAirport?: string;
      seatPreference?: string;
      loyaltyAirlines?: { code: string; name: string }[];
    }
  ): Promise<void> {
    const preferredAirlines: AirlinePreference[] = (
      data.loyaltyAirlines ?? []
    ).map((a) => ({
      code: a.code,
      name: a.name,
      score: 0.3, // Small positive seed
    }));

    await this.supabase.from("user_travel_preferences").upsert(
      {
        user_id: userId,
        home_airport: data.homeAirport ?? "BLR",
        seat_preference: data.seatPreference ?? "aisle",
        preferred_airlines:
          preferredAirlines.length > 0 ? preferredAirlines : [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  }

  // ── Stats for UI ──────────────────────────────────────────────────────

  /**
   * Get Travel DNA stats for the settings page.
   */
  async getTravelDNA(userId: string): Promise<{
    totalBookings: number;
    routesLearned: number;
    preferences: UserPreferences;
    topRoutes: Array<{
      route: string;
      timesBooked: number;
      familiarityLevel: string;
      avgPrice: number | null;
    }>;
    airlineUsage: Array<{
      code: string;
      name: string;
      percentage: number;
    }>;
  }> {
    const [prefs, routesRes, patternsCountRes] = await Promise.all([
      this.getPreferences(userId),
      this.supabase
        .from("route_familiarity")
        .select("*")
        .eq("user_id", userId)
        .order("times_booked", { ascending: false }),
      this.supabase
        .from("booking_patterns")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
    ]);

    const routes = routesRes.data ?? [];
    const totalBookings = patternsCountRes.count ?? 0;
    const routesLearned = routes.filter(
      (r) => r.familiarity_level !== "discovery"
    ).length;

    const topRoutes = routes.slice(0, 5).map((r) => ({
      route: r.route,
      timesBooked: r.times_booked ?? 0,
      familiarityLevel: r.familiarity_level ?? "discovery",
      avgPrice: r.avg_price_paid ? parseFloat(r.avg_price_paid) : null,
    }));

    // Calculate airline usage from patterns
    const { data: patterns } = await this.supabase
      .from("booking_patterns")
      .select("airline_code, airline_name")
      .eq("user_id", userId);

    const airlineCounts = new Map<
      string,
      { code: string; name: string; count: number }
    >();
    for (const p of patterns ?? []) {
      if (!p.airline_code) continue;
      const entry = airlineCounts.get(p.airline_code);
      if (entry) entry.count++;
      else
        airlineCounts.set(p.airline_code, {
          code: p.airline_code,
          name: p.airline_name ?? p.airline_code,
          count: 1,
        });
    }

    const totalFlights = (patterns ?? []).filter((p) => p.airline_code).length;
    const airlineUsage = Array.from(airlineCounts.values())
      .map((a) => ({
        code: a.code,
        name: a.name,
        percentage:
          totalFlights > 0 ? Math.round((a.count / totalFlights) * 100) : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage);

    return {
      totalBookings,
      routesLearned,
      preferences: prefs,
      topRoutes,
      airlineUsage,
    };
  }
}
