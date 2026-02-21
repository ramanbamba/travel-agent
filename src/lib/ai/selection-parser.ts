// ============================================================================
// Deterministic Selection Parser
// Handles "the second one", "option 2", "IndiGo one", "cheapest", "earliest"
// WITHOUT calling the AI provider. Pure JavaScript pattern matching.
// Returns null if ambiguous — caller should fall back to AI.
// ============================================================================

export interface SelectableResult {
  airline_name?: string;
  airline_code?: string;
  price?: number;
  departure_time?: string; // HH:MM or ISO string
  arrival_time?: string;
  duration_minutes?: number;
  stops?: number;
}

/**
 * Try to match a user's selection input to one of the flight results.
 * Returns the 0-based index of the matched result, or null if ambiguous.
 */
export function parseSelection(
  input: string,
  results: SelectableResult[]
): number | null {
  if (!results || results.length === 0) return null;

  const trimmed = input.trim().toLowerCase();

  // 1. Direct number: "1", "2", "3", "#2", "no. 3"
  const directNum = tryDirectNumber(trimmed, results.length);
  if (directNum !== null) return directNum;

  // 2. Ordinal: "first", "second", "third", "the first one", "1st", "2nd"
  const ordinal = tryOrdinal(trimmed, results.length);
  if (ordinal !== null) return ordinal;

  // 3. "option N" / "flight N" / "choice N"
  const optionNum = tryOptionPhrase(trimmed, results.length);
  if (optionNum !== null) return optionNum;

  // 4. Airline name or code: "IndiGo", "the IndiGo one", "6E", "AI"
  const airline = tryAirlineMatch(trimmed, results);
  if (airline !== null) return airline;

  // 5. Superlative: "cheapest", "most expensive", "earliest", "latest", "fastest"
  const superlative = trySuperlative(trimmed, results);
  if (superlative !== null) return superlative;

  // 6. Confirmation shortcuts: "yes", "confirm", "book it" (for confirming state)
  // These are NOT selection — return null so the state machine handles them

  return null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function tryDirectNumber(input: string, max: number): number | null {
  // Strip common prefixes
  const cleaned = input.replace(/^(no\.?\s*|#\s*|number\s*)/, "");
  const n = parseInt(cleaned, 10);
  if (!isNaN(n) && n >= 1 && n <= max) return n - 1;
  return null;
}

const ORDINALS: Record<string, number> = {
  first: 0, "1st": 0, one: 0,
  second: 1, "2nd": 1, two: 1,
  third: 2, "3rd": 2, three: 2,
  fourth: 3, "4th": 3, four: 3,
  fifth: 4, "5th": 4, five: 4,
  sixth: 5, "6th": 5, six: 5,
  seventh: 6, "7th": 6, seven: 6,
  eighth: 7, "8th": 7, eight: 7,
};

function tryOrdinal(input: string, max: number): number | null {
  // "the second one", "second", "the 2nd"
  const cleaned = input
    .replace(/^(the\s+|i('ll| will) (take|pick|go with|choose)\s+(the\s+)?)/i, "")
    .replace(/\s*(one|option|flight|choice)$/i, "")
    .trim();

  const idx = ORDINALS[cleaned];
  if (idx !== undefined && idx < max) return idx;
  return null;
}

function tryOptionPhrase(input: string, max: number): number | null {
  const match = input.match(
    /(?:option|flight|choice|pick|number)\s*#?\s*(\d+)/
  );
  if (match) {
    const n = parseInt(match[1], 10);
    if (n >= 1 && n <= max) return n - 1;
  }
  return null;
}

function tryAirlineMatch(
  input: string,
  results: SelectableResult[]
): number | null {
  // Common Indian airline aliases
  const aliases: Record<string, string[]> = {
    "6e": ["indigo", "6e"],
    ai: ["air india", "ai", "airindia"],
    uk: ["vistara", "uk"],
    sg: ["spicejet", "sg", "spice jet", "spice"],
    ix: ["air india express", "ix", "aie"],
    g8: ["go first", "g8", "go air", "goair"],
    i5: ["air asia", "i5", "airasia"],
    qp: ["akasa", "qp", "akasa air"],
    ba: ["british airways", "ba"],
    ek: ["emirates", "ek"],
    sq: ["singapore airlines", "sq", "singapore"],
    lh: ["lufthansa", "lh"],
    aa: ["american airlines", "aa", "american"],
    ua: ["united", "ua", "united airlines"],
    dl: ["delta", "dl"],
    qr: ["qatar", "qr", "qatar airways"],
  };

  // Normalize input: "the IndiGo one" → "indigo"
  const cleaned = input
    .replace(/^(the\s+|i('ll| will) (take|pick|go with|choose)\s+(the\s+)?)/i, "")
    .replace(/\s*(one|option|flight|choice)$/i, "")
    .trim();

  // Find matching result indices
  const matches: number[] = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const code = (r.airline_code ?? "").toLowerCase();
    const name = (r.airline_name ?? "").toLowerCase();

    // Direct code match
    if (cleaned === code) {
      matches.push(i);
      continue;
    }

    // Name match
    if (name && cleaned.includes(name)) {
      matches.push(i);
      continue;
    }

    // Alias match
    for (const [aliasCode, aliasNames] of Object.entries(aliases)) {
      if (code === aliasCode || name.includes(aliasCode)) {
        if (aliasNames.some((a) => cleaned.includes(a))) {
          matches.push(i);
          break;
        }
      }
    }
  }

  // Return only if exactly one match
  if (matches.length === 1) return matches[0];
  return null;
}

function trySuperlative(
  input: string,
  results: SelectableResult[]
): number | null {
  const cleaned = input
    .replace(/^(the\s+|give me\s+|show me\s+|i('ll| will) (take|pick)\s+(the\s+)?)/i, "")
    .replace(/\s*(one|option|flight|choice|please)$/i, "")
    .trim();

  if (/^cheap(est)?$/i.test(cleaned) || cleaned === "lowest price") {
    return findMinIndex(results, (r) => r.price ?? Infinity);
  }

  if (/^(most expensive|priciest|costliest)$/i.test(cleaned)) {
    return findMaxIndex(results, (r) => r.price ?? -Infinity);
  }

  if (/^(earliest|first departure|morning)$/i.test(cleaned)) {
    return findMinIndex(results, (r) => timeToMinutes(r.departure_time));
  }

  if (/^(latest|last departure|evening|night)$/i.test(cleaned)) {
    return findMaxIndex(results, (r) => timeToMinutes(r.departure_time));
  }

  if (/^(fastest|shortest|quickest)$/i.test(cleaned)) {
    return findMinIndex(results, (r) => r.duration_minutes ?? Infinity);
  }

  if (/^(direct|non-?stop|nonstop)$/i.test(cleaned)) {
    const directIdx = results.findIndex((r) => (r.stops ?? 1) === 0);
    return directIdx >= 0 ? directIdx : null;
  }

  return null;
}

function findMinIndex(
  results: SelectableResult[],
  accessor: (r: SelectableResult) => number
): number | null {
  if (results.length === 0) return null;
  let minIdx = 0;
  let minVal = accessor(results[0]);
  for (let i = 1; i < results.length; i++) {
    const val = accessor(results[i]);
    if (val < minVal) {
      minVal = val;
      minIdx = i;
    }
  }
  return minIdx;
}

function findMaxIndex(
  results: SelectableResult[],
  accessor: (r: SelectableResult) => number
): number | null {
  if (results.length === 0) return null;
  let maxIdx = 0;
  let maxVal = accessor(results[0]);
  for (let i = 1; i < results.length; i++) {
    const val = accessor(results[i]);
    if (val > maxVal) {
      maxVal = val;
      maxIdx = i;
    }
  }
  return maxIdx;
}

function timeToMinutes(time?: string): number {
  if (!time) return 9999;
  // Handle "HH:MM" format
  const hhmm = time.match(/(\d{1,2}):(\d{2})/);
  if (hhmm) return parseInt(hhmm[1]) * 60 + parseInt(hhmm[2]);
  // Handle ISO format
  try {
    const d = new Date(time);
    return d.getHours() * 60 + d.getMinutes();
  } catch {
    return 9999;
  }
}

// ── Confirmation & Cancellation Matchers ─────────────────────────────────────

const CONFIRM_PATTERNS = /^(yes|yeah|yep|yup|confirm|book it|book|go ahead|do it|proceed|sure|ok|okay|let'?s go|done|perfect|great|approved?|👍)$/i;
const CANCEL_PATTERNS = /^(no|nah|cancel|stop|start over|reset|never ?mind|back|go back|nope|don'?t|quit)$/i;
const MODIFICATION_HINTS = /(actually|instead|change|modify|different|make it|switch|but|what about|how about|rather)/i;

export function isConfirmation(input: string): boolean {
  return CONFIRM_PATTERNS.test(input.trim());
}

export function isCancellation(input: string): boolean {
  return CANCEL_PATTERNS.test(input.trim());
}

export function isModificationRequest(input: string): boolean {
  return MODIFICATION_HINTS.test(input.trim());
}
