import type { SupabaseClient } from "@supabase/supabase-js";
import { PreferenceEngine } from "./preference-engine";
import {
  getAIProviderChain,
  buildBookingSystemPrompt,
  type AIProviderResponse,
  type AIAction as AIActionType,
} from "@/lib/ai";

// ── Types ───────────────────────────────────────────────────────────────────

export type ConversationState =
  | "idle"
  | "gathering_intent"
  | "searching"
  | "presenting_options"
  | "awaiting_selection"
  | "confirming_booking"
  | "processing_payment"
  | "post_booking"
  | "modifying";

// Re-export AIAction for backward compat
export type AIAction = AIActionType;

export interface AIResponse extends AIProviderResponse {
  familiarityContext?: {
    level: "discovery" | "learning" | "autopilot";
    route: string;
  };
}

interface LastBookingContext {
  route: string;
  airlineCode: string;
  airlineName: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  dayOfWeek: number;
  pricePaid: number;
  currency: string;
  cabinClass: string;
  seatType: string | null;
  daysBeforeDeparture: number | null;
  bookedAt: string;
}

interface ConversationSession {
  id: string;
  state: ConversationState;
  currentIntent: Record<string, unknown>;
  missingFields: string[];
  searchResultsCache: unknown[] | null;
  selectedOfferId: string | null;
  messagesInSession: number;
}

interface RouteFamiliarity {
  route: string;
  timesBooked: number;
  familiarityLevel: string;
  avgPrice: number | null;
  preferredAirlineCode: string | null;
  preferredAirlineName: string | null;
  preferredFlightNumber: string | null;
  preferredDepartureWindow: string | null;
}

// ── ConversationAI ──────────────────────────────────────────────────────────

export class ConversationAI {
  private supabase: SupabaseClient;
  private prefEngine: PreferenceEngine;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.prefEngine = new PreferenceEngine(supabase);
  }

  // ── Pre-processing: detect contextual patterns ────────────────────────

  /**
   * Detect "the usual", "again", and city-based route patterns from the message
   * and enrich the session intent before sending to the AI.
   * This ensures the AI gets the right route context even on first mention.
   */
  private async preprocessMessage(
    userId: string,
    message: string,
    currentIntent: Record<string, unknown>
  ): Promise<{ enrichedIntent: Record<string, unknown>; detectedRoute: string | null }> {
    const lower = message.toLowerCase().trim();
    let enrichedIntent = { ...currentIntent };
    let detectedRoute: string | null = null;

    // Pattern: "the usual" / "same as last time" — load most recent booking
    if (
      lower.includes("the usual") ||
      lower.includes("same as last time") ||
      lower.includes("same as before")
    ) {
      const lastBooking = await this.getMostRecentBooking(userId);
      if (lastBooking) {
        const [origin, destination] = lastBooking.route.split("-");
        enrichedIntent = {
          ...enrichedIntent,
          origin,
          destination,
          _repeatPattern: "the_usual",
          _lastBookingRoute: lastBooking.route,
        };
        detectedRoute = lastBooking.route;
      }
    }

    // Pattern: "[city] again [day]" — detect the city, find matching route
    const againMatch = lower.match(
      /(?:delhi|mumbai|bombay|hyderabad|chennai|kolkata|pune|goa|bangalore|bengaluru|ahmedabad|jaipur|lucknow|kochi|cochin)\s+again/i
    );
    if (againMatch) {
      const cityWord = againMatch[0].split(/\s+/)[0];
      const cityToIATA: Record<string, string> = {
        delhi: "DEL", mumbai: "BOM", bombay: "BOM",
        hyderabad: "HYD", chennai: "MAA", kolkata: "CCU",
        pune: "PNQ", goa: "GOI", bangalore: "BLR", bengaluru: "BLR",
        ahmedabad: "AMD", jaipur: "JAI", lucknow: "LKO",
        kochi: "COK", cochin: "COK",
      };
      const destinationCode = cityToIATA[cityWord.toLowerCase()];
      if (destinationCode) {
        // Get user's home airport as origin
        const preferences = await this.prefEngine.getPreferences(userId);
        const origin = (enrichedIntent.origin as string) || preferences.homeAirport;
        detectedRoute = `${origin}-${destinationCode}`;
        enrichedIntent = {
          ...enrichedIntent,
          origin,
          destination: destinationCode,
          _repeatPattern: "city_again",
        };
      }
    }

    // If no route detected from patterns, try extracting from current intent
    if (!detectedRoute) {
      detectedRoute = this.extractRouteFromIntent(enrichedIntent);
    }

    return { enrichedIntent, detectedRoute };
  }

  // ── Main entry point ────────────────────────────────────────────────────

  async processMessage(
    userId: string,
    chatSessionId: string,
    message: string
  ): Promise<AIResponse> {
    // 1. Load or create conversation session
    const session = await this.getOrCreateSession(userId, chatSessionId);

    // 1b. Pre-process message for contextual patterns
    const { enrichedIntent, detectedRoute } = await this.preprocessMessage(
      userId,
      message,
      session.currentIntent
    );

    // Update session intent with any enrichments
    if (Object.keys(enrichedIntent).length > Object.keys(session.currentIntent).length) {
      session.currentIntent = enrichedIntent;
    }

    // 2. Load user preferences
    const preferences = await this.prefEngine.getPreferences(userId);

    // 3. Load route familiarity (if route is known — from intent or preprocessing)
    const route = detectedRoute ?? this.extractRouteFromIntent(session.currentIntent);
    let routeData: RouteFamiliarity | null = null;
    if (route) {
      routeData = await this.getRouteFamiliarityData(userId, route);
    }

    // 4. Load user profile for name
    const { data: profile } = await this.supabase
      .from("user_profiles")
      .select("first_name, last_name")
      .eq("id", userId)
      .single();

    // 5. Load recent bookings for context
    const { data: recentBookings } = await this.supabase
      .from("bookings")
      .select("pnr, status, currency, total_price_cents, booked_at, flight_segments(departure_airport, arrival_airport, departure_time)")
      .eq("user_id", userId)
      .order("booked_at", { ascending: false })
      .limit(3);

    // 5b. Load last booking context (for "the usual" / contextual patterns)
    let lastBooking: LastBookingContext | null = null;
    let lastBookingForRoute: LastBookingContext | null = null;
    const frequentRoutes = await this.getFrequentRoutes(userId);

    // Always load most recent booking
    lastBooking = await this.getMostRecentBooking(userId);

    // If we know the route, also load last booking for that specific route
    if (route) {
      lastBookingForRoute = await this.getLastBookingForRoute(userId, route);
    }

    // 6. Build system prompt (provider-agnostic)
    const systemPrompt = buildBookingSystemPrompt({
      firstName: profile?.first_name ?? "there",
      preferences,
      routeData: routeData
        ? {
            route: routeData.route,
            timesBooked: routeData.timesBooked,
            familiarityLevel: routeData.familiarityLevel,
            avgPrice: routeData.avgPrice,
            preferredAirlineName: routeData.preferredAirlineName,
            preferredFlightNumber: routeData.preferredFlightNumber,
            preferredDepartureWindow: routeData.preferredDepartureWindow,
          }
        : null,
      session: {
        state: session.state,
        currentIntent: session.currentIntent,
      },
      recentBookings,
      lastBooking: lastBooking
        ? {
            route: lastBooking.route,
            airlineName: lastBooking.airlineName,
            flightNumber: lastBooking.flightNumber,
            departureTime: lastBooking.departureTime,
            pricePaid: lastBooking.pricePaid,
            currency: lastBooking.currency,
            cabinClass: lastBooking.cabinClass,
            seatType: lastBooking.seatType,
          }
        : null,
      lastBookingForRoute: lastBookingForRoute
        ? {
            route: lastBookingForRoute.route,
            airlineName: lastBookingForRoute.airlineName,
            flightNumber: lastBookingForRoute.flightNumber,
            departureTime: lastBookingForRoute.departureTime,
            pricePaid: lastBookingForRoute.pricePaid,
            currency: lastBookingForRoute.currency,
            cabinClass: lastBookingForRoute.cabinClass,
            seatType: lastBookingForRoute.seatType,
          }
        : null,
      frequentRoutes,
    });

    // 7. Get conversation history
    const history = await this.getConversationHistory(chatSessionId, 10);

    // 8. Call AI provider (Gemini / Anthropic / Mock — configured via AI_PROVIDER env)
    let aiResponse: AIResponse = {
      message: "I didn't quite catch that. Where are you flying to?",
      action: "ask_clarification",
    };
    const providers = getAIProviderChain();
    for (const provider of providers) {
      try {
        const providerResponse = await provider.chat({
          systemPrompt,
          history,
          message,
        });
        aiResponse = { ...providerResponse };
        break;
      } catch (err) {
        console.warn(
          `[ConversationAI] Provider "${provider.name}" failed, trying next:`,
          err instanceof Error ? err.message : err
        );
      }
    }
    // aiResponse keeps its default fallback value if no provider succeeded

    // 8b. Attach familiarity context if available
    if (routeData && routeData.familiarityLevel) {
      aiResponse.familiarityContext = {
        level: routeData.familiarityLevel as "discovery" | "learning" | "autopilot",
        route: routeData.route,
      };
    }

    // 9. Update session
    const newState = this.deriveState(aiResponse.action, session.state);
    const mergedIntent = {
      ...session.currentIntent,
      ...(aiResponse.intentUpdate ?? {}),
    };

    await this.updateSessionState(session.id, {
      state: newState,
      currentIntent: mergedIntent,
      messagesInSession: session.messagesInSession + 1,
      selectedOfferId:
        aiResponse.action === "select_flight"
          ? String(aiResponse.selectedFlightIndex ?? "")
          : session.selectedOfferId,
    });

    return aiResponse;
  }

  // ── Session management ────────────────────────────────────────────────

  private async getOrCreateSession(
    userId: string,
    chatSessionId: string
  ): Promise<ConversationSession> {
    // Try to find existing session
    const { data: existing } = await this.supabase
      .from("conversation_sessions")
      .select("*")
      .eq("chat_session_id", chatSessionId)
      .single();

    if (existing) {
      // Check if session is stale (30 min inactive)
      const updatedAt = new Date(existing.updated_at).getTime();
      const now = Date.now();
      const stale = now - updatedAt > 30 * 60 * 1000;

      if (stale) {
        // Reset session
        await this.supabase
          .from("conversation_sessions")
          .update({
            state: "idle",
            current_intent: {},
            missing_fields: [],
            search_results_cache: null,
            selected_offer_id: null,
            messages_in_session: 0,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        return {
          id: existing.id,
          state: "idle",
          currentIntent: {},
          missingFields: [],
          searchResultsCache: null,
          selectedOfferId: null,
          messagesInSession: 0,
        };
      }

      return {
        id: existing.id,
        state: existing.state ?? "idle",
        currentIntent: existing.current_intent ?? {},
        missingFields: existing.missing_fields ?? [],
        searchResultsCache: existing.search_results_cache,
        selectedOfferId: existing.selected_offer_id,
        messagesInSession: existing.messages_in_session ?? 0,
      };
    }

    // Create new session
    const { data: newSession } = await this.supabase
      .from("conversation_sessions")
      .insert({
        user_id: userId,
        chat_session_id: chatSessionId,
        state: "idle",
        current_intent: {},
        missing_fields: [],
        messages_in_session: 0,
      })
      .select("id")
      .single();

    return {
      id: newSession?.id ?? "",
      state: "idle",
      currentIntent: {},
      missingFields: [],
      searchResultsCache: null,
      selectedOfferId: null,
      messagesInSession: 0,
    };
  }

  async updateSessionState(
    sessionId: string,
    updates: {
      state?: ConversationState;
      currentIntent?: Record<string, unknown>;
      messagesInSession?: number;
      selectedOfferId?: string | null;
      searchResultsCache?: unknown[] | null;
    }
  ): Promise<void> {
    const dbUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.state) dbUpdates.state = updates.state;
    if (updates.currentIntent) dbUpdates.current_intent = updates.currentIntent;
    if (updates.messagesInSession != null)
      dbUpdates.messages_in_session = updates.messagesInSession;
    if (updates.selectedOfferId !== undefined)
      dbUpdates.selected_offer_id = updates.selectedOfferId;
    if (updates.searchResultsCache !== undefined)
      dbUpdates.search_results_cache = updates.searchResultsCache;

    await this.supabase
      .from("conversation_sessions")
      .update(dbUpdates)
      .eq("id", sessionId);
  }

  // ── Conversation history ──────────────────────────────────────────────

  async getConversationHistory(
    chatSessionId: string,
    limit: number = 10
  ): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
    const { data: session } = await this.supabase
      .from("chat_sessions")
      .select("messages")
      .eq("id", chatSessionId)
      .single();

    if (!session?.messages) return [];

    const messages = session.messages as Array<{
      role: string;
      content: string;
    }>;

    return messages
      .filter(
        (m) =>
          (m.role === "user" || m.role === "assistant") &&
          m.content &&
          m.content.trim().length > 0
      )
      .slice(-limit)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
  }

  // ── Time-aware + pattern-aware greeting ──────────────────────────────

  async getGreeting(userId: string): Promise<string> {
    const now = new Date();
    // IST = UTC+5:30
    const istHour = (now.getUTCHours() + 5 + (now.getUTCMinutes() + 30 >= 60 ? 1 : 0)) % 24;

    const { data: profile } = await this.supabase
      .from("user_profiles")
      .select("first_name")
      .eq("id", userId)
      .single();

    const name = profile?.first_name ?? "there";

    let greeting: string;
    if (istHour < 12) {
      greeting = `Good morning, ${name}.`;
    } else if (istHour < 17) {
      greeting = `Good afternoon, ${name}.`;
    } else {
      greeting = `Good evening, ${name}.`;
    }

    // Check for upcoming trips (next 48 hours)
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
    const { data: upcoming } = await this.supabase
      .from("bookings")
      .select("pnr, flight_segments(departure_airport, arrival_airport, departure_time)")
      .eq("user_id", userId)
      .eq("status", "confirmed")
      .limit(1);

    if (upcoming && upcoming.length > 0) {
      const b = upcoming[0] as Record<string, unknown>;
      const segs = b.flight_segments as Array<Record<string, string>> | undefined;
      const seg = segs?.[0];
      if (seg?.departure_time) {
        const depTime = new Date(seg.departure_time);
        if (depTime > now && depTime.toISOString() < in48h) {
          const isToday = depTime.toDateString() === now.toDateString();
          const isTomorrow =
            depTime.toDateString() ===
            new Date(now.getTime() + 86400000).toDateString();
          const when = isToday
            ? "today"
            : isTomorrow
              ? "tomorrow"
              : "in 2 days";
          greeting += ` Your ${seg.departure_airport}-${seg.arrival_airport} flight is ${when}. All good, or need to make changes?`;
          return greeting;
        }
      }
    }

    // Check for recently completed trip
    const threeDaysAgo = new Date(
      now.getTime() - 3 * 24 * 60 * 60 * 1000
    ).toISOString();
    const { data: recent } = await this.supabase
      .from("bookings")
      .select("flight_segments(arrival_airport, departure_time)")
      .eq("user_id", userId)
      .eq("status", "confirmed")
      .gte("booked_at", threeDaysAgo)
      .limit(1);

    if (recent && recent.length > 0) {
      const b = recent[0] as Record<string, unknown>;
      const segs = b.flight_segments as Array<Record<string, string>> | undefined;
      const seg = segs?.[0];
      if (seg?.departure_time && new Date(seg.departure_time) < now) {
        greeting += ` How was ${seg.arrival_airport}? Ready to book the next one?`;
        return greeting;
      }
    }

    // ── Pattern-aware greeting for returning users ────────────────────
    // Check if user has an autopilot route that matches today's day-of-week
    const todayDOW = now.getDay();

    const { data: autopilotRoutes } = await this.supabase
      .from("route_familiarity")
      .select("route, preferred_airline_name, preferred_flight_number, preferred_departure_window, avg_price_paid")
      .eq("user_id", userId)
      .eq("familiarity_level", "autopilot")
      .order("times_booked", { ascending: false })
      .limit(3);

    if (autopilotRoutes && autopilotRoutes.length > 0) {
      // Check booking patterns for day-of-week match
      for (const route of autopilotRoutes) {
        const { data: dowPatterns } = await this.supabase
          .from("booking_patterns")
          .select("day_of_week, airline_name, flight_number, departure_time, price_paid")
          .eq("user_id", userId)
          .eq("route", route.route)
          .eq("booking_completed", true)
          .eq("day_of_week", todayDOW)
          .order("created_at", { ascending: false })
          .limit(1);

        if (dowPatterns && dowPatterns.length > 0) {
          const p = dowPatterns[0];
          const [, dest] = route.route.split("-");
          const iataToCity: Record<string, string> = {
            DEL: "Delhi", BOM: "Mumbai", HYD: "Hyderabad", MAA: "Chennai",
            CCU: "Kolkata", BLR: "Bangalore", PNQ: "Pune", GOI: "Goa",
          };
          const cityName = iataToCity[dest] ?? dest;
          const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][todayDOW];

          const airline = p.airline_name ?? route.preferred_airline_name;
          const flight = p.flight_number ?? route.preferred_flight_number;
          const price = p.price_paid ? Math.round(parseFloat(p.price_paid)) : (route.avg_price_paid ? Math.round(parseFloat(route.avg_price_paid)) : null);

          let timeStr = "";
          if (p.departure_time) {
            try {
              const d = new Date(p.departure_time);
              const h = d.getHours();
              const m = d.getMinutes();
              const ampm = h >= 12 ? "PM" : "AM";
              const h12 = h % 12 || 12;
              timeStr = `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
            } catch {
              // skip time
            }
          }

          const parts: string[] = [];
          if (airline && flight) parts.push(`${airline} ${flight}`);
          if (timeStr) parts.push(timeStr);
          if (price) parts.push(`₹${price.toLocaleString("en-IN")}`);

          if (parts.length > 0) {
            greeting += ` Your usual ${dayName} ${cityName} flight? ${parts.join(", ")}.`;
          } else {
            greeting += ` ${cityName} again this ${dayName}?`;
          }
          return greeting;
        }
      }

      // No DOW match, but has autopilot routes — generic smart greeting
      const topRoute = autopilotRoutes[0];
      const [, dest] = topRoute.route.split("-");
      const iataToCity: Record<string, string> = {
        DEL: "Delhi", BOM: "Mumbai", HYD: "Hyderabad", MAA: "Chennai",
        CCU: "Kolkata", BLR: "Bangalore", PNQ: "Pune", GOI: "Goa",
      };
      const cityName = iataToCity[dest] ?? dest;
      greeting += ` Where to? I know your ${cityName} route inside out.`;
    }

    return greeting;
  }

  // ── Last booking context (for "the usual" patterns) ──────────────────

  private async getLastBookingForRoute(
    userId: string,
    route: string
  ): Promise<LastBookingContext | null> {
    const { data } = await this.supabase
      .from("booking_patterns")
      .select("*")
      .eq("user_id", userId)
      .eq("route", route)
      .eq("booking_completed", true)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!data || data.length === 0) return null;
    const p = data[0];

    return {
      route: p.route,
      airlineCode: p.airline_code,
      airlineName: p.airline_name,
      flightNumber: p.flight_number,
      departureTime: p.departure_time,
      arrivalTime: p.arrival_time,
      dayOfWeek: p.day_of_week,
      pricePaid: parseFloat(p.price_paid),
      currency: p.currency ?? "INR",
      cabinClass: p.cabin_class ?? "economy",
      seatType: p.seat_type,
      daysBeforeDeparture: p.days_before_departure,
      bookedAt: p.created_at,
    };
  }

  /**
   * Load the user's most recent booking (any route) for "the usual" / "same as last time"
   */
  private async getMostRecentBooking(
    userId: string
  ): Promise<LastBookingContext | null> {
    const { data } = await this.supabase
      .from("booking_patterns")
      .select("*")
      .eq("user_id", userId)
      .eq("booking_completed", true)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!data || data.length === 0) return null;
    const p = data[0];

    return {
      route: p.route,
      airlineCode: p.airline_code,
      airlineName: p.airline_name,
      flightNumber: p.flight_number,
      departureTime: p.departure_time,
      arrivalTime: p.arrival_time,
      dayOfWeek: p.day_of_week,
      pricePaid: parseFloat(p.price_paid),
      currency: p.currency ?? "INR",
      cabinClass: p.cabin_class ?? "economy",
      seatType: p.seat_type,
      daysBeforeDeparture: p.days_before_departure,
      bookedAt: p.created_at,
    };
  }

  /**
   * Load the user's top 3 frequent routes for contextual suggestions
   */
  private async getFrequentRoutes(
    userId: string
  ): Promise<Array<{ route: string; timesBooked: number; familiarityLevel: string }>> {
    const { data } = await this.supabase
      .from("route_familiarity")
      .select("route, times_booked, familiarity_level")
      .eq("user_id", userId)
      .order("times_booked", { ascending: false })
      .limit(3);

    if (!data) return [];
    return data.map((r) => ({
      route: r.route,
      timesBooked: r.times_booked,
      familiarityLevel: r.familiarity_level,
    }));
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private extractRouteFromIntent(
    intent: Record<string, unknown>
  ): string | null {
    const origin = intent.origin as string | undefined;
    const destination = intent.destination as string | undefined;
    if (origin && destination) {
      return `${origin}-${destination}`;
    }
    return null;
  }

  private async getRouteFamiliarityData(
    userId: string,
    route: string
  ): Promise<RouteFamiliarity | null> {
    const { data } = await this.supabase
      .from("route_familiarity")
      .select("*")
      .eq("user_id", userId)
      .eq("route", route)
      .single();

    if (!data) return null;

    return {
      route: data.route,
      timesBooked: data.times_booked ?? 0,
      familiarityLevel: data.familiarity_level ?? "discovery",
      avgPrice: data.avg_price_paid
        ? parseFloat(data.avg_price_paid)
        : null,
      preferredAirlineCode: data.preferred_airline_code,
      preferredAirlineName: data.preferred_airline_name,
      preferredFlightNumber: data.preferred_flight_number,
      preferredDepartureWindow: data.preferred_departure_window,
    };
  }

  private deriveState(
    action: AIAction,
    currentState: ConversationState
  ): ConversationState {
    switch (action) {
      case "search":
        return "searching";
      case "present_options":
        return "presenting_options";
      case "select_flight":
        return "awaiting_selection";
      case "confirm_booking":
        return "confirming_booking";
      case "ask_clarification":
        return "gathering_intent";
      case "update_preference":
        return currentState; // Don't change state for pref updates
      default:
        return currentState === "idle" ? "idle" : currentState;
    }
  }

  // ── Apply preference update ───────────────────────────────────────────

  async applyPreferenceUpdate(
    userId: string,
    updates: Record<string, string>
  ): Promise<void> {
    const dbUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.seat_preference) dbUpdates.seat_preference = updates.seat_preference;
    if (updates.cabin_class) dbUpdates.cabin_class = updates.cabin_class;
    if (updates.home_airport) dbUpdates.home_airport = updates.home_airport;
    if (updates.communication_style) dbUpdates.communication_style = updates.communication_style;
    if (updates.meal_preference) dbUpdates.meal_preference = updates.meal_preference;

    if (Object.keys(dbUpdates).length > 1) {
      await this.supabase
        .from("user_travel_preferences")
        .update(dbUpdates)
        .eq("user_id", userId);
    }
  }
}
