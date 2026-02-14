// ── AI Provider Abstraction Types ───────────────────────────────────────────

export type AIProviderName = "gemini" | "anthropic" | "mock";

export type AIAction =
  | "search"
  | "present_options"
  | "confirm_booking"
  | "select_flight"
  | "ask_clarification"
  | "update_preference"
  | "general_response"
  | "show_booking_status";

export interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIProviderResponse {
  message: string;
  intentUpdate?: Record<string, string | number | null>;
  action: AIAction;
  searchParams?: {
    origin: string;
    destination: string;
    date: string;
    cabinClass?: string;
    /** Return date for round trips */
    returnDate?: string;
    /** Time filter: "morning", "afternoon", "evening", or specific hour */
    timePreference?: string;
  };
  preferenceUpdate?: Record<string, string>;
  selectedFlightIndex?: number;
  raw?: string;
}

export interface AIChatParams {
  systemPrompt: string;
  history: AIChatMessage[];
  message: string;
  maxTokens?: number;
  temperature?: number;
}

// ── AIError ─────────────────────────────────────────────────────────────────

export type AIErrorCode =
  | "PROVIDER_UNAVAILABLE"
  | "API_ERROR"
  | "RATE_LIMITED"
  | "INVALID_RESPONSE"
  | "AUTH_ERROR";

export class AIError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly code: AIErrorCode,
    public readonly statusCode: number = 500,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "AIError";
  }
}
