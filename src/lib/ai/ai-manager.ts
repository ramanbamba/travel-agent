import type { AIProvider } from "./ai-provider.interface";
import type { AIProviderName } from "./types";
import { AIError } from "./types";
import { GeminiProvider } from "./providers/gemini";
import { AnthropicProvider } from "./providers/anthropic";
import { MockProvider } from "./providers/mock";

// ── Provider registry ───────────────────────────────────────────────────────

type AIProviderFactory = () => AIProvider;

const providerFactories = new Map<string, AIProviderFactory>();
const providerInstances = new Map<string, AIProvider>();

function getProvider(name: string): AIProvider | null {
  let instance = providerInstances.get(name);
  if (instance) return instance;

  const factory = providerFactories.get(name);
  if (!factory) return null;

  instance = factory();
  providerInstances.set(name, instance);
  return instance;
}

/**
 * Register an AI provider factory. The provider is lazily instantiated on first use.
 */
export function registerAIProvider(
  name: string,
  factory: AIProviderFactory
): void {
  providerFactories.set(name, factory);
  providerInstances.delete(name);
}

// ── Default registrations ───────────────────────────────────────────────────

registerAIProvider("gemini", () => new GeminiProvider());
registerAIProvider("anthropic", () => new AnthropicProvider());
registerAIProvider("mock", () => new MockProvider());

// ── Fallback chain ──────────────────────────────────────────────────────────

const DEFAULT_CHAIN: AIProviderName[] = ["gemini", "anthropic", "mock"];

/**
 * Get the active AI provider.
 *
 * - If `AI_PROVIDER` env var is set, uses that provider exclusively (strict mode).
 *   Throws if the named provider is not available.
 * - Otherwise, walks the default chain: gemini → anthropic → mock.
 */
export function getAIProvider(): AIProvider {
  const explicit = process.env.AI_PROVIDER as string | undefined;

  if (explicit) {
    const provider = getProvider(explicit);
    if (!provider) {
      throw new AIError(
        `AI provider "${explicit}" is not registered`,
        explicit,
        "PROVIDER_UNAVAILABLE",
        500
      );
    }
    if (!provider.isAvailable()) {
      throw new AIError(
        `AI provider "${explicit}" is configured but not available (missing API key?)`,
        explicit,
        "PROVIDER_UNAVAILABLE",
        500
      );
    }
    return provider;
  }

  // Fallback chain
  for (const name of DEFAULT_CHAIN) {
    const provider = getProvider(name);
    if (provider && provider.isAvailable()) {
      return provider;
    }
  }

  // Should never happen (mock is always available)
  throw new AIError(
    "No AI provider available",
    "none",
    "PROVIDER_UNAVAILABLE",
    500
  );
}
