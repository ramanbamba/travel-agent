import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai";
import { generateDemoFlights, generateDemoBooking } from "@/lib/demo/mock-flights";
import type { DemoFlight } from "@/lib/demo/mock-flights";

/**
 * Demo chat endpoint — no auth required.
 * Routes through the same AI intent parser but returns mock Indian flight data.
 * Used by /demo/whatsapp for investor demos.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, selected_offer, session_context } = body;

    if (!message) {
      return NextResponse.json({ data: null, error: "Message required" }, { status: 400 });
    }

    // If confirming a selected offer
    if (selected_offer && message.toLowerCase().includes("confirm")) {
      const booking = generateDemoBooking(selected_offer as DemoFlight);
      return NextResponse.json({
        data: {
          message: booking.status === "pending_approval"
            ? "Your booking has been sent for manager approval. You'll be notified once approved."
            : "Booking confirmed! Your e-ticket will be emailed shortly.",
          booking,
          session_context: { ...session_context, state: "booked" },
        },
        error: null,
      });
    }

    // Use AI to parse intent
    const ai = getAIProvider();
    const today = new Date().toISOString().split("T")[0];

    const systemPrompt = `You are a corporate travel assistant for SkySwift (an Indian corporate travel platform). Parse the user's message and extract flight search parameters.
Return JSON: { "action": "search" | "greeting" | "help" | "other", "origin": "IATA", "destination": "IATA", "date": "YYYY-MM-DD", "cabin_class": "economy|premium_economy|business|first", "message": "response text" }
If the user is greeting or asking for help, set action accordingly and provide a helpful message.
For search, extract origin/destination IATA codes (Indian airports: BLR=Bangalore, DEL=Delhi, BOM=Mumbai, HYD=Hyderabad, MAA=Chennai, CCU=Kolkata, GOI=Goa, PNQ=Pune, AMD=Ahmedabad, JAI=Jaipur) and date.
If date is relative (e.g., "next Monday"), calculate from today (${today}).
If information is missing, ask for it politely.
For greetings, welcome them and mention you can search and book flights within their company's travel policy.
Default cabin_class to "economy" if not specified.`;

    const aiResponse = await ai.chat({
      systemPrompt,
      history: session_context?.history ?? [],
      message,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any;
    try {
      const jsonMatch = aiResponse.message.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { action: "other", message: aiResponse.message };
    } catch {
      parsed = { action: "other", message: aiResponse.message };
    }

    if (parsed.action === "search" && parsed.origin && parsed.destination && parsed.date) {
      const flights = generateDemoFlights(
        parsed.origin,
        parsed.destination,
        parsed.date,
        parsed.cabin_class || "economy",
        5
      );

      const compliantCount = flights.filter((f) => f.compliant).length;
      const responseMsg = `Found ${flights.length} flights from ${parsed.origin} to ${parsed.destination} on ${parsed.date}. ${compliantCount}/${flights.length} are within your company's travel policy. Tap a flight to select it.`;

      return NextResponse.json({
        data: {
          message: responseMsg,
          flights,
          session_context: {
            ...session_context,
            state: "selecting",
            search: { origin: parsed.origin, destination: parsed.destination, date: parsed.date },
          },
        },
        error: null,
      });
    }

    // Non-search response
    return NextResponse.json({
      data: {
        message: parsed.message ?? "I can help you search and book flights within your company's travel policy. Tell me where you need to go!",
        session_context: { ...session_context, state: "idle" },
      },
      error: null,
    });
  } catch (error) {
    console.error("[Demo Chat] Error:", error);
    return NextResponse.json({
      data: { message: "Sorry, something went wrong. Please try again." },
      error: null,
    });
  }
}
