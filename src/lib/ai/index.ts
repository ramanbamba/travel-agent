// ── AI Provider Abstraction Layer ────────────────────────────────────────────

// Types
export type {
  AIProviderName,
  AIAction,
  AIChatMessage,
  AIProviderResponse,
  AIChatParams,
  AIErrorCode,
} from "./types";
export { AIError } from "./types";

// Interface
export type { AIProvider } from "./ai-provider.interface";

// Shared utilities
export { parseAIJsonResponse } from "./parse-response";
export {
  buildBookingSystemPrompt,
  type SystemPromptParams,
  type RouteFamiliarityContext,
  type ConversationSessionContext,
  type LastBookingContextForPrompt,
  type FrequentRouteContext,
} from "./prompts/system-prompts";

// Manager
export { getAIProvider, registerAIProvider } from "./ai-manager";

// Providers (for direct use if needed)
export { GeminiProvider } from "./providers/gemini";
export { AnthropicProvider } from "./providers/anthropic";
export { MockProvider } from "./providers/mock";
