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
      };
    }

    if (parsed.preference_update) {
      response.preferenceUpdate = parsed.preference_update;
    }

    if (parsed.selected_flight_index != null) {
      response.selectedFlightIndex = parsed.selected_flight_index;
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
