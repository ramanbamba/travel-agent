import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchFlights } from "@/lib/supply";
import { evaluatePolicy } from "@/lib/policy/evaluate";
import type { CabinClass } from "@/lib/supply/types";
import { getAIProvider } from "@/lib/ai";
import { isDemoMode } from "@/lib/demo";
import { generateDemoFlights } from "@/lib/demo/mock-flights";
import type { DemoFlight } from "@/lib/demo/mock-flights";
import {
  parseSelection,
  isConfirmation,
  isCancellation,
} from "@/lib/ai/selection-parser";
import { buildWebChatSystemPrompt } from "@/lib/ai/prompts/corporate-system-prompt";
import { fixCommonTypos } from "@/lib/ai/edge-cases";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = any;

type HistoryEntry = { role: "user" | "assistant"; content: string };

const MAX_HISTORY = 14;

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

function reply(
  message: string,
  sessionContext: Record<string, unknown>,
  history: HistoryEntry[],
  userMsg: string,
  extra?: Record<string, unknown>
) {
  return NextResponse.json({
    data: {
      message,
      ...extra,
      session_context: {
        ...sessionContext,
        history: appendHistory(history, userMsg, message),
      },
    },
    error: null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const db = supabase as DbRow;
    const body = await req.json();
    const { message, selected_offer, session_context } = body;
    const history: HistoryEntry[] = session_context?.history ?? [];
    const currentFlights: DemoFlight[] = session_context?.flights ?? [];
    const currentSearch = session_context?.search ?? null;

    if (!message) {
      return NextResponse.json({ data: null, error: "Message required" }, { status: 400 });
    }

    // Load member + policy
    const { data: member } = await db
      .from("org_members")
      .select("id, org_id, role, seniority_level, full_name")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .single();

    if (!member) {
      return NextResponse.json({
        data: { message: "You don't have an active organization membership." },
        error: null,
      });
    }

    const { data: policy } = await db
      .from("travel_policies")
      .select("*")
      .eq("org_id", member.org_id)
      .eq("is_active", true)
      .limit(1)
      .single();

    // If confirming a selected offer (from flight card tap)
    if (selected_offer && message.toLowerCase().includes("confirm")) {
      const result = await handleBooking(member, selected_offer);
      return result;
    }

    // ── Deterministic handling for selecting/confirming states ──
    // Handle common patterns WITHOUT calling AI

    const sessionState = session_context?.state ?? "idle";

    // In selecting state: try deterministic selection first
    if (sessionState === "selecting" && currentFlights.length > 0) {
      // Try cancellation
      if (isCancellation(message)) {
        return reply("No problem! What else can I help with?", {
          ...session_context, state: "idle", flights: [], search: null,
        }, history, message);
      }

      // Try deterministic selection
      const selIdx = parseSelection(message, currentFlights.map(f => ({
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

        return reply(selectMsg, {
          ...session_context, state: "confirming", selected_flight: flight,
        }, history, message);
      }

      // If modification request, fall through to AI
      // If not a selection or modification, also fall through but keep state context
    }

    // In confirming state: handle confirmation/cancellation
    if (sessionState === "confirming") {
      if (isConfirmation(message)) {
        const selectedFlight = session_context?.selected_flight;
        if (selectedFlight) {
          if (isDemoMode()) {
            const { generateDemoBooking } = await import("@/lib/demo/mock-flights");
            const booking = generateDemoBooking(selectedFlight as DemoFlight);
            const replyMsg = booking.status === "pending_approval"
              ? `📋 Booking submitted! Since this is out of policy, it's been sent to your manager for approval.\n\nRef: ${booking.booking_id}`
              : `✅ Booking confirmed!\n\n✈️ ${selectedFlight.airline} ${selectedFlight.flightNumber}\n${selectedFlight.origin} → ${selectedFlight.destination}\n🕐 ${selectedFlight.departure}\nPNR: ${booking.pnr}\n\nHave a great trip! ✈️`;
            return reply(replyMsg, {
              ...session_context, state: "idle", flights: [], search: null, selected_flight: null,
            }, history, message, { booking });
          } else {
            const result = await handleBooking(member, selectedFlight);
            return result;
          }
        }
      }

      if (isCancellation(message)) {
        return reply("No problem! Here are your options again — pick a flight:", {
          ...session_context, state: "selecting", selected_flight: null,
        }, history, message, { flights: currentFlights });
      }

      // Modification request in confirming → fall through to AI for re-search
    }

    // Fix common typos before AI processing
    const cleanedMessage = fixCommonTypos(message);

    const ai = getAIProvider();

    // Build context-aware system prompt using shared module
    const systemPrompt = buildWebChatSystemPrompt({
      employeeName: member.full_name || "Team member",
      currentFlights: currentFlights.length > 0 ? currentFlights : undefined,
      currentSearch: currentSearch ?? undefined,
      sessionState: sessionState,
    });

    const aiResponse = await ai.chat({
      systemPrompt,
      history,
      message: cleanedMessage,
    });

    // Parse AI response — try raw first, then structured fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any = null;
    try {
      const rawText = aiResponse.raw || aiResponse.message;
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch { /* fall through */ }

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
      let flights;

      if (isDemoMode()) {
        flights = generateDemoFlights(sp.origin, sp.destination, sp.date, sp.cabin_class || "economy", 8);
      } else {
        // Production: use real supply layer
        const searchResult = await searchFlights({
          origin: sp.origin,
          destination: sp.destination,
          departureDate: sp.date,
          cabinClass: (sp.cabin_class as CabinClass) || "economy",
          currency: "INR",
          maxResults: 8,
        });

        const policyRules = {
          flight_rules: policy?.flight_rules,
          spend_limits: policy?.spend_limits,
          approval_rules: policy?.approval_rules,
          booking_rules: policy?.booking_rules,
          policy_mode: policy?.policy_mode,
        };

        flights = searchResult.offers.slice(0, 8).map((offer) => {
          const evaluation = evaluatePolicy(
            {
              price: offer.price,
              cabin: offer.segments[0]?.cabin ?? "economy",
              stops: offer.stops,
              airlineCode: offer.segments[0]?.airlineCode,
              departureTime: offer.segments[0]?.departure.time,
              refundable: offer.conditions?.refundable,
              origin: offer.segments[0]?.departure.airportCode,
              destination: offer.segments[offer.segments.length - 1]?.arrival.airportCode,
            },
            {
              seniority_level: member.seniority_level ?? "individual_contributor",
              role: member.role,
            },
            policyRules
          );

          return {
            offer_id: offer.id,
            airline: offer.segments[0]?.airline ?? offer.segments[0]?.airlineCode ?? "Unknown",
            airlineCode: offer.segments[0]?.airlineCode ?? "",
            flightNumber: offer.segments[0]?.flightNumber ?? "",
            departure: offer.segments[0]?.departure.time
              ? new Date(offer.segments[0].departure.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
              : "",
            arrival: offer.segments[offer.segments.length - 1]?.arrival.time
              ? new Date(offer.segments[offer.segments.length - 1].arrival.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
              : "",
            origin: offer.segments[0]?.departure.airportCode ?? sp.origin,
            destination: offer.segments[offer.segments.length - 1]?.arrival.airportCode ?? sp.destination,
            price: offer.price.total,
            currency: offer.price.currency,
            stops: offer.stops,
            cabin: offer.segments[0]?.cabin ?? "economy",
            duration: "",
            compliant: evaluation.compliant,
            violations: evaluation.violations,
          };
        });
      }

      const compliantCount = flights.filter((f: { compliant?: boolean }) => f.compliant).length;
      const responseMsg = parsed.message || `Found ${flights.length} flights from ${sp.origin} to ${sp.destination}. ${compliantCount} are within policy. You can filter by time, airline, or price — or tap a flight to select it.`;

      return reply(responseMsg, {
        ...session_context,
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
        if (isDemoMode()) {
          const newFlights = generateDemoFlights(
            currentSearch.origin, currentSearch.destination, currentSearch.date,
            f.cabin_class, 8
          );
          return reply(
            parsed.message || `Here are ${f.cabin_class} class options:`,
            { ...session_context, state: "selecting", flights: newFlights, search: { ...currentSearch, cabin_class: f.cabin_class } },
            history, message, { flights: newFlights }
          );
        }
      }

      if (filtered.length === 0) {
        return reply(
          parsed.message || "No flights match that filter. Try adjusting your criteria, or say \"show all\" to see all options again.",
          { ...session_context },
          history, message
        );
      }

      return reply(
        parsed.message || `Here are ${filtered.length} matching flights:`,
        { ...session_context, state: "selecting" },
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

        return reply(selectMsg, {
          ...session_context,
          state: "confirming",
          selected_flight: flight,
        }, history, message);
      }
    }

    // ── CONFIRM ──
    if (action === "confirm") {
      const selectedFlight = session_context?.selected_flight;
      if (selectedFlight) {
        if (isDemoMode()) {
          // Demo mode: generate mock booking
          const { generateDemoBooking } = await import("@/lib/demo/mock-flights");
          const booking = generateDemoBooking(selectedFlight as DemoFlight);
          const replyMsg = booking.status === "pending_approval"
            ? `📋 Booking submitted! Since this is out of policy, it's been sent to your manager for approval. You'll get a notification once approved.\n\nRef: ${booking.booking_id}`
            : `✅ Booking confirmed!\n\n✈️ ${selectedFlight.airline} ${selectedFlight.flightNumber}\n${selectedFlight.origin} → ${selectedFlight.destination}\n🕐 ${selectedFlight.departure}\nPNR: ${booking.pnr}\n\nE-ticket sent to your email. Have a great trip! ✈️`;
          return reply(replyMsg, {
            ...session_context, state: "booked", flights: [], search: null, selected_flight: null,
          }, history, message, { booking });
        } else {
          // Production: real booking via corporate-book API
          const result = await handleBooking(member, selectedFlight);
          return result;
        }
      }
      return reply("Please select a flight first before confirming. You can say a flight number or \"option 1\".", session_context, history, message);
    }

    // ── PREFERENCE ──
    if (action === "preference" && parsed.preference) {
      const prefs = parsed.preference;
      const parts = [];
      if (prefs.meal) parts.push(`🍽️ ${prefs.meal} meal`);
      if (prefs.seat) parts.push(`💺 ${prefs.seat} seat`);
      if (prefs.baggage) parts.push(`🧳 ${prefs.baggage} baggage`);

      const prefMsg = parsed.message || `Got it! I've noted your preferences: ${parts.join(", ")}. Say "confirm" to proceed with booking.`;
      return reply(prefMsg, {
        ...session_context,
        preferences: { ...(session_context?.preferences || {}), ...prefs },
      }, history, message);
    }

    // ── SHOW ALL (reset filter) ──
    if (currentFlights.length > 0 && /show all|see all|all options|all flights|reset/i.test(message)) {
      return reply(
        `Here are all ${currentFlights.length} flights:`,
        { ...session_context, state: "selecting" },
        history, message, { flights: currentFlights }
      );
    }

    // ── GENERAL RESPONSE ──
    const replyMsg = parsed.message || aiResponse.message || "I can help you search and book flights within your company policy. Just tell me where you're headed!";
    return reply(replyMsg, { ...session_context, state: session_context?.state || "idle" }, history, message);

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[Employee Chat] Error:", errMsg, error);
    return NextResponse.json({
      data: { message: "Something's not working on my end right now. Try again in a moment." },
      error: null,
    });
  }
}

async function handleBooking(
  member: DbRow,
  offer: DbRow,
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const bookRes = await fetch(
      `${baseUrl}/api/flights/corporate-book`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offer_id: offer.offer_id,
          member_id: member.id,
          org_id: member.org_id,
          booking_channel: "web",
          flight_details: {
            origin: offer.origin,
            destination: offer.destination,
            departure_date: new Date().toISOString().split("T")[0],
            cabin_class: offer.cabin ?? "economy",
            airline_code: offer.airlineCode,
            airline_name: offer.airline,
            total_amount: offer.price,
            currency: offer.currency ?? "INR",
          },
          policy_compliant: offer.compliant ?? true,
          policy_violations: offer.violations ?? [],
        }),
      }
    );

    const bookJson = await bookRes.json();

    if (bookJson.data) {
      return NextResponse.json({
        data: {
          message: bookJson.data.status === "pending_approval"
            ? "Your booking has been sent for manager approval. You'll be notified once approved."
            : "Booking confirmed! Your e-ticket will be available in My Trips.",
          booking: {
            booking_id: bookJson.data.booking_id,
            status: bookJson.data.status,
            pnr: bookJson.data.pnr,
            message: bookJson.data.message ?? "Booking processed",
          },
        },
        error: null,
      });
    }

    return NextResponse.json({
      data: { message: "Booking failed: " + (bookJson.error ?? "Unknown error") },
      error: null,
    });
  } catch (err) {
    console.error("[Employee Chat] Booking error:", err);
    return NextResponse.json({
      data: { message: "Booking failed. Please try again." },
      error: null,
    });
  }
}
