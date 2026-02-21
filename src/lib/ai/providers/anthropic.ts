import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider } from "../ai-provider.interface";
import type { AIChatParams, AIProviderResponse } from "../types";
import { AIError } from "../types";
import { parseAIJsonResponse } from "../parse-response";

// ── Lazy singleton ──────────────────────────────────────────────────────────

let client: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new AIError(
        "ANTHROPIC_API_KEY is not set",
        "anthropic",
        "AUTH_ERROR",
        401
      );
    }
    client = new Anthropic({ apiKey, timeout: 15000 });
  }
  return client;
}

// ── Anthropic Provider ──────────────────────────────────────────────────────

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  readonly defaultModel = "claude-sonnet-4-5-20250929";

  isAvailable(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  async chat(params: AIChatParams): Promise<AIProviderResponse> {
    const {
      systemPrompt,
      history,
      message,
      maxTokens = parseInt(process.env.AI_MAX_TOKENS ?? "1024", 10),
      temperature = parseFloat(process.env.AI_TEMPERATURE ?? "0.3"),
    } = params;

    const model = process.env.AI_MODEL || this.defaultModel;
    const start = Date.now();

    try {
      const anthropic = getAnthropicClient();

      const messages: Array<{ role: "user" | "assistant"; content: string }> = [
        ...history,
        { role: "user", content: message },
      ];

      const response = await anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages,
        ...(temperature !== undefined ? { temperature } : {}),
      });

      const textBlock = response.content.find((b) => b.type === "text");
      const rawText = textBlock?.type === "text" ? textBlock.text : "";

      return parseAIJsonResponse(rawText);
    } catch (err) {
      const elapsed = Date.now() - start;
      console.error(`[AI:anthropic] Error after ${elapsed}ms:`, err);

      if (err instanceof AIError) throw err;

      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429") || msg.includes("rate")) {
        throw new AIError(
          "Anthropic rate limited",
          "anthropic",
          "RATE_LIMITED",
          429,
          err
        );
      }

      throw new AIError(
        `Anthropic API error: ${msg}`,
        "anthropic",
        "API_ERROR",
        500,
        err
      );
    }
  }
}
