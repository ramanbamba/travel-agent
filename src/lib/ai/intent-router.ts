// ============================================================================
// Intent Router — Maps parsed AI intents to handler functions
// Takes parsed intent + WhatsApp session + org context → executes action
// → returns WhatsApp message(s) to send back.
// ============================================================================

import { createClient } from "@supabase/supabase-js";
import type { AIProviderResponse } from "./types";
import type {
  CorporateAIContext,
  PolicySummary,
  RecentBookingSummary,
  TravelerPreferenceSummary,
  ConversationMessage,
} from "@/types/intent";
import { buildCorporateSystemPrompt } from "./prompts/corporate-system-prompt";
import { getAIProviderChain } from "./ai-manager";

// ── Types ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

interface WhatsAppSessionData {
  id: string;
  phone_number: string;
  org_id: string | null;
  member_id: string | null;
  state: string;
  context: Record<string, unknown>;
  verified: boolean;
}

export interface IntentRouterDeps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase?: any;
}

interface IntentResult {
  messages: string[];
  newState?: string;
  newContext?: Record<string, unknown>;
}

// ── Intent Router ──

export class IntentRouter {
  private supabase: SupabaseAny;

  constructor(deps?: IntentRouterDeps) {
    this.supabase =
      deps?.supabase ??
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
  }

  // Helper to query untyped Phase 4 tables
  private query(table: string) {
    return this.supabase.from(table) as SupabaseAny;
  }

  /**
   * Process a user message through AI and route the parsed intent.
   * Returns one or more WhatsApp messages to send back.
   */
  async processMessage(
    session: WhatsAppSessionData,
    messageText: string
  ): Promise<IntentResult> {
    if (!session.org_id || !session.member_id) {
      return {
        messages: ["Something went wrong with your session. Please send *hi* to restart."],
      };
    }

    // 1. Load corporate context
    const context = await this.loadCorporateContext(
      session.org_id,
      session.member_id,
      session.context
    );

    // 2. Build system prompt
    const systemPrompt = buildCorporateSystemPrompt(context);

    // 3. Call AI with conversation history
    const aiResponse = await this.callAI(
      systemPrompt,
      context.conversation_history,
      messageText
    );

    // 4. Route the parsed intent to the appropriate handler
    return this.routeIntent(aiResponse, session, context);
  }

  // ── AI Call ──

  private async callAI(
    systemPrompt: string,
    history: ConversationMessage[],
    message: string
  ): Promise<AIProviderResponse> {
    const providers = getAIProviderChain();

    for (const provider of providers) {
      try {
        return await provider.chat({
          systemPrompt,
          history,
          message,
        });
      } catch (err) {
        console.warn(
          `[IntentRouter] Provider "${provider.name}" failed:`,
          err instanceof Error ? err.message : err
        );
      }
    }

    // Fallback
    return {
      message: "I'm having trouble processing that right now. Please try again in a moment.",
      action: "general_response",
    };
  }

  // ── Intent Routing ──

  private async routeIntent(
    aiResponse: AIProviderResponse,
    session: WhatsAppSessionData,
    context: CorporateAIContext
  ): Promise<IntentResult> {
    const action = aiResponse.action;

    switch (action) {
      case "search":
        return this.handleSearch(aiResponse, session);

      case "policy_answer":
        return this.handlePolicyAnswer(aiResponse);

      case "manage_booking":
        return this.handleManageBooking(aiResponse, session);

      case "show_booking_status":
        return this.handleBookingStatus(aiResponse, session, context);

      case "expense_query":
        return this.handleExpenseQuery(aiResponse, session);

      case "update_preference":
        return this.handlePreferenceUpdate(aiResponse, session);

      case "approval_response":
        return this.handleApprovalResponse(aiResponse, session, context);

      case "help":
        return this.handleHelp(context);

      case "greeting":
        return this.handleGreeting(aiResponse);

      case "ask_clarification":
        return this.handleClarification(aiResponse, session);

      default:
        return { messages: [aiResponse.message] };
    }
  }

  // ── Handler: Search ──

  private async handleSearch(
    aiResponse: AIProviderResponse,
    session: WhatsAppSessionData
  ): Promise<IntentResult> {
    const params = aiResponse.searchParams;
    if (!params?.destination) {
      return { messages: [aiResponse.message] };
    }

    // Store search intent in context for multi-turn
    const searchContext = {
      ...((session.context as Record<string, unknown>) ?? {}),
      search_params: params,
      intent_update: aiResponse.intentUpdate,
    };

    // For now, return the AI message + signal searching state.
    // P4-06 will wire up actual Duffel flight search here.
    const policyWarning = aiResponse.policyCheck?.violations?.length
      ? `\n\n⚠️ *Policy note:* ${aiResponse.policyCheck.violations.join(", ")}`
      : "";

    return {
      messages: [
        aiResponse.message + policyWarning +
        "\n\n🔍 Searching for flights..." +
        "\n_(Flight results will be connected in P4-06)_",
      ],
      newState: "searching",
      newContext: searchContext,
    };
  }

  // ── Handler: Policy Answer ──

  private handlePolicyAnswer(aiResponse: AIProviderResponse): IntentResult {
    return { messages: [aiResponse.message] };
  }

  // ── Handler: Manage Booking ──

  private async handleManageBooking(
    aiResponse: AIProviderResponse,
    session: WhatsAppSessionData
  ): Promise<IntentResult> {
    const action = aiResponse.bookingAction;

    if (action?.action === "status") {
      const { data: bookings } = await this.query("corp_bookings")
        .select("id, origin, destination, departure_date, status, airline_name, total_amount, pnr")
        .eq("member_id", session.member_id)
        .in("status", ["pending", "pending_approval", "approved", "booked"])
        .order("departure_date", { ascending: true })
        .limit(5) as { data: SupabaseAny[] | null };

      if (!bookings || bookings.length === 0) {
        return { messages: ["You don't have any active bookings right now. Want to book a flight?"] };
      }

      let msg = "*Your active bookings:*\n";
      for (const b of bookings) {
        const statusEmoji =
          b.status === "booked" ? "✅" :
          b.status === "approved" ? "👍" :
          b.status === "pending_approval" ? "⏳" : "📋";
        msg += `\n${statusEmoji} ${b.origin}→${b.destination} · ${b.departure_date}`;
        if (b.airline_name) msg += ` · ${b.airline_name}`;
        msg += ` · ₹${Number(b.total_amount).toLocaleString("en-IN")}`;
        msg += ` [${String(b.status).replace("_", " ")}]`;
        if (b.pnr) msg += ` · PNR: ${b.pnr}`;
      }

      return { messages: [msg] };
    }

    // Cancel / change — placeholder for P4-06
    return { messages: [aiResponse.message] };
  }

  // ── Handler: Booking Status ──

  private async handleBookingStatus(
    aiResponse: AIProviderResponse,
    session: WhatsAppSessionData,
    context: CorporateAIContext
  ): Promise<IntentResult> {
    // For managers, also show pending approvals
    if (
      ["admin", "travel_manager", "approver"].includes(context.member_role) &&
      context.pending_approvals > 0
    ) {
      const { data: approvals } = await this.query("approval_requests")
        .select(`
          id, status, created_at,
          corp_bookings!inner(origin, destination, departure_date, total_amount, airline_name),
          requester:org_members!approval_requests_requester_id_fkey(full_name)
        `)
        .eq("approver_id", session.member_id)
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(5) as { data: SupabaseAny[] | null };

      if (approvals && approvals.length > 0) {
        let msg = `*${approvals.length} pending approval(s):*\n`;
        for (const a of approvals) {
          const booking = a.corp_bookings as {
            origin: string; destination: string; departure_date: string;
            total_amount: number; airline_name: string | null;
          };
          const requester = a.requester as { full_name: string } | null;
          msg += `\n⏳ ${requester?.full_name ?? "Employee"}: ${booking.origin}→${booking.destination}`;
          msg += ` · ${booking.departure_date}`;
          if (booking.airline_name) msg += ` · ${booking.airline_name}`;
          msg += ` · ₹${Number(booking.total_amount).toLocaleString("en-IN")}`;
          msg += `\nReply "approve" or "reject" to respond.`;
        }
        return { messages: [aiResponse.message, msg] };
      }
    }

    return { messages: [aiResponse.message] };
  }

  // ── Handler: Expense Query ──

  private async handleExpenseQuery(
    _aiResponse: AIProviderResponse,
    session: WhatsAppSessionData
  ): Promise<IntentResult> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: bookings } = await this.query("corp_bookings")
      .select("total_amount, status")
      .eq("member_id", session.member_id)
      .gte("created_at", startOfMonth.toISOString())
      .in("status", ["booked", "completed"]) as { data: SupabaseAny[] | null };

    const totalSpend = bookings?.reduce((sum: number, b: SupabaseAny) => sum + (Number(b.total_amount) || 0), 0) ?? 0;
    const bookingCount = bookings?.length ?? 0;

    if (bookingCount === 0) {
      return { messages: ["No bookings this month yet. Your spend is ₹0."] };
    }

    return {
      messages: [
        `*This month's travel spend:*\n\n` +
        `📊 Total: ₹${totalSpend.toLocaleString("en-IN")}\n` +
        `✈️ Bookings: ${bookingCount}\n` +
        `💰 Avg per trip: ₹${Math.round(totalSpend / bookingCount).toLocaleString("en-IN")}`,
      ],
    };
  }

  // ── Handler: Preference Update ──

  private async handlePreferenceUpdate(
    aiResponse: AIProviderResponse,
    session: WhatsAppSessionData
  ): Promise<IntentResult> {
    if (aiResponse.preferenceUpdate && session.member_id) {
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      const pu = aiResponse.preferenceUpdate;
      if (pu.seat_preference) updates.seat_preference = pu.seat_preference;
      if (pu.meal_preference) updates.meal_preference = pu.meal_preference;
      if (pu.preferred_departure_window) updates.preferred_departure_window = pu.preferred_departure_window;

      if (Object.keys(updates).length > 1) {
        await this.query("traveler_preferences")
          .update(updates)
          .eq("member_id", session.member_id);
      }
    }

    return { messages: [aiResponse.message] };
  }

  // ── Handler: Approval Response ──

  private async handleApprovalResponse(
    aiResponse: AIProviderResponse,
    session: WhatsAppSessionData,
    context: CorporateAIContext
  ): Promise<IntentResult> {
    if (!["admin", "travel_manager", "approver"].includes(context.member_role)) {
      return { messages: ["Only managers and travel managers can approve bookings."] };
    }

    const approvalAction = aiResponse.approvalAction;
    if (!approvalAction) {
      return { messages: [aiResponse.message] };
    }

    // Find the most recent pending approval for this approver
    const { data: pending } = await this.query("approval_requests")
      .select("id, booking_id, requester_id")
      .eq("approver_id", session.member_id)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1)
      .single() as { data: SupabaseAny | null };

    if (!pending) {
      return { messages: ["No pending approvals found."] };
    }

    const newStatus = approvalAction.action === "approve" ? "approved" : "rejected";

    // Update approval request
    await this.query("approval_requests")
      .update({
        status: newStatus,
        response_message: approvalAction.reason || null,
        responded_at: new Date().toISOString(),
      })
      .eq("id", pending.id);

    // Update corp_booking
    const bookingStatus = newStatus === "approved" ? "approved" : "cancelled";
    await this.query("corp_bookings")
      .update({
        approval_status: newStatus,
        approved_by: session.member_id,
        approved_at: new Date().toISOString(),
        status: bookingStatus,
        rejection_reason: newStatus === "rejected" ? (approvalAction.reason || null) : null,
      })
      .eq("id", pending.booking_id);

    const emoji = newStatus === "approved" ? "✅" : "❌";
    return {
      messages: [
        `${emoji} Booking ${newStatus}. The requester will be notified.`,
      ],
    };
  }

  // ── Handler: Help ──

  private handleHelp(context: CorporateAIContext): IntentResult {
    let msg =
      "Here's what I can do:\n\n" +
      "✈️ *Book flights* — \"Book BLR to DEL Monday\"\n" +
      "🔍 *Search flights* — \"Show flights to Mumbai\"\n" +
      "📋 *Check bookings* — \"My bookings\" or \"Booking status\"\n" +
      "❌ *Cancel trips* — \"Cancel my Delhi flight\"\n" +
      "📊 *Expenses* — \"How much have I spent?\"\n" +
      "📜 *Policy* — \"Can I book business class?\"\n" +
      "⚙️ *Preferences* — \"I prefer aisle seat\"\n" +
      "❓ *Help* — This message";

    if (["admin", "travel_manager", "approver"].includes(context.member_role)) {
      msg +=
        "\n\n*Manager tools:*\n" +
        "✅ *Approve/reject* — \"Approve\" or \"Reject\"\n" +
        "👥 *Team status* — \"Pending approvals\"";
    }

    return { messages: [msg] };
  }

  // ── Handler: Greeting ──

  private handleGreeting(aiResponse: AIProviderResponse): IntentResult {
    return { messages: [aiResponse.message] };
  }

  // ── Handler: Clarification ──

  private handleClarification(
    aiResponse: AIProviderResponse,
    session: WhatsAppSessionData
  ): IntentResult {
    const newContext = {
      ...((session.context as Record<string, unknown>) ?? {}),
      intent_update: aiResponse.intentUpdate,
    };

    return {
      messages: [aiResponse.message],
      newContext,
    };
  }

  // ── Load Corporate Context ──

  async loadCorporateContext(
    orgId: string,
    memberId: string,
    sessionContext: Record<string, unknown>
  ): Promise<CorporateAIContext> {
    // Load member + org + policy + prefs + bookings + approvals in parallel
    const [memberResult, orgResult, policyResult, prefsResult, recentResult, approvalsResult] =
      await Promise.all([
        this.query("org_members")
          .select("full_name, role, seniority_level, department")
          .eq("id", memberId)
          .single() as Promise<{ data: SupabaseAny | null }>,
        this.query("organizations")
          .select("name, plan")
          .eq("id", orgId)
          .single() as Promise<{ data: SupabaseAny | null }>,
        this.query("travel_policies")
          .select("*")
          .eq("org_id", orgId)
          .eq("is_active", true)
          .limit(1)
          .single() as Promise<{ data: SupabaseAny | null }>,
        this.query("traveler_preferences")
          .select("*")
          .eq("member_id", memberId)
          .single() as Promise<{ data: SupabaseAny | null }>,
        this.query("corp_bookings")
          .select("id, origin, destination, departure_date, status, airline_name, total_amount, pnr")
          .eq("member_id", memberId)
          .order("created_at", { ascending: false })
          .limit(3) as Promise<{ data: SupabaseAny[] | null }>,
        this.query("approval_requests")
          .select("id", { count: "exact", head: true })
          .eq("approver_id", memberId)
          .eq("status", "pending") as Promise<{ count: number | null }>,
      ]);

    const member = memberResult.data;
    const org = orgResult.data;
    const policy = policyResult.data;
    const prefs = prefsResult.data;
    const recent = recentResult.data;

    // Build policy summary
    const policySummary: PolicySummary = policy
      ? {
          domestic_cabin_class: policy.flight_rules?.domestic_cabin_class?.default ?? "economy",
          max_flight_price_domestic: policy.flight_rules?.max_flight_price?.domestic ?? null,
          max_flight_price_international: policy.flight_rules?.max_flight_price?.international ?? null,
          advance_booking_days_min: policy.flight_rules?.advance_booking_days?.minimum ?? 0,
          preferred_airlines: policy.flight_rules?.preferred_airlines ?? [],
          blocked_airlines: policy.flight_rules?.blocked_airlines ?? [],
          auto_approve_under: policy.approval_rules?.auto_approve_under ?? null,
          require_approval_over: policy.approval_rules?.require_approval_over ?? 10000,
          per_trip_limit: policy.spend_limits?.per_trip_limit ?? null,
          per_month_limit: policy.spend_limits?.per_month_limit ?? null,
          policy_mode: policy.policy_mode ?? "soft",
        }
      : {
          domestic_cabin_class: "economy",
          max_flight_price_domestic: null,
          max_flight_price_international: null,
          advance_booking_days_min: 0,
          preferred_airlines: [],
          blocked_airlines: [],
          auto_approve_under: null,
          require_approval_over: 10000,
          per_trip_limit: null,
          per_month_limit: null,
          policy_mode: "soft" as const,
        };

    // Build preferences summary
    const preferencesSummary: TravelerPreferenceSummary = prefs
      ? {
          preferred_airlines: prefs.preferred_airlines ?? [],
          preferred_departure_window: prefs.preferred_departure_window ?? "morning",
          seat_preference: prefs.seat_preference ?? "no_preference",
          meal_preference: prefs.meal_preference ?? null,
          frequent_routes: prefs.frequent_routes ?? [],
        }
      : {
          preferred_airlines: [],
          preferred_departure_window: "morning",
          seat_preference: "no_preference",
          meal_preference: null,
          frequent_routes: [],
        };

    // Build recent bookings
    const recentBookings: RecentBookingSummary[] = (recent ?? []).map((b: SupabaseAny) => ({
      booking_id: b.id,
      origin: b.origin,
      destination: b.destination,
      departure_date: b.departure_date,
      status: b.status,
      airline_name: b.airline_name,
      total_amount: b.total_amount,
      pnr: b.pnr,
    }));

    // Build conversation history from session context
    const lastMessages = (sessionContext.last_messages as string[]) ?? [];
    const conversationHistory: ConversationMessage[] = lastMessages.map((msg, i) => ({
      role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
      content: msg,
    }));

    return {
      member_name: member?.full_name ?? "there",
      member_role: member?.role ?? "employee",
      seniority_level: member?.seniority_level ?? "individual_contributor",
      department: member?.department ?? null,
      org_name: org?.name ?? "your company",
      org_plan: org?.plan ?? "free",
      policy_summary: policySummary,
      recent_bookings: recentBookings,
      preferences: preferencesSummary,
      pending_approvals: approvalsResult.count ?? 0,
      conversation_history: conversationHistory,
    };
  }
}
