// ============================================================================
// WhatsApp Message Handler
// Routes incoming messages based on session state.
// ============================================================================

import { createClient } from "@supabase/supabase-js";
import type { ParsedIncomingMessage } from "./types";
import {
  sendTextMessage,
  sendInteractiveButtons,
  markAsRead,
} from "./client";
import { IntentRouter } from "@/lib/ai/intent-router";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const intentRouter = new IntentRouter({ supabase });

// Rate limiting: simple in-memory store
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // messages per minute
const RATE_WINDOW = 60_000;

function checkRateLimit(phone: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(phone);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(phone, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ── Session Management ──

interface SessionData {
  id: string;
  phone_number: string;
  org_id: string | null;
  member_id: string | null;
  state: string;
  context: Record<string, unknown>;
  verified: boolean;
  last_message_at: string;
}

async function getOrCreateSession(phone: string): Promise<SessionData> {
  // Try to find existing session
  const { data: existing } = await supabase
    .from("whatsapp_sessions")
    .select("*")
    .eq("phone_number", phone)
    .single();

  if (existing) {
    // Check session expiry (30 min inactivity → reset to idle)
    const lastMsg = new Date(existing.last_message_at).getTime();
    const thirtyMin = 30 * 60 * 1000;
    if (Date.now() - lastMsg > thirtyMin && existing.state !== "idle") {
      await supabase
        .from("whatsapp_sessions")
        .update({ state: "idle", context: {}, last_message_at: new Date().toISOString() })
        .eq("id", existing.id);
      return { ...existing, state: "idle", context: {} };
    }

    // Update last_message_at
    await supabase
      .from("whatsapp_sessions")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", existing.id);

    return existing as SessionData;
  }

  // Create new session
  const { data: newSession, error } = await supabase
    .from("whatsapp_sessions")
    .insert({ phone_number: phone })
    .select("*")
    .single();

  if (error || !newSession) {
    throw new Error(`Failed to create session: ${error?.message}`);
  }

  return newSession as SessionData;
}

async function updateSession(
  sessionId: string,
  updates: Partial<Pick<SessionData, "state" | "context" | "org_id" | "member_id" | "verified">>
) {
  await supabase.from("whatsapp_sessions").update(updates).eq("id", sessionId);
}

// ── Message Logging ──

async function logMessage(
  phone: string,
  direction: "inbound" | "outbound",
  messageType: string,
  content: Record<string, unknown>
) {
  // Fire-and-forget
  supabase
    .from("whatsapp_message_log")
    .insert({ phone_number: phone, direction, message_type: messageType, content })
    .then();
}

// ── Registration Flow ──

async function handleRegistration(
  session: SessionData,
  message: ParsedIncomingMessage
): Promise<void> {
  const ctx = session.context as Record<string, string | undefined>;

  // Step 1: Ask for email
  if (!ctx.registration_step || ctx.registration_step === "ask_email") {
    // Check if the text looks like an email
    if (message.text.includes("@") && message.text.includes(".")) {
      const email = message.text.trim().toLowerCase();

      // Look up member by email across all orgs
      const { data: member } = await supabase
        .from("org_members")
        .select("id, org_id, full_name, email, status")
        .eq("email", email)
        .in("status", ["active", "invited"])
        .single();

      if (!member) {
        await sendTextMessage(
          message.from,
          "I couldn't find that email in any registered company. Please check with your admin to ensure you've been invited, or ask them to sign up at skyswift.ai."
        );
        return;
      }

      // Generate verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      await updateSession(session.id, {
        context: {
          registration_step: "verify_code",
          email,
          member_id: member.id,
          org_id: member.org_id,
          member_name: member.full_name,
          verification_code: code,
        },
      });

      // In mock mode, include the code in the message for testing
      const isMock = process.env.WHATSAPP_MOCK !== "false";
      await sendTextMessage(
        message.from,
        `Found you! I've sent a verification code to ${email}. Please share it here.${isMock ? `\n\n[Mock mode — code is: ${code}]` : ""}`
      );

      // TODO: Send actual verification email via Resend
      return;
    }

    // First message or not an email — ask for it
    await sendTextMessage(
      message.from,
      "Welcome to SkySwift! I'm your company's AI travel assistant.\n\nTo get started, please share your work email so I can connect you to your company's travel account."
    );
    await updateSession(session.id, {
      context: { registration_step: "ask_email" },
    });
    return;
  }

  // Step 2: Verify code
  if (ctx.registration_step === "verify_code") {
    const expectedCode = ctx.verification_code;
    const inputCode = message.text.trim().replace(/\s/g, "");

    if (inputCode === expectedCode) {
      // Verified! Link session to member
      await updateSession(session.id, {
        org_id: ctx.org_id as string,
        member_id: ctx.member_id as string,
        verified: true,
        state: "idle",
        context: {},
      });

      // Update org_member with phone and WhatsApp status
      await supabase
        .from("org_members")
        .update({
          phone: message.from,
          whatsapp_registered: true,
          status: "active",
          joined_at: new Date().toISOString(),
        })
        .eq("id", ctx.member_id);

      const name = (ctx.member_name as string)?.split(" ")[0] || "there";
      await sendTextMessage(
        message.from,
        `Verified! You're all set, ${name}.\n\nI can help you:\n` +
        `✈️ Book flights\n` +
        `📋 Check your bookings\n` +
        `🔄 Change or cancel trips\n` +
        `📊 View your travel summary\n\n` +
        `Just tell me where you need to go!`
      );
      return;
    }

    await sendTextMessage(
      message.from,
      "That code doesn't match. Please try again, or type your email to restart verification."
    );
    // Allow retry with email
    await updateSession(session.id, {
      context: { ...ctx, registration_step: "ask_email" },
    });
    return;
  }
}

// ── AI-Powered Intent Handler ──

async function handleMessageWithAI(
  session: SessionData,
  message: ParsedIncomingMessage
): Promise<void> {
  // Update conversation memory buffer (last 10 messages)
  const lastMessages = (
    (session.context as { last_messages?: string[] }).last_messages || []
  ).slice(-9);
  lastMessages.push(message.text);

  await updateSession(session.id, {
    context: { ...session.context, last_messages: lastMessages },
  });

  // Route through AI intent parser
  const result = await intentRouter.processMessage(
    {
      id: session.id,
      phone_number: session.phone_number,
      org_id: session.org_id,
      member_id: session.member_id,
      state: session.state,
      context: { ...session.context, last_messages: lastMessages },
      verified: session.verified,
    },
    message.text
  );

  // Send all response messages
  for (const msg of result.messages) {
    await sendTextMessage(message.from, msg);
  }

  // Update session state if changed
  if (result.newState || result.newContext) {
    const updates: Partial<Pick<SessionData, "state" | "context">> = {};
    if (result.newState) updates.state = result.newState;
    if (result.newContext) {
      updates.context = { ...result.newContext, last_messages: lastMessages };
    }
    await updateSession(session.id, updates);
  }

  // Store bot response in conversation memory
  if (result.messages.length > 0) {
    const updatedMessages = [...lastMessages, result.messages[0]].slice(-10);
    await updateSession(session.id, {
      context: {
        ...(result.newContext ?? session.context),
        last_messages: updatedMessages,
      },
    });
  }
}

// ── Selecting State — User picking from flight options ──

interface FlightOptionContext {
  offer_id: string;
  supplier: string;
  price: number;
  currency: string;
  airline_code: string;
  airline_name: string;
  compliance: { status: string; violations: string[] };
  detail: string;
}

async function handleSelectingMessage(
  session: SessionData,
  message: ParsedIncomingMessage
): Promise<void> {
  const text = message.text.trim();

  // Expect a number (1, 2, 3, etc.) or button reply
  if (/^[1-9]$/.test(text)) {
    const selectedIndex = parseInt(text) - 1;
    const options = (session.context as { flight_options?: FlightOptionContext[] }).flight_options;

    if (!options || selectedIndex >= options.length) {
      await sendTextMessage(message.from, "Invalid option. Please reply with a number from the list.");
      return;
    }

    const selected = options[selectedIndex];

    // Move to confirming state with selected flight details
    await updateSession(session.id, {
      state: "confirming",
      context: { ...session.context, selected_option: selectedIndex, selected_flight: selected },
    });

    // Show flight detail + confirm buttons
    let confirmMsg = `*Selected flight:*\n\n${selected.detail}`;
    if (selected.compliance.status === "warning") {
      confirmMsg += `\n\n⚠️ ${selected.compliance.violations.join(", ")}`;
      confirmMsg += "\n_This is outside policy. Your manager will be notified._";
    }
    confirmMsg += "\n\nBook this flight?";

    await sendInteractiveButtons(
      message.from,
      confirmMsg,
      [
        { type: "reply", reply: { id: "confirm_yes", title: "Yes, Book" } },
        { type: "reply", reply: { id: "confirm_no", title: "Cancel" } },
      ]
    );
    return;
  }

  // Cancel / start over
  if (/^(cancel|no|back|start over)/i.test(text)) {
    await updateSession(session.id, { state: "idle", context: {} });
    await sendTextMessage(message.from, "No problem! What else can I help with?");
    return;
  }

  // Non-numeric text during selecting — route through AI (might be "the cheaper one", "afternoon flights", etc.)
  await handleMessageWithAI(session, message);
}

// ── Confirming State — User confirming booking ──

async function handleConfirmingMessage(
  session: SessionData,
  message: ParsedIncomingMessage
): Promise<void> {
  const text = message.text.trim().toLowerCase();

  if (["yes", "confirm", "book", "confirm_yes"].includes(text) || text === "yes, book") {
    const ctx = session.context as {
      selected_flight?: FlightOptionContext;
      search_params?: { origin: string; destination: string; date: string; cabinClass?: string };
    };
    const selected = ctx.selected_flight;
    const searchParams = ctx.search_params;

    if (!selected || !session.org_id || !session.member_id) {
      await updateSession(session.id, { state: "idle", context: {} });
      await sendTextMessage(message.from, "Something went wrong. Let's start over — where do you need to fly?");
      return;
    }

    await sendTextMessage(message.from, "⏳ Processing your booking...");

    try {
      // Call corporate booking API
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";

      const bookRes = await fetch(`${baseUrl}/api/flights/corporate-book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offer_id: selected.offer_id,
          member_id: session.member_id,
          org_id: session.org_id,
          booking_channel: "whatsapp",
          flight_details: {
            origin: searchParams?.origin ?? "",
            destination: searchParams?.destination ?? "",
            departure_date: searchParams?.date ?? "",
            cabin_class: searchParams?.cabinClass ?? "economy",
            airline_code: selected.airline_code,
            airline_name: selected.airline_name,
            total_amount: selected.price,
            currency: selected.currency || "INR",
          },
          policy_compliant: selected.compliance.status === "compliant",
          policy_violations: selected.compliance.violations,
        }),
      });

      const bookResult = await bookRes.json();

      if (bookResult.error) {
        await sendTextMessage(message.from, `❌ Booking failed: ${bookResult.error}\n\nWant to try again?`);
      }
      // Success messages are sent by the corporate-book API directly via WhatsApp
    } catch (err) {
      console.error("[WhatsApp Handler] Booking error:", err);
      await sendTextMessage(message.from, "❌ Something went wrong with the booking. Please try again.");
    }

    await updateSession(session.id, { state: "idle", context: {} });
    return;
  }

  if (["no", "cancel", "confirm_no"].includes(text)) {
    await updateSession(session.id, { state: "idle", context: {} });
    await sendTextMessage(message.from, "Booking cancelled. What else can I help with?");
    return;
  }

  await sendInteractiveButtons(
    message.from,
    "Please confirm your booking.",
    [
      { type: "reply", reply: { id: "confirm_yes", title: "Yes, Book" } },
      { type: "reply", reply: { id: "confirm_no", title: "Cancel" } },
    ]
  );
}

// ── Main Handler ──

export async function handleIncomingMessage(
  message: ParsedIncomingMessage
): Promise<void> {
  const phone = message.from;

  // Rate limit check
  if (!checkRateLimit(phone)) {
    await sendTextMessage(phone, "You're sending messages too fast. Please wait a moment.");
    return;
  }

  // Log inbound
  await logMessage(phone, "inbound", message.type, {
    text: message.text,
    contact_name: message.contactName,
  });

  // Mark as read
  await markAsRead(message.messageId);

  try {
    // Get or create session
    const session = await getOrCreateSession(phone);

    // Route based on session state
    if (!session.verified) {
      await handleRegistration(session, message);
    } else {
      switch (session.state) {
        case "idle":
        case "searching":
          // All messages go through AI intent parser for context-aware responses
          await handleMessageWithAI(session, message);
          break;
        case "selecting":
          await handleSelectingMessage(session, message);
          break;
        case "confirming":
          await handleConfirmingMessage(session, message);
          break;
        case "awaiting_approval":
          // Allow AI to handle approval-state messages (e.g., "status", new searches)
          await handleMessageWithAI(session, message);
          break;
        default:
          // Reset to idle for unknown states
          await updateSession(session.id, { state: "idle", context: {} });
          await handleMessageWithAI(session, message);
          break;
      }
    }
  } catch (error) {
    console.error("[WhatsApp Handler] Error:", error);
    await sendTextMessage(
      phone,
      "Sorry, something went wrong. Please try again in a moment."
    );
  }
}

// ── Parse Incoming Webhook Message ──

export function parseIncomingMessage(
  msg: {
    from: string;
    id: string;
    timestamp: string;
    type: string;
    text?: { body: string };
    interactive?: {
      type: string;
      list_reply?: { id: string; title: string };
      button_reply?: { id: string; title: string };
    };
  },
  contactName?: string
): ParsedIncomingMessage {
  let text = "";
  let type: ParsedIncomingMessage["type"] = "unknown";

  if (msg.type === "text" && msg.text?.body) {
    text = msg.text.body;
    type = "text";
  } else if (msg.type === "interactive" && msg.interactive) {
    if (msg.interactive.type === "list_reply" && msg.interactive.list_reply) {
      text = msg.interactive.list_reply.id;
      type = "interactive_list";
    } else if (msg.interactive.type === "button_reply" && msg.interactive.button_reply) {
      text = msg.interactive.button_reply.id;
      type = "interactive_button";
    }
  }

  return {
    from: msg.from,
    messageId: msg.id,
    timestamp: msg.timestamp,
    type,
    text,
    contactName,
  };
}
