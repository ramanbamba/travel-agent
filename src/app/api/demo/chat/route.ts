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
Return ONLY valid JSON, no other text. Use this exact format:
{ "action": "search", "origin": "IATA", "destination": "IATA", "date": "YYYY-MM-DD", "cabin_class": "economy", "message": "response text" }

Rules:
- action must be one of: "search", "greeting", "help", "other"
- For search, extract origin/destination IATA codes. Indian airports: BLR=Bangalore, DEL=Delhi, BOM=Mumbai, HYD=Hyderabad, MAA=Chennai, CCU=Kolkata, GOI=Goa, PNQ=Pune, AMD=Ahmedabad, JAI=Jaipur
- If date is relative (e.g., "next Monday", "tomorrow"), calculate from today (${today}). Today is a ${new Date().toLocaleDateString("en-US", { weekday: "long" })}.
- Default cabin_class to "economy" if not specified.
- If information is missing, set action to "other" and ask in the message field.
- For greetings, set action to "greeting" and welcome them.`;

    const aiResponse = await ai.chat({
      systemPrompt,
      history: session_context?.history ?? [],
      message,
    });

    // ai.chat() returns AIProviderResponse with parsed fields.
    // Use the raw text to extract JSON since parseAIJsonResponse consumes it
    // into a different structure (action/searchParams) than what this demo expects.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any;
    try {
      const rawText = aiResponse.raw || aiResponse.message;
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      parsed = null;
    }

    // Fallback: use the structured response from parseAIJsonResponse
    if (!parsed) {
      parsed = {
        action: aiResponse.action === "search" ? "search" : "other",
        origin: aiResponse.searchParams?.origin,
        destination: aiResponse.searchParams?.destination,
        date: aiResponse.searchParams?.date,
        cabin_class: aiResponse.searchParams?.cabinClass || "economy",
        message: aiResponse.message,
      };
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
        message: parsed.message ?? aiResponse.message ?? "I can help you search and book flights within your company's travel policy. Tell me where you need to go!",
        session_context: { ...session_context, state: "idle" },
      },
      error: null,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[Demo Chat] Error:", errMsg, error);
    return NextResponse.json({
      data: { message: "Sorry, something went wrong. Please try again." },
      error: null,
    });
  }
}
