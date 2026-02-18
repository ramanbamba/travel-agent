import { NextRequest, NextResponse } from "next/server";
import { handleIncomingMessage } from "@/lib/whatsapp/handler";
import type { ParsedIncomingMessage } from "@/lib/whatsapp/types";

// Simulator endpoint — only available in development / mock mode
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production" && process.env.WHATSAPP_MOCK === "false") {
    return NextResponse.json({ error: "Simulator not available in production" }, { status: 403 });
  }

  try {
    const { phone, text } = await req.json();

    if (!phone || !text) {
      return NextResponse.json({ error: "phone and text are required" }, { status: 400 });
    }

    // Capture outgoing messages by intercepting console.log
    const capturedMessages: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      const msg = args.join(" ");
      if (msg.includes("[WhatsApp Mock] Sending:")) {
        try {
          const jsonStr = msg.replace("[WhatsApp Mock] Sending:", "").trim();
          const payload = JSON.parse(jsonStr);
          // Extract the text body from different message types
          if (payload.type === "text") {
            capturedMessages.push(payload.text.body);
          } else if (payload.type === "interactive") {
            const interactive = payload.interactive;
            let text = interactive.body?.text || "";
            if (interactive.type === "button" && interactive.action?.buttons) {
              const btns = interactive.action.buttons
                .map((b: { reply: { title: string } }) => b.reply.title)
                .join(" | ");
              text += `\n\n[Buttons: ${btns}]`;
            }
            if (interactive.type === "list" && interactive.action?.sections) {
              for (const section of interactive.action.sections) {
                for (const row of section.rows) {
                  text += `\n• ${row.title}${row.description ? ` — ${row.description}` : ""}`;
                }
              }
            }
            capturedMessages.push(text);
          } else if (payload.type === "document") {
            capturedMessages.push(`[Document: ${payload.document.filename}]${payload.document.caption ? `\n${payload.document.caption}` : ""}`);
          }
        } catch {
          // Not a JSON message, ignore
        }
      }
      originalLog.apply(console, args);
    };

    // Create a parsed message
    const parsed: ParsedIncomingMessage = {
      from: phone,
      messageId: `sim_${Date.now()}`,
      timestamp: Math.floor(Date.now() / 1000).toString(),
      type: "text",
      text,
      contactName: "Simulator User",
    };

    // Process the message
    await handleIncomingMessage(parsed);

    // Restore console.log
    console.log = originalLog;

    // Get session state
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: session } = await supabase
      .from("whatsapp_sessions")
      .select("state, context, verified, org_id, member_id")
      .eq("phone_number", phone)
      .single();

    return NextResponse.json({
      data: {
        responses: capturedMessages,
        session: session || null,
      },
      error: null,
    });
  } catch (error) {
    console.error("Simulator error:", error);
    return NextResponse.json({ error: "Simulation failed" }, { status: 500 });
  }
}
