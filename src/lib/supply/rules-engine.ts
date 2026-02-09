import type { CabinClass, SupplySearchParams } from "./types";

export interface SupplyRule {
  /** Match by airline IATA code (for NDC routing, e.g. ["BA"]) */
  airlines?: string[];
  /** Match by origin IATA code */
  origins?: string[];
  /** Match by destination IATA code */
  destinations?: string[];
  /** Match by cabin class */
  cabinClasses?: CabinClass[];
  /** Ordered list of supplier names to try (first available wins) */
  suppliers: string[];
}

/**
 * Default routing rules. Evaluated top-to-bottom; first match wins.
 * Add airline-specific NDC rules above the catch-all.
 */
const DEFAULT_RULES: SupplyRule[] = [
  // Future NDC examples (uncomment + register supplier to activate):
  // { airlines: ["BA"], suppliers: ["ba_ndc", "duffel", "amadeus", "mock"] },
  // { airlines: ["LH", "LX", "OS"], suppliers: ["lh_ndc", "duffel", "amadeus", "mock"] },

  // Catch-all: Duffel primary, Amadeus fallback, mock last resort
  { suppliers: ["duffel", "amadeus", "mock"] },
];

function matchesRule(rule: SupplyRule, params: SupplySearchParams): boolean {
  if (rule.airlines && params.airline) {
    if (!rule.airlines.includes(params.airline.toUpperCase())) return false;
  } else if (rule.airlines && !params.airline) {
    // Rule requires an airline match but no airline specified — skip
    return false;
  }

  if (rule.origins) {
    if (!rule.origins.includes(params.origin.toUpperCase())) return false;
  }

  if (rule.destinations) {
    if (!rule.destinations.includes(params.destination.toUpperCase())) return false;
  }

  if (rule.cabinClasses && params.cabinClass) {
    if (!rule.cabinClasses.includes(params.cabinClass)) return false;
  }

  return true;
}

/**
 * Resolve which suppliers to try for a given search request.
 * Returns an ordered array of supplier names.
 */
export function resolveSuppliers(
  params: SupplySearchParams,
  rules: SupplyRule[] = DEFAULT_RULES
): string[] {
  for (const rule of rules) {
    if (matchesRule(rule, params)) {
      return rule.suppliers;
    }
  }

  // Fallback: if no rules match, use the catch-all
  return ["duffel", "amadeus", "mock"];
}
