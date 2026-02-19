import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchFlights } from "@/lib/supply";
import { evaluatePolicy } from "@/lib/policy/evaluate";
import type { CabinClass } from "@/lib/supply/types";
import { getAIProvider } from "@/lib/ai";
import { isDemoMode } from "@/lib/demo";
import { generateDemoFlights } from "@/lib/demo/mock-flights";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = any;

type HistoryEntry = { role: "user" | "assistant"; content: string };

const MAX_HISTORY = 10;

function appendHistory(
  existing: HistoryEntry[],
  userMsg: string,
  assistantMsg: string
): HistoryEntry[] {
  const updated = [
    ...(existing || []),
    { role: "user" as const, content: userMsg },
    { role: "assistant" as const, content: assistantMsg },
  ];
  return updated.slice(-MAX_HISTORY);
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

    // If user is confirming a selected offer
    if (selected_offer && message.toLowerCase().includes("confirm")) {
      const result = await handleBooking(member, selected_offer);
      return result;
    }

    // Use AI to parse intent
    const ai = getAIProvider();
    const today = new Date().toISOString().split("T")[0];
    const dayName = new Date().toLocaleDateString("en-US", { weekday: "long" });

    const systemPrompt = `You are a corporate travel assistant for SkySwift. You help employees search and book flights within their company's travel policy.

IMPORTANT: You have full conversation history. Use context from previous messages to fill in missing details. Do NOT re-ask for information the user already provided.

Return ONLY valid JSON with this structure:
{"action":"search","search_params":{"origin":"BLR","destination":"DEL","date":"2026-02-23","cabin_class":"economy"},"message":"Searching for flights..."}

Rules:
- action: "search" (has origin+destination+date), "greeting", "help", or "general_response"
- search_params: only include when action is "search" and you have all 3: origin, destination, date
- Indian airports: BLR=Bangalore, DEL=Delhi, BOM=Mumbai, HYD=Hyderabad, MAA=Chennai, CCU=Kolkata, GOI=Goa, PNQ=Pune, AMD=Ahmedabad, JAI=Jaipur
- Today is ${dayName}, ${today}. Calculate relative dates from this.
- Default cabin_class to "economy" if not specified.
- CRITICAL: Combine info from the FULL conversation. If user said "flights to Mumbai" earlier and now says "from Bangalore, Thursday", you have all 3 fields — return action "search".
- Only ask a question if origin, destination, or date truly cannot be determined from the entire conversation.
- message: short, conversational (1-2 sentences).
- For greetings: welcome them, mention you help book flights within company travel policy.`;

    const aiResponse = await ai.chat({
      systemPrompt,
      history,
      message,
    });

    // Use structured fields from parseAIJsonResponse
    const action = aiResponse.action;
    const sp = aiResponse.searchParams;

    if (
      (action === "search" || sp) &&
      sp?.origin && sp?.destination && sp?.date
    ) {
      const cabinClass = (sp.cabinClass as CabinClass) || "economy";
      let flights;

      if (isDemoMode()) {
        // Demo mode: use Indian mock flights (same as WhatsApp demo)
        flights = generateDemoFlights(sp.origin, sp.destination, sp.date, cabinClass, 5);
      } else {
        // Production: use real supply layer
        const searchResult = await searchFlights({
          origin: sp.origin,
          destination: sp.destination,
          departureDate: sp.date,
          cabinClass,
          currency: "INR",
          maxResults: 5,
        });

        const policyRules = {
          flight_rules: policy?.flight_rules,
          spend_limits: policy?.spend_limits,
          approval_rules: policy?.approval_rules,
          booking_rules: policy?.booking_rules,
          policy_mode: policy?.policy_mode,
        };

        flights = searchResult.offers.slice(0, 5).map((offer) => {
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
            compliant: evaluation.compliant,
            violations: evaluation.violations,
          };
        });
      }

      const compliantCount = flights.filter((f) => f.compliant).length;
      const responseMsg = flights.length > 0
        ? `Found ${flights.length} flights from ${sp.origin} to ${sp.destination} on ${sp.date}. ${compliantCount}/${flights.length} are within policy. Tap a flight to select it.`
        : `No flights found for ${sp.origin} to ${sp.destination} on ${sp.date}. Try different dates?`;

      return NextResponse.json({
        data: {
          message: responseMsg,
          flights,
          session_context: {
            ...session_context,
            state: "selecting",
            history: appendHistory(history, message, responseMsg),
          },
        },
        error: null,
      });
    }

    // Non-search response
    const replyMsg = aiResponse.message || "I can help you search and book flights. Tell me where you need to go!";
    return NextResponse.json({
      data: {
        message: replyMsg,
        session_context: {
          ...session_context,
          state: "idle",
          history: appendHistory(history, message, replyMsg),
        },
      },
      error: null,
    });
  } catch (error) {
    console.error("[Employee Chat] Error:", error);
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
