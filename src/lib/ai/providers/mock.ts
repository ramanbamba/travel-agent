import type { AIProvider } from "../ai-provider.interface";
import type { AIChatParams, AIProviderResponse } from "../types";

// ── Mock Provider ───────────────────────────────────────────────────────────

export class MockProvider implements AIProvider {
  readonly name = "mock";
  readonly defaultModel = "mock-v1";

  isAvailable(): boolean {
    return true;
  }

  async chat(params: AIChatParams): Promise<AIProviderResponse> {
    const msg = params.message.toLowerCase();

    // Booking intent keywords
    if (
      msg.includes("fly") ||
      msg.includes("book") ||
      msg.includes("flight") ||
      msg.includes("delhi") ||
      msg.includes("mumbai") ||
      msg.includes("bangalore")
    ) {
      // Try to extract destination
      const cities: Record<string, string> = {
        delhi: "DEL",
        mumbai: "BOM",
        bangalore: "BLR",
        bengaluru: "BLR",
        hyderabad: "HYD",
        chennai: "MAA",
        kolkata: "CCU",
        goa: "GOI",
        pune: "PNQ",
        jaipur: "JAI",
      };

      let destination: string | undefined;
      for (const [city, code] of Object.entries(cities)) {
        if (msg.includes(city)) {
          destination = code;
          break;
        }
      }

      if (destination) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const date = tomorrow.toISOString().split("T")[0];

        return {
          message: `Looking up flights to ${destination} for you.`,
          action: "search",
          intentUpdate: { destination, date },
          searchParams: {
            origin: "BLR",
            destination,
            date,
            cabinClass: "economy",
          },
        };
      }

      return {
        message: "Where are you flying to?",
        action: "ask_clarification",
      };
    }

    // Selection keywords
    if (
      msg.includes("book it") ||
      msg.includes("first one") ||
      msg.includes("option 1") ||
      msg.includes("yes")
    ) {
      return {
        message: "Great choice! Let me prepare that booking for you.",
        action: "select_flight",
        selectedFlightIndex: 0,
      };
    }

    // Preference update
    if (msg.includes("prefer") || msg.includes("always")) {
      return {
        message: "Got it, I'll remember that preference.",
        action: "update_preference",
        preferenceUpdate: {},
      };
    }

    // Default: general response
    return {
      message: "Hey! Where are you headed? Just tell me the city and date.",
      action: "general_response",
    };
  }
}
