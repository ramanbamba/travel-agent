import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ConversationAI } from "@/lib/intelligence/conversation-ai";
import { searchFlights, toFlightOption } from "@/lib/supply";
import { PreferenceScorer } from "@/lib/intelligence/preference-scoring";
import type { ApiResponse, FlightOption } from "@/types";

// ── In-memory flight cache (5 min TTL) ──────────────────────────────────────

interface CacheEntry {
  flights: FlightOption[];
  timestamp: number;
}

const flightCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCached(key: string): FlightOption[] | null {
  const entry = flightCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    flightCache.delete(key);
    return null;
  }
  return entry.flights;
}

function setCache(key: string, flights: FlightOption[]) {
  if (flightCache.size > 100) {
    const oldest = flightCache.keys().next().value;
    if (oldest) flightCache.delete(oldest);
  }
  flightCache.set(key, { flights, timestamp: Date.now() });
}

// ── Nearby date helper ──────────────────────────────────────────────────────

function suggestNearbyDates(dateStr: string): string[] {
  const d = new Date(dateStr);
  const suggestions: string[] = [];
  for (const offset of [-1, 1, -2, 2]) {
    const nd = new Date(d);
    nd.setDate(nd.getDate() + offset);
    if (nd > new Date()) {
      suggestions.push(nd.toISOString().split("T")[0]);
    }
  }
  return suggestions.slice(0, 2);
}

// ── Route handler ───────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Unauthorized", message: "You must be logged in" },
      { status: 401 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Bad request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { message, chatSessionId, isFirstMessage } = body as {
    message: string;
    chatSessionId: string;
    isFirstMessage?: boolean;
  };

  if (!message || typeof message !== "string") {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Bad request", message: "Message is required" },
      { status: 400 }
    );
  }

  if (!chatSessionId) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Bad request", message: "Chat session ID is required" },
      { status: 400 }
    );
  }

  const conversationAI = new ConversationAI(supabase);

  // If first message in a new session, prepend greeting
  let greeting: string | null = null;
  if (isFirstMessage) {
    try {
      greeting = await conversationAI.getGreeting(user.id);
    } catch {
      // Non-critical
    }
  }

  // Process message through ConversationAI
  let aiResponse;
  try {
    aiResponse = await conversationAI.processMessage(
      user.id,
      chatSessionId,
      message
    );
  } catch (err) {
    console.error("[chat/message] ConversationAI error:", err);
    return NextResponse.json<ApiResponse>({
      data: {
        reply: "I didn't quite catch that. Where are you flying to?",
        action: "ask_clarification",
      },
      error: null,
      message: "Fallback response",
    });
  }

  // Handle different actions
  if (aiResponse.action === "search" && aiResponse.searchParams) {
    const { origin, destination, date, cabinClass } = aiResponse.searchParams;

    if (!origin || !destination || !date) {
      return NextResponse.json<ApiResponse>({
        data: {
          reply: aiResponse.message,
          action: "ask_clarification",
          greeting,
        },
        error: null,
        message: "Missing search params",
      });
    }

    // Check cache
    const cacheKey = `${origin}-${destination}-${date}`;
    let flights = getCached(cacheKey);
    let source = "cache";

    if (!flights) {
      // Fetch raw offers from supply layer
      const result = await searchFlights({
        origin,
        destination,
        departureDate: date,
        adults: 1,
        cabinClass: cabinClass as "economy" | "premium_economy" | "business" | "first" | undefined,
      });
      source = result.source;

      // Score offers against user preferences + Flight DNA
      const route = `${origin}-${destination}`;
      const scorer = new PreferenceScorer(supabase);
      const recommendation = await scorer.scoreOffers(user.id, route, result.offers);

      // Convert to FlightOption with score data attached
      flights = recommendation.offers.map((scored) => {
        const opt = toFlightOption(scored.offer);
        return {
          ...opt,
          preferenceScore: scored.score.score,
          scoreConfidence: scored.score.confidence,
          scoreReasons: scored.score.reasons,
          priceInsight: scored.priceInsight,
          flightDNA: scored.dna
            ? {
                ontime_pct: scored.dna.ontime_pct ?? undefined,
                wifi: scored.dna.wifi,
                seat_pitch: scored.dna.seat_pitch ?? undefined,
                power_outlets: scored.dna.power_outlets,
                food_rating: scored.dna.food_rating ?? undefined,
              }
            : null,
        };
      });

      if (flights.length > 0) {
        setCache(cacheKey, flights);
      }
    }

    // Flights now sorted by preference score (highest first)
    if (flights.length === 0) {
      const nearby = suggestNearbyDates(date);
      const suggestion =
        nearby.length > 0
          ? ` Want me to check ${nearby.join(" or ")}?`
          : " Try a different date.";

      return NextResponse.json<ApiResponse>({
        data: {
          reply: `No flights found from ${origin} to ${destination} on ${date}.${suggestion}`,
          action: "ask_clarification",
          greeting,
        },
        error: null,
        message: "No flights found",
      });
    }

    // Cache search results in conversation session
    conversationAI
      .updateSessionState(chatSessionId, {
        searchResultsCache: flights as unknown[],
      })
      .catch(() => {});

    const sourceNote =
      source === "mock"
        ? " (sample results — live search temporarily unavailable)"
        : "";

    return NextResponse.json<ApiResponse>({
      data: {
        reply: aiResponse.message + sourceNote,
        flights,
        action: "present_options",
        greeting,
        familiarityContext: aiResponse.familiarityContext ?? null,
      },
      error: null,
      message: "Flights found",
    });
  }

  // Handle preference update
  if (
    aiResponse.action === "update_preference" &&
    aiResponse.preferenceUpdate
  ) {
    try {
      await conversationAI.applyPreferenceUpdate(
        user.id,
        aiResponse.preferenceUpdate
      );
    } catch (err) {
      console.error("[chat/message] Preference update failed:", err);
    }
  }

  // Handle flight selection
  if (aiResponse.action === "select_flight" && aiResponse.selectedFlightIndex != null) {
    return NextResponse.json<ApiResponse>({
      data: {
        reply: aiResponse.message,
        action: "select_flight",
        selectedFlightIndex: aiResponse.selectedFlightIndex,
        greeting,
      },
      error: null,
      message: "Flight selected",
    });
  }

  // Default: return the AI response message
  return NextResponse.json<ApiResponse>({
    data: {
      reply: aiResponse.message,
      action: aiResponse.action,
      greeting,
      familiarityContext: aiResponse.familiarityContext ?? null,
    },
    error: null,
    message: "Response generated",
  });
}
