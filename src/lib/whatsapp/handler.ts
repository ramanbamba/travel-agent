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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

// ── Idle State — Parse Intent ──

async function handleIdleMessage(
  session: SessionData,
  message: ParsedIncomingMessage
): Promise<void> {
  const text = message.text.trim().toLowerCase();

  // Simple greeting detection
  if (["hi", "hello", "hey", "hola", "namaste"].includes(text)) {
    // Load member name
    const { data: member } = await supabase
      .from("org_members")
      .select("full_name")
      .eq("id", session.member_id)
      .single();

    const name = member?.full_name?.split(" ")[0] || "there";
    await sendTextMessage(
      message.from,
      `Hey ${name}! Where do you need to fly? Just tell me like:\n\n` +
      `"Book BLR to DEL Monday morning"\n` +
      `"Show flights to Mumbai tomorrow"\n` +
      `"What's my booking status?"`
    );
    return;
  }

  // Help
  if (["help", "?", "what can you do"].includes(text)) {
    await sendTextMessage(
      message.from,
      "I can help you with:\n\n" +
      "✈️ *Book flights* — \"Book BLR to DEL Monday\"\n" +
      "🔍 *Search flights* — \"Show flights to Mumbai\"\n" +
      "📋 *Check bookings* — \"My bookings\" or \"Booking status\"\n" +
      "❌ *Cancel trips* — \"Cancel my Delhi flight\"\n" +
      "⚙️ *Preferences* — \"I prefer aisle seat\"\n" +
      "📊 *Travel summary* — \"How much have I spent?\"\n" +
      "❓ *Policy questions* — \"Can I book business class?\"\n\n" +
      "Just type what you need!"
    );
    return;
  }

  // For all other messages, we'll delegate to the AI intent parser (P4-05).
  // For now, provide a helpful placeholder response.
  // Store the message in context for when AI is wired up.
  await updateSession(session.id, {
    context: {
      last_messages: [
        ...((session.context as { last_messages?: string[] }).last_messages || []).slice(-9),
        message.text,
      ],
    },
  });

  // Placeholder: detect basic booking intent by keywords
  const hasCity = /\b(del|blr|bom|hyd|ccu|maa|goi|cok|jai|pnq|delhi|bangalore|bengaluru|mumbai|hyderabad|kolkata|chennai|goa|kochi|jaipur|pune)\b/i.test(text);
  const hasBookKeyword = /\b(book|fly|flight|ticket|travel)\b/i.test(text);

  if (hasCity && hasBookKeyword) {
    // Signal that we detected a booking intent — will be handled by P4-05/P4-06
    await updateSession(session.id, { state: "searching" });
    await sendTextMessage(
      message.from,
      "🔍 Searching for the best flights...\n\n(Flight search will be connected in the next update. Stay tuned!)"
    );
    // Reset back to idle for now
    await updateSession(session.id, { state: "idle" });
    return;
  }

  // Default response
  await sendTextMessage(
    message.from,
    "I'm not sure what you need. Try something like:\n\n" +
    "\"Book BLR to DEL Monday morning\"\n" +
    "\"Show flights to Mumbai tomorrow\"\n" +
    "\"My bookings\"\n\n" +
    "Or type *help* for all options."
  );
}

// ── Selecting State — User picking from flight options ──

async function handleSelectingMessage(
  session: SessionData,
  message: ParsedIncomingMessage
): Promise<void> {
  const text = message.text.trim();

  // Expect a number (1, 2, 3) or button reply
  if (/^[1-5]$/.test(text)) {
    const selectedIndex = parseInt(text) - 1;
    const options = (session.context as { flight_options?: unknown[] }).flight_options;

    if (!options || selectedIndex >= options.length) {
      await sendTextMessage(message.from, "Invalid option. Please reply with a number from the list.");
      return;
    }

    // Move to confirming state
    await updateSession(session.id, {
      state: "confirming",
      context: { ...session.context, selected_option: selectedIndex },
    });

    await sendInteractiveButtons(
      message.from,
      "Confirm booking?\n\n(Booking details will be shown here when flight search is connected.)",
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

  await sendTextMessage(message.from, "Please reply with a number (1-5) to select a flight, or type *cancel* to start over.");
}

// ── Confirming State — User confirming booking ──

async function handleConfirmingMessage(
  session: SessionData,
  message: ParsedIncomingMessage
): Promise<void> {
  const text = message.text.trim().toLowerCase();

  if (["yes", "confirm", "book", "confirm_yes"].includes(text) || text === "yes, book") {
    // Will be handled by P4-06 corporate booking flow
    await updateSession(session.id, { state: "idle", context: {} });
    await sendTextMessage(
      message.from,
      "✅ Booking confirmed!\n\n(Full booking flow will be connected in the next update.)\n\nNeed anything else?"
    );
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
          await handleIdleMessage(session, message);
          break;
        case "selecting":
          await handleSelectingMessage(session, message);
          break;
        case "confirming":
          await handleConfirmingMessage(session, message);
          break;
        case "awaiting_approval":
          await sendTextMessage(
            phone,
            "Your booking is waiting for manager approval. I'll notify you as soon as there's an update.\n\nType *status* to check, or start a new search."
          );
          break;
        default:
          // Reset to idle for unknown states
          await updateSession(session.id, { state: "idle", context: {} });
          await handleIdleMessage(session, message);
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
