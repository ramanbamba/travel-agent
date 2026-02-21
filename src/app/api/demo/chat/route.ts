import { NextRequest, NextResponse } from "next/server";
import { processDemoMessage } from "@/lib/demo/demo-handler";
import type { DemoFlight } from "@/lib/demo/mock-flights";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, selected_offer, session_context } = body;

    if (!message) {
      return NextResponse.json({ data: null, error: "Message required" }, { status: 400 });
    }

    const result = await processDemoMessage(
      message,
      session_context ?? {},
      selected_offer as DemoFlight | undefined
    );

    return NextResponse.json({ data: result, error: null });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[Demo Chat] Error:", errMsg, error);
    return NextResponse.json({
      data: { message: "Something's not working on my end right now. Try again in a moment." },
      error: null,
    });
  }
}
