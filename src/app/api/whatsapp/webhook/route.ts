import { NextRequest, NextResponse } from "next/server";
import type { WhatsAppWebhookEvent } from "@/lib/whatsapp/types";
import { handleIncomingMessage, parseIncomingMessage } from "@/lib/whatsapp/handler";

// ── GET: Webhook Verification (required by Meta) ──

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[WhatsApp] Webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[WhatsApp] Webhook verification failed");
  return new NextResponse("Forbidden", { status: 403 });
}

// ── POST: Incoming Messages ──

export async function POST(req: NextRequest) {
  try {
    const body: WhatsAppWebhookEvent = await req.json();

    // Validate it's a WhatsApp event
    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ error: "Not a WhatsApp event" }, { status: 400 });
    }

    // Process each entry/change
    for (const entry of body.entry) {
      for (const change of entry.changes) {
        if (change.field !== "messages") continue;

        const value = change.value;

        // Skip status updates (delivery receipts, etc.)
        if (!value.messages || value.messages.length === 0) continue;

        const contactName = value.contacts?.[0]?.profile?.name;

        for (const msg of value.messages) {
          // Parse the incoming message into our normalized format
          const parsed = parseIncomingMessage(msg, contactName);

          if (parsed.type === "unknown") {
            console.log("[WhatsApp] Skipping unsupported message type:", msg.type);
            continue;
          }

          // Handle the message asynchronously (don't block the webhook response)
          // Meta expects a 200 response within 20 seconds
          handleIncomingMessage(parsed).catch((err) => {
            console.error("[WhatsApp] Handler error:", err);
          });
        }
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[WhatsApp] Webhook error:", error);
    // Still return 200 — Meta will retry on non-200 responses
    return NextResponse.json({ status: "error" });
  }
}
