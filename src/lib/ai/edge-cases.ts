// ============================================================================
// Edge Case Handlers
// Pre-AI deterministic checks for common edge cases:
// past dates, missing params, ambiguous cities, non-travel requests.
// Returns a response string if handled, or null to fall through to AI.
// ============================================================================

// ── Past Date Detection ──

/**
 * Check if a parsed date string is in the past.
 * Returns a suggestion message if so, null otherwise.
 */
export function checkPastDate(dateStr: string | undefined): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr + "T23:59:59");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      const dayName = new Date(dateStr).toLocaleDateString("en-US", { weekday: "long" });
      return `That date has already passed. Did you mean next ${dayName}?`;
    }
  } catch {
    // Invalid date string — let AI handle
  }
  return null;
}

// ── Ambiguous City Resolution ──

interface CityMatch {
  code: string;
  name: string;
  alternates?: string[];
}

const INDIAN_CITIES: Record<string, CityMatch> = {
  delhi: { code: "DEL", name: "Delhi (DEL)" },
  "new delhi": { code: "DEL", name: "Delhi (DEL)" },
  mumbai: { code: "BOM", name: "Mumbai (BOM)" },
  bombay: { code: "BOM", name: "Mumbai (BOM)" },
  bangalore: { code: "BLR", name: "Bangalore (BLR)" },
  bengaluru: { code: "BLR", name: "Bangalore (BLR)" },
  hyderabad: { code: "HYD", name: "Hyderabad (HYD)" },
  chennai: { code: "MAA", name: "Chennai (MAA)" },
  madras: { code: "MAA", name: "Chennai (MAA)" },
  kolkata: { code: "CCU", name: "Kolkata (CCU)" },
  calcutta: { code: "CCU", name: "Kolkata (CCU)" },
  pune: { code: "PNQ", name: "Pune (PNQ)" },
  ahmedabad: { code: "AMD", name: "Ahmedabad (AMD)" },
  goa: { code: "GOI", name: "Goa (GOI)" },
  jaipur: { code: "JAI", name: "Jaipur (JAI)" },
  lucknow: { code: "LKO", name: "Lucknow (LKO)" },
  kochi: { code: "COK", name: "Kochi (COK)" },
  cochin: { code: "COK", name: "Kochi (COK)" },
  chandigarh: { code: "IXC", name: "Chandigarh (IXC)" },
  guwahati: { code: "GAU", name: "Guwahati (GAU)" },
  trivandrum: { code: "TRV", name: "Trivandrum (TRV)" },
  thiruvananthapuram: { code: "TRV", name: "Trivandrum (TRV)" },
  srinagar: { code: "SXR", name: "Srinagar (SXR)" },
  varanasi: { code: "VNS", name: "Varanasi (VNS)" },
  bhubaneswar: { code: "BBI", name: "Bhubaneswar (BBI)" },
  indore: { code: "IDR", name: "Indore (IDR)" },
  nagpur: { code: "NAG", name: "Nagpur (NAG)" },
  patna: { code: "PAT", name: "Patna (PAT)" },
  coimbatore: { code: "CJB", name: "Coimbatore (CJB)" },
  visakhapatnam: { code: "VTZ", name: "Visakhapatnam (VTZ)" },
  vizag: { code: "VTZ", name: "Visakhapatnam (VTZ)" },
};

const INTERNATIONAL_CITIES: Record<string, CityMatch> = {
  "new york": { code: "JFK", name: "New York (JFK)" },
  london: { code: "LHR", name: "London (LHR)" },
  dubai: { code: "DXB", name: "Dubai (DXB)" },
  singapore: { code: "SIN", name: "Singapore (SIN)" },
  bangkok: { code: "BKK", name: "Bangkok (BKK)" },
  "hong kong": { code: "HKG", name: "Hong Kong (HKG)" },
  tokyo: { code: "NRT", name: "Tokyo (NRT)" },
  sydney: { code: "SYD", name: "Sydney (SYD)" },
  "san francisco": { code: "SFO", name: "San Francisco (SFO)" },
  paris: { code: "CDG", name: "Paris (CDG)" },
};

/**
 * Resolve a city name to IATA code.
 * Returns { code, name } or null if not found.
 */
export function resolveCity(input: string): CityMatch | null {
  const normalized = input.trim().toLowerCase();
  // Direct IATA code (3 letters)
  if (/^[a-z]{3}$/.test(normalized)) {
    return { code: normalized.toUpperCase(), name: normalized.toUpperCase() };
  }
  return INDIAN_CITIES[normalized] ?? INTERNATIONAL_CITIES[normalized] ?? null;
}

// ── Non-Travel Detection ──

const NON_TRAVEL_PATTERNS = [
  /\b(weather|temperature|forecast)\b/i,
  /\b(joke|funny|laugh)\b/i,
  /\b(meaning of life|philosophy|love)\b/i,
  /\b(recipe|cook|food)\b/i,
  /\b(news|headlines|politics)\b/i,
  /\b(stock|market|crypto|bitcoin)\b/i,
  /\b(math|calculate|equation)\b/i,
  /\b(translate|language)\b/i,
  /\b(poem|story|write me)\b/i,
];

/**
 * Quick check if the message is clearly non-travel.
 * Only returns true for obviously off-topic requests.
 * Returns false for ambiguous inputs — let AI handle those.
 */
export function isNonTravelRequest(input: string): boolean {
  const trimmed = input.trim();
  // Very short messages or travel-adjacent are not flagged
  if (trimmed.length < 8) return false;
  // Don't flag if it contains travel keywords
  if (/\b(flight|book|fly|trip|travel|airport|ticket|seat|boarding|cancel|policy|approve|booking|hotel)\b/i.test(trimmed)) {
    return false;
  }
  return NON_TRAVEL_PATTERNS.some(p => p.test(trimmed));
}

// ── Fuzzy Intent Recovery ──

const COMMON_TYPOS: Array<{ pattern: RegExp; correction: string }> = [
  { pattern: /\bb[ou][lo]k\b/i, correction: "book" },
  { pattern: /\bfligth\b/i, correction: "flight" },
  { pattern: /\bflght\b/i, correction: "flight" },
  { pattern: /\bcanecl\b/i, correction: "cancel" },
  { pattern: /\bcancle\b/i, correction: "cancel" },
  { pattern: /\btoday's?\b/i, correction: "today" },
  { pattern: /\btommorow\b/i, correction: "tomorrow" },
  { pattern: /\btommorrow\b/i, correction: "tomorrow" },
  { pattern: /\btomorrow's?\b/i, correction: "tomorrow" },
  { pattern: /\bmonrning\b/i, correction: "morning" },
  { pattern: /\bevning\b/i, correction: "evening" },
];

/**
 * Attempt to fix common typos in the input.
 * Returns corrected string, or the original if no typos detected.
 */
export function fixCommonTypos(input: string): string {
  let result = input;
  for (const { pattern, correction } of COMMON_TYPOS) {
    result = result.replace(pattern, correction);
  }
  return result;
}

/**
 * Check if the input looks like garbled text (keyboard mash, random chars).
 * Returns true if the input seems like gibberish.
 */
export function isGibberish(input: string): boolean {
  const trimmed = input.trim();
  if (trimmed.length < 3) return false;
  // High ratio of non-alpha characters
  const alphaCount = (trimmed.match(/[a-zA-Z]/g) ?? []).length;
  if (trimmed.length > 5 && alphaCount / trimmed.length < 0.4) return true;
  // No vowels in a word longer than 4 chars
  const words = trimmed.split(/\s+/);
  const longConsonantOnly = words.filter(w => w.length > 4 && !/[aeiouAEIOU]/.test(w));
  if (longConsonantOnly.length > 0 && longConsonantOnly.length === words.length) return true;
  return false;
}
