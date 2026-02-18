import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchFlights } from "@/lib/supply";
import { evaluatePolicy } from "@/lib/policy/evaluate";
import type { CabinClass } from "@/lib/supply/types";
import { getAIProvider } from "@/lib/ai";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = any;

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
    const { message, selected_offer } = body;

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
      return handleBooking(member, selected_offer);
    }

    // Use AI to parse intent
    const ai = getAIProvider();
    const systemPrompt = `You are a corporate travel assistant. Parse the user's message and extract flight search parameters.
Return JSON: { "action": "search" | "greeting" | "help" | "other", "origin": "IATA", "destination": "IATA", "date": "YYYY-MM-DD", "cabin_class": "economy|premium_economy|business|first", "message": "response text" }
If the user is greeting or asking for help, set action accordingly and provide a helpful message.
For search, extract origin/destination IATA codes and date. If date is relative (e.g., "next Monday"), calculate from today (${new Date().toISOString().split("T")[0]}).
If information is missing, ask for it in the message field.`;

    const aiResponse = await ai.chat({
      systemPrompt,
      history: [],
      message,
    });

    let parsed: DbRow;
    try {
      const jsonMatch = aiResponse.message.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { action: "other", message: aiResponse.message };
    } catch {
      parsed = { action: "other", message: aiResponse.message };
    }

    if (parsed.action === "search" && parsed.origin && parsed.destination && parsed.date) {
      // Search flights
      const searchResult = await searchFlights({
        origin: parsed.origin,
        destination: parsed.destination,
        departureDate: parsed.date,
        cabinClass: (parsed.cabin_class as CabinClass) || "economy",
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

      const flights = searchResult.offers.slice(0, 5).map((offer) => {
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
          origin: offer.segments[0]?.departure.airportCode ?? parsed.origin,
          destination: offer.segments[offer.segments.length - 1]?.arrival.airportCode ?? parsed.destination,
          price: offer.price.total,
          currency: offer.price.currency,
          stops: offer.stops,
          cabin: offer.segments[0]?.cabin ?? "economy",
          compliant: evaluation.compliant,
          violations: evaluation.violations,
        };
      });

      const compliantCount = flights.filter((f) => f.compliant).length;
      const responseMsg = flights.length > 0
        ? `Found ${flights.length} flights from ${parsed.origin} to ${parsed.destination} on ${parsed.date}. ${compliantCount}/${flights.length} are within policy. Tap a flight to select it.`
        : `No flights found for ${parsed.origin} to ${parsed.destination} on ${parsed.date}. Try different dates?`;

      return NextResponse.json({
        data: { message: responseMsg, flights },
        error: null,
      });
    }

    // Non-search response
    return NextResponse.json({
      data: { message: parsed.message ?? "I can help you search and book flights. Tell me where you need to go!" },
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
