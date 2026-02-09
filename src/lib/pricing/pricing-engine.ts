import type { FlightOffer, PriceBreakdown } from "@/lib/supply/types";

// ── Types ───────────────────────────────────────────────────────────────────

export interface PricingRule {
  id: string;
  name: string;
  is_active: boolean;
  markup_type: "percentage" | "fixed";
  markup_value: number;
  markup_cap: number | null;
  service_fee_type: "percentage" | "fixed";
  service_fee_value: number;
  concierge_fee: number;
  min_total_fee: number;
  applies_to: {
    airlines?: string[];
    routes?: string[];
    cabins?: string[];
  } | null;
}

export interface PricedResult {
  supplierCost: number;
  markup: number;
  displayedFare: number; // supplierCost + markup (what customer sees as "fare")
  serviceFee: number;
  customerTotal: number; // displayedFare + serviceFee
  currency: string;
}

// ── Default rule (hardcoded fallback) ───────────────────────────────────────

export const DEFAULT_PRICING_RULE: PricingRule = {
  id: "default",
  name: "Default",
  is_active: true,
  markup_type: "percentage",
  markup_value: 1.5,
  markup_cap: 50,
  service_fee_type: "fixed",
  service_fee_value: 12,
  concierge_fee: 0,
  min_total_fee: 5,
  applies_to: null,
};

// ── Core pricing logic ──────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Calculate the priced result for a given supplier cost.
 */
export function calculatePrice(
  supplierTotal: number,
  currency: string,
  rule: PricingRule = DEFAULT_PRICING_RULE
): PricedResult {
  // Calculate markup
  let markup =
    rule.markup_type === "percentage"
      ? supplierTotal * (rule.markup_value / 100)
      : rule.markup_value;

  // Apply cap
  if (rule.markup_cap !== null && markup > rule.markup_cap) {
    markup = rule.markup_cap;
  }

  // Calculate service fee
  let serviceFee =
    rule.service_fee_type === "percentage"
      ? supplierTotal * (rule.service_fee_value / 100)
      : rule.service_fee_value;

  // Floor: if (markup + serviceFee) < min_total_fee, bump service fee
  const totalFee = markup + serviceFee;
  if (totalFee < rule.min_total_fee) {
    serviceFee = rule.min_total_fee - markup;
  }

  markup = round2(markup);
  serviceFee = round2(serviceFee);

  const displayedFare = round2(supplierTotal + markup);
  const customerTotal = round2(displayedFare + serviceFee);

  return {
    supplierCost: supplierTotal,
    markup,
    displayedFare,
    serviceFee,
    customerTotal,
    currency,
  };
}

// ── Apply pricing to a FlightOffer ──────────────────────────────────────────

/**
 * Returns a new FlightOffer with pricing applied to the price breakdown.
 * The original offer is not mutated.
 */
export function applyPricingToOffer(
  offer: FlightOffer,
  rule: PricingRule = DEFAULT_PRICING_RULE
): FlightOffer {
  const priced = calculatePrice(offer.price.total, offer.price.currency, rule);

  const updatedPrice: PriceBreakdown = {
    ...offer.price,
    total: priced.customerTotal,
    markup: priced.markup,
    serviceFee: priced.serviceFee,
  };

  return { ...offer, price: updatedPrice };
}
