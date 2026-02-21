import { GoogleGenerativeAI, type Content } from "@google/generative-ai";
import type { AIProvider } from "../ai-provider.interface";
import type { AIChatParams, AIProviderResponse } from "../types";
import { AIError } from "../types";
import { parseAIJsonResponse } from "../parse-response";

// ── Lazy singleton ──────────────────────────────────────────────────────────

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new AIError(
        "GEMINI_API_KEY is not set",
        "gemini",
        "AUTH_ERROR",
        401
      );
    }
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}

// ── Gemini Provider ─────────────────────────────────────────────────────────

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  readonly defaultModel = "gemini-2.0-flash";

  isAvailable(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }

  async chat(params: AIChatParams): Promise<AIProviderResponse> {
    const {
      systemPrompt,
      history,
      message,
      maxTokens = parseInt(process.env.AI_MAX_TOKENS ?? "400", 10),
      temperature = parseFloat(process.env.AI_TEMPERATURE ?? "0.3"),
    } = params;

    const model = process.env.AI_MODEL || this.defaultModel;
    const start = Date.now();

    try {
      const genAI = getClient();
      const genModel = genAI.getGenerativeModel({
        model,
        systemInstruction: systemPrompt,
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature,
        },
      });

      // Convert history: Gemini uses "user" and "model" roles
      // and requires strict alternation (no consecutive same-role messages)
      const geminiHistory = this.convertHistory(history);

      const chat = genModel.startChat({ history: geminiHistory });
      const result = await Promise.race([
        chat.sendMessage(message),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Gemini request timed out after 15000ms")), 15000)
        ),
      ]);
      const rawText = result.response.text();

      return parseAIJsonResponse(rawText);
    } catch (err) {
      const elapsed = Date.now() - start;
      console.error(`[AI:gemini] Error after ${elapsed}ms:`, err);

      if (err instanceof AIError) throw err;

      const message2 = err instanceof Error ? err.message : String(err);
      if (message2.includes("429") || message2.includes("RESOURCE_EXHAUSTED")) {
        throw new AIError(
          "Gemini rate limited",
          "gemini",
          "RATE_LIMITED",
          429,
          err
        );
      }

      throw new AIError(
        `Gemini API error: ${message2}`,
        "gemini",
        "API_ERROR",
        500,
        err
      );
    }
  }

  /**
   * Convert chat history to Gemini format.
   * Gemini requires "user"/"model" roles and strict alternation.
   */
  private convertHistory(
    history: Array<{ role: "user" | "assistant"; content: string }>
  ): Content[] {
    // Map roles and merge consecutive same-role messages
    const mapped: Content[] = [];

    for (const msg of history) {
      const role = msg.role === "assistant" ? "model" : "user";
      const last = mapped[mapped.length - 1];

      if (last && last.role === role) {
        // Merge: append to existing content
        const existingText =
          last.parts.map((p) => ("text" in p ? p.text : "")).join("");
        last.parts = [{ text: existingText + "\n" + msg.content }];
      } else {
        mapped.push({
          role,
          parts: [{ text: msg.content }],
        });
      }
    }

    // Gemini requires history to start with "user" if non-empty
    if (mapped.length > 0 && mapped[0].role !== "user") {
      mapped.unshift({ role: "user", parts: [{ text: "." }] });
    }

    return mapped;
  }
}
