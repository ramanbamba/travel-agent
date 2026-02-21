/**
 * Unified demo handler — platform-agnostic message processing.
 * Used by /api/demo/chat and /demo/channels for all three platform themes.
 */

import { getAIProvider } from "@/lib/ai";
import { generateDemoFlights, generateDemoBooking } from "./mock-flights";
import type { DemoFlight } from "./mock-flights";
import {
  parseSelection,
  isConfirmation,
  isCancellation,
} from "@/lib/ai/selection-parser";
import { buildWebChatSystemPrompt } from "@/lib/ai/prompts/corporate-system-prompt";
import { fixCommonTypos } from "@/lib/ai/edge-cases";

const MAX_HISTORY = 14;

export type HistoryEntry = { role: "user" | "assistant"; content: string };

export interface DemoSessionContext {
  history?: HistoryEntry[];
  flights?: DemoFlight[];
  search?: {
    origin: string;
    destination: string;
    date: string;
    cabin_class: string;
  } | null;
  state?: string;
  selected_flight?: DemoFlight | null;
  preferences?: Record<string, string>;
  [key: string]: unknown;
}

export interface DemoResponse {
  message: string;
  flights?: DemoFlight[];
  booking?: {
    booking_id: string;
    status: string;
    pnr: string | null;
    message: string;
  };
  session_context: DemoSessionContext;
}

function appendHistory(
  existing: HistoryEntry[],
  userMsg: string,
  assistantMsg: string
): HistoryEntry[] {
  return [
    ...(existing || []),
    { role: "user" as const, content: userMsg },
    { role: "assistant" as const, content: assistantMsg },
  ].slice(-MAX_HISTORY);
}

function buildResponse(
  message: string,
  sessionContext: DemoSessionContext,
  history: HistoryEntry[],
  userMsg: string,
  extra?: { flights?: DemoFlight[]; booking?: DemoResponse["booking"] }
): DemoResponse {
  return {
    message,
    ...extra,
    session_context: {
      ...sessionContext,
      history: appendHistory(history, userMsg, message),
    },
  };
}

/**
 * Process a demo chat message. Returns platform-agnostic response.
 */
export async function processDemoMessage(
  message: string,
  sessionContext: DemoSessionContext,
  selectedOffer?: DemoFlight
): Promise<DemoResponse> {
  const history: HistoryEntry[] = sessionContext?.history ?? [];
  const currentFlights: DemoFlight[] = sessionContext?.flights ?? [];
  const currentSearch = sessionContext?.search ?? null;

  // If confirming a selected offer (from flight card tap)
  if (selectedOffer && message.toLowerCase().includes("confirm")) {
    const booking = generateDemoBooking(selectedOffer);
    const replyMsg = booking.status === "pending_approval"
      ? `✈️ Booking submitted! Since this is out of policy, it's been sent to your manager for approval. You'll get a WhatsApp notification once approved.\n\nBooking ref: ${booking.booking_id}`
      : `✈️ Booking confirmed! Your PNR is ${booking.pnr}. E-ticket will be sent to your email and WhatsApp.\n\nHave a great trip! Need anything else?`;
    return buildResponse(replyMsg, { ...sessionContext, state: "booked", flights: [], search: null }, history, message, { booking });
  }

  // ── Deterministic handling for selecting/confirming states ──
  const sessionState = sessionContext?.state ?? "idle";

  // In selecting state: try deterministic selection first
  if (sessionState === "selecting" && currentFlights.length > 0) {
    if (isCancellation(message)) {
      return buildResponse("No problem! What else can I help with?", {
        ...sessionContext, state: "idle", flights: [], search: null,
      }, history, message);
    }

    const selIdx = parseSelection(message, currentFlights.map((f: DemoFlight) => ({
      airline_name: f.airline,
      airline_code: f.airlineCode,
      price: f.price,
      departure_time: f.departure,
      stops: f.stops,
    })));

    if (selIdx !== null && selIdx < currentFlights.length) {
      const flight = currentFlights[selIdx];
      const policyNote = !flight.compliant
        ? `\n\n⚠️ This flight is out of policy:\n${flight.violations.map((v: string) => `• ${v}`).join("\n")}\nIt will require manager approval.`
        : "\n\n✅ This flight is within your company's travel policy.";

      const selectMsg = `Selected: ${flight.airline} ${flight.flightNumber}\n\n${flight.origin} → ${flight.destination}\n🕐 ${flight.departure} - ${flight.arrival} (${flight.duration})\n${flight.stops === 0 ? "Direct" : flight.stops + " stop"} · ${flight.cabin}\n💰 ₹${flight.price.toLocaleString("en-IN")}${policyNote}\n\nWant to add any preferences (meal, seat)? Or say "confirm" to book.`;

      return buildResponse(selectMsg, {
        ...sessionContext, state: "confirming", selected_flight: flight,
      }, history, message);
    }
  }

  // In confirming state: handle confirmation/cancellation
  if (sessionState === "confirming") {
    if (isConfirmation(message)) {
      const selectedFlight = sessionContext?.selected_flight;
      if (selectedFlight) {
        const booking = generateDemoBooking(selectedFlight as DemoFlight);
        const replyMsg = booking.status === "pending_approval"
          ? `📋 Booking submitted! Since this is out of policy, it's been sent to your manager for approval.\n\nRef: ${booking.booking_id}`
          : `✅ Booking confirmed!\n\n✈️ ${selectedFlight.airline} ${selectedFlight.flightNumber}\n${selectedFlight.origin} → ${selectedFlight.destination}\n🕐 ${selectedFlight.departure}\nPNR: ${booking.pnr}\n\nE-ticket sent to your email. Have a great trip! ✈️`;
        return buildResponse(replyMsg, {
          ...sessionContext, state: "booked", flights: [], search: null, selected_flight: null,
        }, history, message, { booking });
      }
    }

    if (isCancellation(message)) {
      return buildResponse("No problem! Here are your options again — pick a flight:", {
        ...sessionContext, state: "selecting", selected_flight: null,
      }, history, message, { flights: currentFlights });
    }
  }

  // Fix common typos before AI processing
  const cleanedMessage = fixCommonTypos(message);

  const ai = getAIProvider();

  // Build context-aware system prompt
  const systemPrompt = buildWebChatSystemPrompt({
    currentFlights: currentFlights.length > 0 ? currentFlights : undefined,
    currentSearch: currentSearch ?? undefined,
    sessionState: sessionState,
  });

  const aiResponse = await ai.chat({
    systemPrompt,
    history,
    message: cleanedMessage,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any = null;
  try {
    const rawText = aiResponse.raw || aiResponse.message;
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
  } catch {
    /* JSON parse failed — use structured fallback */
  }

  // Fallback to structured response
  if (!parsed) {
    parsed = {
      action: aiResponse.action === "search" ? "search" : "general_response",
      search_params: aiResponse.searchParams ? {
        origin: aiResponse.searchParams.origin,
        destination: aiResponse.searchParams.destination,
        date: aiResponse.searchParams.date,
        cabin_class: aiResponse.searchParams.cabinClass || "economy",
      } : undefined,
      message: aiResponse.message,
    };
  }

  const action = parsed.action;

  // ── SEARCH ──
  if (action === "search" && parsed.search_params?.origin && parsed.search_params?.destination && parsed.search_params?.date) {
    const sp = parsed.search_params;
    const flights = generateDemoFlights(sp.origin, sp.destination, sp.date, sp.cabin_class || "economy", 8);
    const compliantCount = flights.filter((f: DemoFlight) => f.compliant).length;
    const responseMsg = parsed.message || `Found ${flights.length} flights from ${sp.origin} to ${sp.destination}. ${compliantCount} are within policy. Tap a flight to select it.`;

    return buildResponse(responseMsg, {
      ...sessionContext,
      state: "selecting",
      search: { origin: sp.origin, destination: sp.destination, date: sp.date, cabin_class: sp.cabin_class || "economy" },
      flights,
    }, history, message, { flights });
  }

  // ── FILTER ──
  if (action === "filter" && currentFlights.length > 0) {
    const f = parsed.filter || {};
    let filtered = [...currentFlights];

    if (f.time_range) {
      const from = f.time_range.from || "00:00";
      const to = f.time_range.to || "23:59";
      filtered = filtered.filter((fl: DemoFlight) => fl.departure >= from && fl.departure <= to);
    }
    if (f.airlines && f.airlines.length > 0) {
      const codes = f.airlines.map((a: string) => a.toUpperCase());
      filtered = filtered.filter((fl: DemoFlight) => codes.includes(fl.airlineCode));
    }
    if (f.max_price) {
      filtered = filtered.filter((fl: DemoFlight) => fl.price <= f.max_price);
    }
    if (f.direct_only) {
      filtered = filtered.filter((fl: DemoFlight) => fl.stops === 0);
    }
    if (f.cabin_class && f.cabin_class !== currentSearch?.cabin_class) {
      const newFlights = generateDemoFlights(
        currentSearch!.origin, currentSearch!.destination, currentSearch!.date,
        f.cabin_class, 8
      );
      return buildResponse(
        parsed.message || `Here are ${f.cabin_class} class options:`,
        { ...sessionContext, state: "selecting", flights: newFlights, search: { ...currentSearch!, cabin_class: f.cabin_class } },
        history, message, { flights: newFlights }
      );
    }

    if (filtered.length === 0) {
      return buildResponse(
        parsed.message || "No flights match that filter. Try adjusting your criteria, or say \"show all\" to see all options again.",
        { ...sessionContext },
        history, message
      );
    }

    return buildResponse(
      parsed.message || `Here are ${filtered.length} matching flights:`,
      { ...sessionContext, state: "selecting" },
      history, message, { flights: filtered }
    );
  }

  // ── SELECT ──
  if (action === "select" && parsed.select && currentFlights.length > 0) {
    const idx = (parsed.select.index ?? 1) - 1;
    const flight = currentFlights[Math.max(0, Math.min(idx, currentFlights.length - 1))];
    if (flight) {
      const policyNote = !flight.compliant
        ? `\n\n⚠️ This flight is out of policy:\n${flight.violations.map((v: string) => `• ${v}`).join("\n")}\nIt will require manager approval.`
        : "\n\n✅ This flight is within your company's travel policy.";

      const selectMsg = `${parsed.message || `Selected: ${flight.airline} ${flight.flightNumber}`}\n\n${flight.origin} → ${flight.destination}\n🕐 ${flight.departure} - ${flight.arrival} (${flight.duration})\n${flight.stops === 0 ? "Direct" : flight.stops + " stop"} · ${flight.cabin}\n💰 ₹${flight.price.toLocaleString("en-IN")}${policyNote}\n\nWant to add any preferences (meal, seat)? Or say "confirm" to book.`;

      return buildResponse(selectMsg, {
        ...sessionContext,
        state: "confirming",
        selected_flight: flight,
      }, history, message);
    }
  }

  // ── CONFIRM ──
  if (action === "confirm") {
    const selectedFlight = sessionContext?.selected_flight;
    if (selectedFlight) {
      const booking = generateDemoBooking(selectedFlight as DemoFlight);
      const replyMsg = booking.status === "pending_approval"
        ? `📋 Booking submitted! Since this is out of policy, it's been sent to your manager for approval.\n\nRef: ${booking.booking_id}`
        : `✅ Booking confirmed!\n\n✈️ ${selectedFlight.airline} ${selectedFlight.flightNumber}\n${selectedFlight.origin} → ${selectedFlight.destination}\n🕐 ${selectedFlight.departure}\nPNR: ${booking.pnr}\n\nE-ticket sent to your email. Have a great trip! ✈️`;
      return buildResponse(replyMsg, {
        ...sessionContext, state: "booked", flights: [], search: null, selected_flight: null,
      }, history, message, { booking });
    }
    return buildResponse("Please select a flight first before confirming.", sessionContext, history, message);
  }

  // ── PREFERENCE ──
  if (action === "preference" && parsed.preference) {
    const prefs = parsed.preference;
    const parts = [];
    if (prefs.meal) parts.push(`🍽️ ${prefs.meal} meal`);
    if (prefs.seat) parts.push(`💺 ${prefs.seat} seat`);
    if (prefs.baggage) parts.push(`🧳 ${prefs.baggage} baggage`);

    const prefMsg = parsed.message || `Got it! I've noted your preferences: ${parts.join(", ")}. Say "confirm" to proceed with booking.`;
    return buildResponse(prefMsg, {
      ...sessionContext,
      preferences: { ...(sessionContext?.preferences || {}), ...prefs },
    }, history, message);
  }

  // ── SHOW ALL (reset filter) ──
  if (currentFlights.length > 0 && /show all|see all|all options|all flights|reset/i.test(message)) {
    return buildResponse(
      `Here are all ${currentFlights.length} flights:`,
      { ...sessionContext, state: "selecting" },
      history, message, { flights: currentFlights }
    );
  }

  // ── GENERAL RESPONSE ──
  const replyMsg = parsed.message || aiResponse.message || "I can help you search and book flights. Just tell me where you're headed!";
  return buildResponse(replyMsg, { ...sessionContext, state: sessionContext?.state || "idle" }, history, message);
}
