/**
 * Deterministic policy evaluation — no LLM calls.
 * Used by both WhatsApp corporate search and web booking flows.
 */

export interface FlightOfferForPolicy {
  price: { total: number; currency: string };
  cabin: string;
  stops: number;
  airlineCode?: string;
  departureTime: string; // ISO date string
  refundable?: boolean;
  origin: string;
  destination: string;
}

export interface MemberForPolicy {
  seniority_level: string;
  role: string;
  department?: string;
}

export interface PolicyRules {
  flight_rules?: {
    domestic_cabin_class?: {
      default?: string;
      overrides?: Array<{ seniority: string[]; allowed: string[] }>;
    };
    max_flight_price?: { domestic?: number | null; international?: number | null };
    advance_booking_days?: { minimum?: number; recommended?: number };
    preferred_airlines?: string[];
    blocked_airlines?: string[];
    allow_refundable_only?: boolean;
    max_stops?: number | null;
  };
  spend_limits?: {
    per_trip?: number | null;
    per_month?: number | null;
    overrides?: Array<{ seniority: string[]; per_trip?: number; per_month?: number }>;
  };
  approval_rules?: {
    auto_approve_under?: number;
    require_approval_over?: number;
    out_of_policy_handling?: "soft" | "hard";
    approval_timeout_hours?: number;
    auto_escalate?: boolean;
  };
  booking_rules?: {
    min_advance_days?: number;
    recommended_advance_days?: number;
  };
  policy_mode?: "soft" | "hard";
}

export interface PolicyEvaluation {
  compliant: boolean;
  violations: string[];
  needsApproval: boolean;
  policyMode: "soft" | "hard";
}

const INDIAN_AIRPORTS = new Set([
  "DEL", "BOM", "BLR", "HYD", "MAA", "CCU", "PNQ", "AMD", "GOI", "JAI",
  "LKO", "COK", "GAU", "IXR", "PAT", "NAG", "IDR", "BBI", "RPR", "SXR",
  "IXC", "ATQ", "VNS", "IXB", "IMF", "DIB", "TRV", "CCJ", "IXE", "IXA",
]);

const CABIN_HIERARCHY = ["economy", "premium_economy", "business", "first"];

function isDomestic(origin: string, destination: string): boolean {
  return INDIAN_AIRPORTS.has(origin) && INDIAN_AIRPORTS.has(destination);
}

function getAllowedCabins(flightRules: PolicyRules["flight_rules"], seniority: string): string[] {
  if (!flightRules?.domestic_cabin_class) return CABIN_HIERARCHY;

  // Check seniority overrides first
  for (const override of (flightRules.domestic_cabin_class.overrides ?? [])) {
    if (override.seniority.includes(seniority)) {
      return override.allowed;
    }
  }

  // Default: allow up to the default cabin
  const defaultCabin = flightRules.domestic_cabin_class.default ?? "economy";
  const maxIdx = CABIN_HIERARCHY.indexOf(defaultCabin);
  return maxIdx >= 0 ? CABIN_HIERARCHY.slice(0, maxIdx + 1) : CABIN_HIERARCHY;
}

function getSpendLimit(
  spendLimits: PolicyRules["spend_limits"],
  seniority: string,
  type: "per_trip" | "per_month"
): number | null {
  if (!spendLimits) return null;

  // Check overrides
  for (const override of (spendLimits.overrides ?? [])) {
    if (override.seniority.includes(seniority)) {
      return override[type] ?? null;
    }
  }

  return spendLimits[type] ?? null;
}

export function evaluatePolicy(
  offer: FlightOfferForPolicy,
  member: MemberForPolicy,
  policy: PolicyRules
): PolicyEvaluation {
  const violations: string[] = [];
  const flightRules = policy.flight_rules;
  const approvalRules = policy.approval_rules;
  const policyMode = policy.policy_mode ?? approvalRules?.out_of_policy_handling ?? "soft";
  const amount = offer.price.total;

  // 1. Cabin class check
  if (flightRules) {
    const allowedCabins = getAllowedCabins(flightRules, member.seniority_level);
    const offerCabin = (offer.cabin ?? "economy").toLowerCase();
    if (!allowedCabins.includes(offerCabin)) {
      violations.push(
        `${offerCabin} class not allowed — max: ${allowedCabins[allowedCabins.length - 1]}`
      );
    }
  }

  // 2. Price limits
  if (flightRules?.max_flight_price) {
    const domestic = isDomestic(offer.origin, offer.destination);
    const maxPrice = domestic
      ? flightRules.max_flight_price.domestic
      : flightRules.max_flight_price.international;
    if (maxPrice && amount > maxPrice) {
      violations.push(
        `₹${Math.round(amount).toLocaleString("en-IN")} exceeds ₹${maxPrice.toLocaleString("en-IN")} limit`
      );
    }
  }

  // 3. Per-trip spend limit
  const tripLimit = getSpendLimit(policy.spend_limits, member.seniority_level, "per_trip");
  if (tripLimit && amount > tripLimit) {
    violations.push(
      `₹${Math.round(amount).toLocaleString("en-IN")} exceeds per-trip limit of ₹${tripLimit.toLocaleString("en-IN")}`
    );
  }

  // 4. Advance booking days
  const minAdvance = flightRules?.advance_booking_days?.minimum ?? policy.booking_rules?.min_advance_days;
  if (minAdvance && minAdvance > 0) {
    const depDate = new Date(offer.departureTime);
    const now = new Date();
    const daysAhead = Math.floor((depDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAhead < minAdvance) {
      violations.push(
        `Booked ${daysAhead} day(s) ahead — minimum ${minAdvance} days required`
      );
    }
  }

  // 5. Blocked airlines
  if (flightRules?.blocked_airlines?.length && offer.airlineCode) {
    if (flightRules.blocked_airlines.includes(offer.airlineCode)) {
      violations.push(`${offer.airlineCode} is blocked by company policy`);
    }
  }

  // 6. Max stops
  if (flightRules?.max_stops != null && offer.stops > flightRules.max_stops) {
    violations.push(`${offer.stops} stops exceeds maximum ${flightRules.max_stops}`);
  }

  // 7. Refundable only
  if (flightRules?.allow_refundable_only && offer.refundable === false) {
    violations.push("Non-refundable fares not allowed");
  }

  // Determine approval need
  const autoApproveUnder = approvalRules?.auto_approve_under ?? 0;
  const requireApprovalOver = approvalRules?.require_approval_over ?? Infinity;
  const compliant = violations.length === 0;
  const needsApproval =
    !compliant ||
    amount > requireApprovalOver ||
    (autoApproveUnder > 0 && amount >= autoApproveUnder && !compliant);

  return {
    compliant,
    violations,
    needsApproval,
    policyMode,
  };
}
