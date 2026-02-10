import type { AIChatParams, AIProviderResponse } from "./types";

export interface AIProvider {
  /** Unique provider identifier (e.g. "gemini", "anthropic", "mock") */
  readonly name: string;

  /** Default model name for this provider */
  readonly defaultModel: string;

  /** Whether this provider is configured and available */
  isAvailable(): boolean;

  /** Send a chat message and get a structured response */
  chat(params: AIChatParams): Promise<AIProviderResponse>;
}
