import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PreferenceEngine } from "./preference-engine";
import type { UserPreferences } from "./preference-engine";

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

export type AIAction =
  | "search"
  | "present_options"
  | "confirm_booking"
  | "select_flight"
  | "ask_clarification"
  | "update_preference"
  | "general_response"
  | "show_booking_status";

export interface AIResponse {
  message: string;
  intentUpdate?: Record<string, string | number | null>;
  action: AIAction;
  searchParams?: {
    origin: string;
    destination: string;
    date: string;
    cabinClass?: string;
  };
  preferenceUpdate?: Record<string, string>;
  selectedFlightIndex?: number;
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

// ── Anthropic client singleton ──────────────────────────────────────────────

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

// ── ConversationAI ──────────────────────────────────────────────────────────

export class ConversationAI {
  private supabase: SupabaseClient;
  private prefEngine: PreferenceEngine;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.prefEngine = new PreferenceEngine(supabase);
  }

  // ── Main entry point ────────────────────────────────────────────────────

  async processMessage(
    userId: string,
    chatSessionId: string,
    message: string
  ): Promise<AIResponse> {
    // 1. Load or create conversation session
    const session = await this.getOrCreateSession(userId, chatSessionId);

    // 2. Load user preferences
    const preferences = await this.prefEngine.getPreferences(userId);

    // 3. Load route familiarity (if route is known)
    const route = this.extractRouteFromIntent(session.currentIntent);
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

    // 6. Build system prompt
    const systemPrompt = this.buildSystemPrompt(
      profile?.first_name ?? "there",
      preferences,
      routeData,
      session,
      recentBookings
    );

    // 7. Get conversation history
    const history = await this.getConversationHistory(chatSessionId, 10);

    // 8. Call Claude API
    const aiResponse = await this.callClaude(systemPrompt, history, message);

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

  // ── System prompt builder ──────────────────────────────────────────────

  buildSystemPrompt(
    firstName: string,
    preferences: UserPreferences,
    routeData: RouteFamiliarity | null,
    session: ConversationSession,
    recentBookings: unknown[] | null
  ): string {
    const priceSensDesc =
      preferences.priceSensitivity < 0.3
        ? "budget-focused (almost always picks cheapest)"
        : preferences.priceSensitivity > 0.7
          ? "comfort-focused (willing to pay more for preferred options)"
          : "balanced (weighs price vs. convenience)";

    const airlinePrefs =
      preferences.preferredAirlines.length > 0
        ? preferences.preferredAirlines
            .map((a) => `${a.name} (${a.code})`)
            .join(", ")
        : "no strong preference yet";

    let routeContext = "";
    if (routeData) {
      routeContext = `
ROUTE CONTEXT for ${routeData.route}:
- Times booked: ${routeData.timesBooked}
- Familiarity: ${routeData.familiarityLevel}
- Avg price paid: ${routeData.avgPrice ? `₹${Math.round(routeData.avgPrice).toLocaleString()}` : "unknown"}
- Preferred airline: ${routeData.preferredAirlineName ?? "none yet"}
- Preferred flight: ${routeData.preferredFlightNumber ?? "none yet"}
- Preferred time window: ${routeData.preferredDepartureWindow ?? "none yet"}`;
    }

    const famLevel = routeData?.familiarityLevel ?? "discovery";

    let famBehavior = "";
    if (famLevel === "discovery") {
      famBehavior = `
DISCOVERY MODE — show top 3-5 options when results are available.
Frame as options. Ask about preferences naturally.`;
    } else if (famLevel === "learning") {
      famBehavior = `
LEARNING MODE — show top 3, with predicted best FIRST.
Add commentary: "Based on your last few trips, I'd go with..."
Make recommendation clear but still show alternatives.`;
    } else {
      famBehavior = `
AUTOPILOT MODE — give ONE confident recommendation.
Format: "IndiGo 6E-302, 6:15 AM, aisle. ₹4,850 — that's ₹200 less than you usually pay. Book it?"
Only show alternatives if asked.`;
    }

    const currentIntent = Object.keys(session.currentIntent).length > 0
      ? `\nCURRENT BOOKING INTENT (accumulated from conversation so far):\n${JSON.stringify(session.currentIntent, null, 2)}\nSession state: ${session.state}`
      : "\nNo active booking intent yet.";

    let recentBookingCtx = "";
    if (recentBookings && recentBookings.length > 0) {
      recentBookingCtx = "\nRECENT BOOKINGS:";
      for (const b of recentBookings as Array<Record<string, unknown>>) {
        const segs = b.flight_segments as Array<Record<string, string>> | undefined;
        const seg = segs?.[0];
        if (seg) {
          recentBookingCtx += `\n- ${seg.departure_airport}→${seg.arrival_airport} on ${new Date(seg.departure_time).toLocaleDateString()} (PNR: ${b.pnr}, ${b.status})`;
        }
      }
    }

    return `You are SkySwift, a personal AI travel assistant. You are NOT a chatbot that fills out booking forms. You are like a brilliant executive assistant who has worked with ${firstName} for years.

YOUR PERSONALITY:
- Concise and confident. Never verbose or robotic.
- Like texting a smart friend who happens to be a travel expert.
- Use natural language, not bullet points or structured lists.
- Match the user's energy: if brief ("Delhi Tuesday"), be brief. If they give context, respond with context.
- Be proactive: if you can infer something, infer it.
- When 90%+ confident about a preference, just use it.
- Use ₹ for INR prices. Use 12hr time with AM/PM. Use short date format (e.g., "Tue, Feb 18").
- Never say "I'd be happy to help" or "Sure!" or other filler. Just do the thing.

WHAT YOU KNOW ABOUT ${firstName}:
- Home airport: ${preferences.homeAirport}
- Preferred airlines: ${airlinePrefs}
- Seat preference: ${preferences.seatPreference}
- Cabin: ${preferences.cabinClass}
- Price sensitivity: ${priceSensDesc}
- Usual advance booking: ${Math.round(preferences.advanceBookingDaysAvg)} days
- Communication style: ${preferences.communicationStyle}
${routeContext}

INFERENCE RULES — apply ALWAYS:
1. No origin specified → use home airport (${preferences.homeAirport})
2. No date → interpret naturally: "next week" = next Monday, "this weekend" = upcoming Saturday, "tomorrow" = tomorrow. If ambiguous, ask ONE question.
3. No airline + route familiarity >= learning → use preferred airline for route
4. "the usual" or "same as last time" → replicate most recent booking on this route
5. City names → IATA: Delhi=DEL, Mumbai/Bombay=BOM, Bangalore/Bengaluru=BLR, Hyderabad=HYD, Chennai/Madras=MAA, Kolkata/Calcutta=CCU, Pune=PNQ, Ahmedabad=AMD, Goa=GOI, Jaipur=JAI, Lucknow=LKO, Kochi/Cochin=COK, New York=JFK, London=LHR, Dubai=DXB, Singapore=SIN, Bangkok=BKK, Tokyo=NRT, San Francisco=SFO
6. Airline names → codes: IndiGo=6E, Air India=AI, Akasa=QP, SpiceJet=SG, Air India Express=IX
${famBehavior}

ALWAYS include price context when route history exists:
- "₹X less/more than your average on this route"
- "Cheapest I've seen for you on this route"
${currentIntent}
${recentBookingCtx}

HANDLE THESE PATTERNS:
- Booking intent: "book", "fly", "need to be in", "going to", "flight to" → parse intent, fill gaps from prefs, search if enough info
- Refinement: "actually Wednesday", "afternoon instead", "switch to Air India" → update relevant field, re-search
- Selection: "the first one", "book option 2", "the IndiGo one", "the cheapest", "book it", "yes" → map to correct offer
- Comparison: "anything cheaper?", "show me afternoon flights" → re-search with filter
- Preference update: "I prefer window seats now", "always book IndiGo" → update prefs
- Social/casual: "hey", "thanks" → respond naturally
- Unclear → ask ONE clarifying question

TODAY: ${new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

YOUR JSON RESPONSE FORMAT — always respond with valid JSON:
{
  "message": "Your natural language response",
  "intent_update": { "destination": "DEL", "date": "2026-02-18" },
  "action": "search" | "present_options" | "confirm_booking" | "select_flight" | "ask_clarification" | "update_preference" | "general_response" | "show_booking_status",
  "search_params": { "origin": "BLR", "destination": "DEL", "date": "2026-02-18", "cabin_class": "economy" },
  "preference_update": { "seat_preference": "window" },
  "selected_flight_index": 0
}

Only include fields that are relevant. intent_update only when fields changed. search_params only when action is "search". preference_update only when action is "update_preference". selected_flight_index only when action is "select_flight".`;
  }

  // ── Claude API call ────────────────────────────────────────────────────

  private async callClaude(
    systemPrompt: string,
    history: Array<{ role: "user" | "assistant"; content: string }>,
    currentMessage: string
  ): Promise<AIResponse> {
    const client = getAnthropicClient();

    const messages: Array<{ role: "user" | "assistant"; content: string }> = [
      ...history,
      { role: "user", content: currentMessage },
    ];

    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      });

      const textBlock = response.content.find((b) => b.type === "text");
      const rawText = textBlock?.type === "text" ? textBlock.text : "";

      return this.parseClaudeResponse(rawText);
    } catch (err) {
      console.error("[ConversationAI] Claude API error:", err);
      return {
        message:
          "I didn't quite catch that. Where are you flying to?",
        action: "ask_clarification",
      };
    }
  }

  // ── Parse Claude response ─────────────────────────────────────────────

  private parseClaudeResponse(raw: string): AIResponse {
    // Try to extract JSON from the response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // No JSON found — treat entire response as plain message
      return {
        message: raw.trim() || "I didn't quite catch that. Where are you flying to?",
        action: "general_response",
      };
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);

      const response: AIResponse = {
        message: parsed.message ?? "I didn't quite catch that.",
        action: this.normalizeAction(parsed.action),
      };

      if (parsed.intent_update && Object.keys(parsed.intent_update).length > 0) {
        response.intentUpdate = parsed.intent_update;
      }

      if (parsed.search_params) {
        response.searchParams = {
          origin: parsed.search_params.origin,
          destination: parsed.search_params.destination,
          date: parsed.search_params.date,
          cabinClass: parsed.search_params.cabin_class,
        };
      }

      if (parsed.preference_update) {
        response.preferenceUpdate = parsed.preference_update;
      }

      if (parsed.selected_flight_index != null) {
        response.selectedFlightIndex = parsed.selected_flight_index;
      }

      return response;
    } catch {
      // JSON parse failed — use the raw text
      return {
        message: raw.trim() || "I didn't quite catch that. Where are you flying to?",
        action: "general_response",
      };
    }
  }

  private normalizeAction(action: string | undefined): AIAction {
    const valid: AIAction[] = [
      "search",
      "present_options",
      "confirm_booking",
      "select_flight",
      "ask_clarification",
      "update_preference",
      "general_response",
      "show_booking_status",
    ];
    if (action && valid.includes(action as AIAction)) {
      return action as AIAction;
    }
    return "general_response";
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

  // ── Time-aware greeting ───────────────────────────────────────────────

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

    if (recent && recent.length > 0 && !greeting.includes("flight is")) {
      const b = recent[0] as Record<string, unknown>;
      const segs = b.flight_segments as Array<Record<string, string>> | undefined;
      const seg = segs?.[0];
      if (seg?.departure_time && new Date(seg.departure_time) < now) {
        greeting += ` How was ${seg.arrival_airport}? Ready to book the next one?`;
      }
    }

    return greeting;
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
