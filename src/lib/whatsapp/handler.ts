// ============================================================================
// WhatsApp Message Handler
// Routes incoming messages based on session state with proper conversation
// memory and deterministic selection parsing.
// ============================================================================

import { createClient } from "@supabase/supabase-js";
import type { ParsedIncomingMessage } from "./types";
import {
  sendTextMessage,
  sendInteractiveButtons,
  markAsRead,
} from "./client";
import { IntentRouter } from "@/lib/ai/intent-router";
import {
  parseSelection,
  isConfirmation,
  isCancellation,
  isModificationRequest,
} from "@/lib/ai/selection-parser";
import { fixCommonTypos, isGibberish } from "@/lib/ai/edge-cases";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const intentRouter = new IntentRouter({ supabase });

// ── Constants ──

const MAX_MESSAGES = 20; // 10 turns (user + assistant)
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const RATE_LIMIT = 20;
const RATE_WINDOW = 60_000;

// ── Conversation Message ──

interface ContextMessage {
  role: "user" | "assistant";
  content: string;
  ts: string;
}

// Rate limiting: simple in-memory store
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

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
  context: SessionContext;
  verified: boolean;
  last_message_at: string;
}

interface FlightOptionContext {
  offer_id: string;
  supplier: string;
  price: number;
  currency: string;
  airline_code: string;
  airline_name: string;
  departure_time?: string;
  duration_minutes?: number;
  stops?: number;
  compliance: { status: string; violations: string[] };
  detail: string;
}

interface SessionContext {
  // Rolling conversation history
  messages?: ContextMessage[];
  // Current state machine data
  search_params?: {
    origin: string;
    destination: string;
    date: string;
    cabinClass?: string;
    time_preference?: string;
  };
  flight_options?: FlightOptionContext[];
  selected_option?: number;
  selected_flight?: FlightOptionContext;
  // Registration flow
  registration_step?: string;
  email?: string;
  member_id?: string;
  org_id?: string;
  member_name?: string;
  verification_code?: string;
  // Preserved across timeout
  [key: string]: unknown;
}

function getMessages(ctx: SessionContext): ContextMessage[] {
  return ctx.messages ?? [];
}

function appendMessage(
  ctx: SessionContext,
  role: "user" | "assistant",
  content: string
): SessionContext {
  const messages = [...getMessages(ctx), { role, content, ts: new Date().toISOString() }];
  // Cap at MAX_MESSAGES
  const trimmed = messages.length > MAX_MESSAGES ? messages.slice(-MAX_MESSAGES) : messages;
  return { ...ctx, messages: trimmed };
}

async function getOrCreateSession(phone: string): Promise<SessionData> {
  const { data: existing } = await supabase
    .from("whatsapp_sessions")
    .select("*")
    .eq("phone_number", phone)
    .single();

  if (existing) {
    const lastMsg = new Date(existing.last_message_at).getTime();
    const ctx = (existing.context ?? {}) as SessionContext;

    // Session timeout: reset state but KEEP messages + preferences
    if (Date.now() - lastMsg > SESSION_TIMEOUT_MS && existing.state !== "idle") {
      const resetCtx: SessionContext = {
        messages: ctx.messages, // keep conversation memory
      };
      await supabase
        .from("whatsapp_sessions")
        .update({ state: "idle", context: resetCtx, last_message_at: new Date().toISOString() })
        .eq("id", existing.id);
      return { ...existing, state: "idle", context: resetCtx } as SessionData;
    }

    await supabase
      .from("whatsapp_sessions")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", existing.id);

    return { ...existing, context: ctx } as SessionData;
  }

  const { data: newSession, error } = await supabase
    .from("whatsapp_sessions")
    .insert({ phone_number: phone })
    .select("*")
    .single();

  if (error || !newSession) {
    throw new Error(`Failed to create session: ${error?.message}`);
  }

  return { ...newSession, context: {} } as SessionData;
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
  const ctx = session.context;

  // Step 1: Ask for email
  if (!ctx.registration_step || ctx.registration_step === "ask_email") {
    if (message.text.includes("@") && message.text.includes(".")) {
      const email = message.text.trim().toLowerCase();

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

      const isMock = process.env.WHATSAPP_MOCK !== "false";
      await sendTextMessage(
        message.from,
        `Found you! I've sent a verification code to ${email}. Please share it here.${isMock ? `\n\n[Mock mode — code is: ${code}]` : ""}`
      );
      return;
    }

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
      await updateSession(session.id, {
        org_id: ctx.org_id as string,
        member_id: ctx.member_id as string,
        verified: true,
        state: "idle",
        context: { messages: [] },
      });

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
  // Append user message to conversation history
  let ctx = appendMessage(session.context, "user", message.text);

  // Route through AI intent parser with full history
  const result = await intentRouter.processMessage(
    {
      id: session.id,
      phone_number: session.phone_number,
      org_id: session.org_id,
      member_id: session.member_id,
      state: session.state,
      context: ctx as Record<string, unknown>,
      verified: session.verified,
    },
    message.text
  );

  // Send all response messages
  for (const msg of result.messages) {
    await sendTextMessage(message.from, msg);
  }

  // Append bot response to conversation history
  if (result.messages.length > 0) {
    const botReply = result.messages.join("\n\n");
    ctx = appendMessage(
      result.newContext ? { ...result.newContext, messages: ctx.messages } as SessionContext : ctx,
      "assistant",
      botReply
    );
  }

  // Merge new context (flight_options, search_params, etc.) with updated messages
  const finalCtx: SessionContext = {
    ...(result.newContext ?? ctx),
    messages: ctx.messages,
  };

  await updateSession(session.id, {
    state: result.newState ?? session.state,
    context: finalCtx as Record<string, unknown>,
  });
}

// ── Selecting State — User picking from flight options ──

async function handleSelectingMessage(
  session: SessionData,
  message: ParsedIncomingMessage
): Promise<void> {
  const text = message.text.trim();
  const options = session.context.flight_options;

  // 1. Try deterministic selection (numbers, ordinals, airline names, superlatives)
  if (options && options.length > 0) {
    const selectedIdx = parseSelection(text, options.map(o => ({
      airline_name: o.airline_name,
      airline_code: o.airline_code,
      price: o.price,
      departure_time: o.departure_time,
      duration_minutes: o.duration_minutes,
      stops: o.stops,
    })));

    if (selectedIdx !== null && selectedIdx < options.length) {
      await selectFlight(session, message, options[selectedIdx], selectedIdx);
      return;
    }
  }

  // 2. Check for cancellation
  if (isCancellation(text)) {
    const ctx = appendMessage(session.context, "user", text);
    const resetCtx: SessionContext = { messages: ctx.messages };
    await updateSession(session.id, {
      state: "idle",
      context: resetCtx as Record<string, unknown>,
    });
    const reply = "No problem! What else can I help with?";
    const finalCtx = appendMessage(resetCtx, "assistant", reply);
    await updateSession(session.id, { context: finalCtx as Record<string, unknown> });
    await sendTextMessage(message.from, reply);
    return;
  }

  // 3. Check for modification request ("actually Tuesday", "make it afternoon")
  if (isModificationRequest(text)) {
    // Route through AI — it will re-parse with conversation history and do a new search
    await handleMessageWithAI(session, message);
    return;
  }

  // 4. Fallback: try AI interpretation (might be a complex reference)
  // But first, remind user about pending selection
  if (options && options.length > 0) {
    // Add state context hint so AI knows about pending selection
    await handleMessageWithAI(session, message);
  } else {
    // No options cached — something went wrong, reset to idle
    await updateSession(session.id, { state: "idle" });
    await handleMessageWithAI(session, message);
  }
}

async function selectFlight(
  session: SessionData,
  message: ParsedIncomingMessage,
  selected: FlightOptionContext,
  idx: number
): Promise<void> {
  // Append selection to conversation history
  let ctx = appendMessage(session.context, "user", message.text);
  ctx = {
    ...ctx,
    selected_option: idx,
    selected_flight: selected,
  };

  let confirmMsg = `*Selected flight:*\n\n${selected.detail}`;
  if (selected.compliance.status === "warning") {
    confirmMsg += `\n\n⚠️ ${selected.compliance.violations.join(", ")}`;
    confirmMsg += "\n_This is outside policy. Your manager will be notified._";
  }
  confirmMsg += "\n\nBook this flight?";

  ctx = appendMessage(ctx, "assistant", confirmMsg);

  await updateSession(session.id, {
    state: "confirming",
    context: ctx as Record<string, unknown>,
  });

  await sendInteractiveButtons(
    message.from,
    confirmMsg,
    [
      { type: "reply", reply: { id: "confirm_yes", title: "Yes, Book" } },
      { type: "reply", reply: { id: "confirm_no", title: "Cancel" } },
    ]
  );
}

// ── Confirming State — User confirming booking ──

async function handleConfirmingMessage(
  session: SessionData,
  message: ParsedIncomingMessage
): Promise<void> {
  const text = message.text.trim().toLowerCase();

  // Confirmation
  if (isConfirmation(text) || text === "confirm_yes" || text === "yes, book") {
    const ctx = session.context;
    const selected = ctx.selected_flight;
    const searchParams = ctx.search_params;

    if (!selected || !session.org_id || !session.member_id) {
      await updateSession(session.id, { state: "idle", context: { messages: ctx.messages } as Record<string, unknown> });
      await sendTextMessage(message.from, "Lost track of your selection. Let's start fresh — where do you need to fly?");
      return;
    }

    await sendTextMessage(message.from, "⏳ Booking your flight...");

    try {
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
        await sendTextMessage(message.from, `That fare may no longer be available. Let me find the next best option for you.\n\nSay "search again" to retry.`);
      }
    } catch (err) {
      console.error("[WhatsApp Handler] Booking error:", err);
      await sendTextMessage(message.from, "Something went wrong with the booking. This usually fixes itself quickly — want me to try again?");
    }

    // Keep messages, clear booking state
    const updatedCtx = appendMessage(session.context, "user", text);
    const finalCtx = appendMessage(updatedCtx, "assistant", "Booking processed.");
    await updateSession(session.id, {
      state: "idle",
      context: { messages: finalCtx.messages } as Record<string, unknown>,
    });
    return;
  }

  // Cancellation — go back to selecting
  if (isCancellation(text) || text === "confirm_no") {
    const options = session.context.flight_options;
    if (options && options.length > 0) {
      // Go back to selecting state, re-show options
      const ctx = appendMessage(session.context, "user", text);
      const reply = "No problem. Here are your options again — reply with a number to select:";
      const finalCtx = appendMessage(ctx, "assistant", reply);
      await updateSession(session.id, {
        state: "selecting",
        context: { ...finalCtx, flight_options: options, search_params: session.context.search_params } as Record<string, unknown>,
      });
      await sendTextMessage(message.from, reply);
    } else {
      await updateSession(session.id, { state: "idle", context: { messages: session.context.messages } as Record<string, unknown> });
      await sendTextMessage(message.from, "Booking cancelled. What else can I help with?");
    }
    return;
  }

  // Modification request — re-route through AI for new search
  if (isModificationRequest(text)) {
    await handleMessageWithAI(session, message);
    return;
  }

  // Unknown input — re-prompt
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

  if (!checkRateLimit(phone)) {
    await sendTextMessage(phone, "You're sending messages too fast. Please wait a moment.");
    return;
  }

  await logMessage(phone, "inbound", message.type, {
    text: message.text,
    contact_name: message.contactName,
  });

  await markAsRead(message.messageId);

  try {
    const session = await getOrCreateSession(phone);

    // Pre-process: fix common typos before routing
    message = { ...message, text: fixCommonTypos(message.text) };

    // Gibberish detection — respond helpfully
    if (session.verified && isGibberish(message.text)) {
      await sendTextMessage(phone, "I didn't catch that. Try something like \"Book BLR to DEL next Monday\" or type \"help\" to see what I can do.");
      return;
    }

    if (!session.verified) {
      await handleRegistration(session, message);
    } else {
      switch (session.state) {
        case "idle":
        case "searching":
          await handleMessageWithAI(session, message);
          break;
        case "selecting":
          await handleSelectingMessage(session, message);
          break;
        case "confirming":
          await handleConfirmingMessage(session, message);
          break;
        case "awaiting_approval":
          await handleMessageWithAI(session, message);
          break;
        default:
          await updateSession(session.id, { state: "idle" });
          await handleMessageWithAI(session, message);
          break;
      }
    }
  } catch (error) {
    console.error("[WhatsApp Handler] Error:", error);
    await sendTextMessage(
      phone,
      "Something's not working on my end right now. Try again in a moment, or type \"help\" if you need anything."
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
