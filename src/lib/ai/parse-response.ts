import type { AIAction, AIProviderResponse } from "./types";

const VALID_ACTIONS: AIAction[] = [
  "search",
  "present_options",
  "confirm_booking",
  "select_flight",
  "ask_clarification",
  "update_preference",
  "general_response",
  "show_booking_status",
  // Corporate actions (Phase 4)
  "policy_answer",
  "manage_booking",
  "expense_query",
  "approval_response",
  "help",
  "greeting",
  // Conversational chat actions
  "filter",
  "select",
  "confirm",
  "preference",
];

function normalizeAction(action: string | undefined): AIAction {
  if (action && VALID_ACTIONS.includes(action as AIAction)) {
    return action as AIAction;
  }
  return "general_response";
}

/**
 * Parse raw AI text response into a structured AIProviderResponse.
 * Extracts JSON from the text, maps snake_case fields to camelCase.
 * Works identically for all providers (Gemini, Anthropic, etc.)
 */
export function parseAIJsonResponse(raw: string): AIProviderResponse {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      message: raw.trim() || "I didn't quite catch that. Where are you flying to?",
      action: "general_response",
      raw,
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);

    const response: AIProviderResponse = {
      message: parsed.message ?? "I didn't quite catch that.",
      action: normalizeAction(parsed.action),
      raw,
    };

    if (parsed.intent_update && Object.keys(parsed.intent_update).length > 0) {
      response.intentUpdate = parsed.intent_update;
    }

    if (parsed.search_params) {
      response.searchParams = {
        origin: parsed.search_params.origin,
        destination: parsed.search_params.destination,
        date: parsed.search_params.date,
        cabinClass: parsed.search_params.cabin_class,
        returnDate: parsed.search_params.return_date,
        timePreference: parsed.search_params.time_preference,
      };
    }

    if (parsed.preference_update) {
      response.preferenceUpdate = parsed.preference_update;
    }

    if (parsed.selected_flight_index != null) {
      response.selectedFlightIndex = parsed.selected_flight_index;
    }

    // Corporate fields (Phase 4)
    if (parsed.intent) {
      response.intent = parsed.intent;
    }

    if (parsed.policy_check) {
      response.policyCheck = {
        compliant: parsed.policy_check.compliant ?? true,
        violations: parsed.policy_check.violations ?? [],
      };
    }

    if (parsed.booking_action) {
      response.bookingAction = {
        action: parsed.booking_action.action,
        bookingRef: parsed.booking_action.booking_ref,
      };
    }

    if (parsed.approval_action) {
      response.approvalAction = {
        action: parsed.approval_action.action,
        bookingId: parsed.approval_action.booking_id,
        reason: parsed.approval_action.reason,
      };
    }

    return response;
  } catch {
    return {
      message: raw.trim() || "I didn't quite catch that. Where are you flying to?",
      action: "general_response",
      raw,
    };
  }
}
