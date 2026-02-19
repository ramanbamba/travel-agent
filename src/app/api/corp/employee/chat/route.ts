import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchFlights } from "@/lib/supply";
import { evaluatePolicy } from "@/lib/policy/evaluate";
import type { CabinClass } from "@/lib/supply/types";
import { getAIProvider } from "@/lib/ai";
import { isDemoMode } from "@/lib/demo";
import { generateDemoFlights } from "@/lib/demo/mock-flights";
import type { DemoFlight } from "@/lib/demo/mock-flights";

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

    const ai = getAIProvider();
    const today = new Date().toISOString().split("T")[0];
    const dayName = new Date().toLocaleDateString("en-US", { weekday: "long" });

    // Build context-aware system prompt
    const flightsContext = currentFlights.length > 0
      ? `\n\nCURRENT FLIGHT RESULTS (user is viewing these):\n${currentFlights.map((f, i) =>
          `${i + 1}. ${f.airline} ${f.flightNumber} | ${f.origin}→${f.destination} | ${f.departure}-${f.arrival} | ₹${f.price} | ${f.stops === 0 ? "Direct" : f.stops + " stop"} | ${f.cabin} | ${f.compliant ? "In Policy" : "Out of Policy: " + f.violations.join(", ")}`
        ).join("\n")}\nSearch was: ${currentSearch?.origin}→${currentSearch?.destination} on ${currentSearch?.date}`
      : "";

    const systemPrompt = `You are SkySwift AI — a smart, friendly corporate travel assistant. You help employees search and book flights within their company's travel policy. Be conversational and natural.

Today is ${dayName}, ${today}.
Employee: ${member.full_name || "Team member"}

You have FULL conversation history. NEVER re-ask for info already provided.
${flightsContext}

Return ONLY valid JSON. Pick the right action based on context:

1. SEARCH — user wants to find flights (you have origin + destination + date):
{"action":"search","search_params":{"origin":"BLR","destination":"DEL","date":"2026-02-25","cabin_class":"economy"},"message":"Let me find flights for you..."}

2. FILTER — user wants to narrow down EXISTING flight results (time range, airline, price, direct only, etc.):
{"action":"filter","filter":{"time_range":{"from":"18:00","to":"20:00"},"airlines":["6E","AI"],"max_price":6000,"direct_only":true,"cabin_class":"business"},"message":"Here are the evening flights..."}
Only include filter fields the user mentioned. Omit fields they didn't specify.

3. SELECT — user picks a flight by number, airline name, cheapest, etc.:
{"action":"select","select":{"index":2},"message":"Great choice! IndiGo 6E1234..."}
index is 1-based matching the flight list shown.

4. CONFIRM — user wants to proceed with booking the selected flight:
{"action":"confirm","message":"Confirming your booking..."}

5. PREFERENCE — user mentions meal, seat, or baggage preferences:
{"action":"preference","preference":{"meal":"vegetarian","seat":"window","baggage":"15kg"},"message":"Noted! I'll add vegetarian meal and window seat."}
Only include fields mentioned.

6. NEW_SEARCH — user wants a completely new search (different route/date):
{"action":"search","search_params":{...},"message":"Sure, searching new route..."}

7. GREETING/HELP/CHAT — general conversation:
{"action":"general_response","message":"Your friendly response here"}

RULES:
- Indian airports: BLR=Bangalore/Bengaluru, DEL=Delhi, BOM=Mumbai, HYD=Hyderabad, MAA=Chennai, CCU=Kolkata, GOI=Goa, PNQ=Pune, AMD=Ahmedabad, JAI=Jaipur, COK=Kochi, TRV=Trivandrum, GAU=Guwahati, IXB=Bagdogra, SXR=Srinagar, IXC=Chandigarh
- Cabin classes: economy, premium_economy, business, first
- Combine info across the FULL conversation for search params.
- "25th" or "25th Feb" = 2026-02-25. "next Monday" = calculate from today.
- When flights are showing and user says "show me evening flights" or "only IndiGo" → use FILTER action.
- When user says "option 2", "I'll take the IndiGo one", "book the cheapest" → use SELECT action.
- When user says "confirm", "yes book it", "go ahead" → use CONFIRM action.
- When user mentions "veg meal", "window seat", "extra baggage" → use PREFERENCE action.
- Be concise, warm, professional. Use ₹ for prices. 1-2 sentences max.
- For greetings: welcome them by name and mention you help book flights within company policy.`;

    const aiResponse = await ai.chat({
      systemPrompt,
      history,
      message,
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const compliantCount = flights.filter((f: any) => f.compliant).length;
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
      data: { message: "Sorry, something went wrong. Please try again." },
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
