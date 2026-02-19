import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai";
import { generateDemoFlights, generateDemoBooking } from "@/lib/demo/mock-flights";
import type { DemoFlight } from "@/lib/demo/mock-flights";

// Keep history compact — last N exchanges
const MAX_HISTORY = 10;

type HistoryEntry = { role: "user" | "assistant"; content: string };

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

/**
 * Demo chat endpoint — no auth required.
 * Routes through the same AI intent parser but returns mock Indian flight data.
 * Used by /demo/whatsapp for investor demos.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, selected_offer, session_context } = body;
    const history: HistoryEntry[] = session_context?.history ?? [];

    if (!message) {
      return NextResponse.json({ data: null, error: "Message required" }, { status: 400 });
    }

    // If confirming a selected offer
    if (selected_offer && message.toLowerCase().includes("confirm")) {
      const booking = generateDemoBooking(selected_offer as DemoFlight);
      const replyMsg = booking.status === "pending_approval"
        ? "Your booking has been sent for manager approval. You'll be notified once approved."
        : "Booking confirmed! Your e-ticket will be emailed shortly.";
      return NextResponse.json({
        data: {
          message: replyMsg,
          booking,
          session_context: {
            ...session_context,
            state: "booked",
            history: appendHistory(history, message, replyMsg),
          },
        },
        error: null,
      });
    }

    // Use AI to parse intent
    const ai = getAIProvider();
    const today = new Date().toISOString().split("T")[0];
    const dayName = new Date().toLocaleDateString("en-US", { weekday: "long" });

    // Use the same JSON structure that parseAIJsonResponse expects
    const systemPrompt = `You are a corporate travel assistant for SkySwift (an Indian corporate travel platform). You help employees search and book flights.

IMPORTANT: You have full conversation history. Use context from previous messages to fill in missing details. Do NOT re-ask for information the user already provided.

Return ONLY valid JSON with this structure:
{"action":"search","search_params":{"origin":"BLR","destination":"DEL","date":"2026-02-23","cabin_class":"economy"},"message":"Searching for flights..."}

Rules:
- action: "search" (has origin+destination+date), "greeting", "help", or "general_response"
- search_params: only include when action is "search" and you have all 3: origin, destination, date
- Indian airports: BLR=Bangalore, DEL=Delhi, BOM=Mumbai, HYD=Hyderabad, MAA=Chennai, CCU=Kolkata, GOI=Goa, PNQ=Pune, AMD=Ahmedabad, JAI=Jaipur
- Today is ${dayName}, ${today}. Calculate relative dates from this.
- Default cabin_class to "economy" if not specified.
- CRITICAL: Combine info from the FULL conversation. If user said "flights to Chennai" earlier and now says "from Bangalore, Monday", you have all 3 fields — return action "search".
- Only ask a question if origin, destination, or date truly cannot be determined from the entire conversation.
- message: short, conversational (1-2 sentences). For search, say something like "Searching BLR to MAA flights..."
- For greetings: welcome them, mention you help book flights within company travel policy.`;

    const aiResponse = await ai.chat({
      systemPrompt,
      history,
      message,
    });

    // aiResponse is already parsed by parseAIJsonResponse into structured fields.
    // Use searchParams directly — no need to re-parse raw JSON.
    const action = aiResponse.action;
    const sp = aiResponse.searchParams;

    if (
      (action === "search" || sp) &&
      sp?.origin && sp?.destination && sp?.date
    ) {
      const flights = generateDemoFlights(
        sp.origin,
        sp.destination,
        sp.date,
        sp.cabinClass || "economy",
        5
      );

      const compliantCount = flights.filter((f) => f.compliant).length;
      const responseMsg = `Found ${flights.length} flights from ${sp.origin} to ${sp.destination} on ${sp.date}. ${compliantCount}/${flights.length} are within your company's travel policy. Tap a flight to select it.`;

      return NextResponse.json({
        data: {
          message: responseMsg,
          flights,
          session_context: {
            ...session_context,
            state: "selecting",
            search: { origin: sp.origin, destination: sp.destination, date: sp.date },
            history: appendHistory(history, message, responseMsg),
          },
        },
        error: null,
      });
    }

    // Non-search response
    const replyMsg = aiResponse.message || "I can help you search and book flights within your company's travel policy. Tell me where you need to go!";
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
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[Demo Chat] Error:", errMsg, error);
    return NextResponse.json({
      data: { message: "Sorry, something went wrong. Please try again." },
      error: null,
    });
  }
}
