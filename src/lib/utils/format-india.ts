/**
 * India market formatting utilities.
 * INR currency, IST timezone, Indian date/time conventions.
 */

/** Default currency for the app */
export const DEFAULT_CURRENCY = "INR";

/** Default timezone */
export const DEFAULT_TIMEZONE = "Asia/Kolkata";

/** Default home airport */
export const DEFAULT_HOME_AIRPORT = "BLR";

/**
 * Format amount as Indian Rupees: ₹X,XX,XXX
 * Uses the Indian numbering system (lakh/crore grouping).
 */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/**
 * Format amount with currency symbol.
 * Uses ₹ for INR, $ for USD, etc.
 */
export function formatPrice(amount: number, currency: string): string {
  if (currency === "INR") return formatINR(amount);
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : currency;
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format time in 12hr format with AM/PM: "6:15 AM"
 */
export function formatTimeIST(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: DEFAULT_TIMEZONE,
  });
}

/**
 * Format date: "Tue, 18 Feb 2026"
 */
export function formatDateIST(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: DEFAULT_TIMEZONE,
  });
}

/**
 * Format date + time: "Tue, 18 Feb 2026 · 6:15 AM IST"
 */
export function formatDateTimeIST(isoString: string): string {
  return `${formatDateIST(isoString)} · ${formatTimeIST(isoString)} IST`;
}

/**
 * Popular Indian route suggestions for new users.
 */
export const POPULAR_ROUTES = [
  { origin: "BLR", destination: "DEL", label: "Bangalore → Delhi" },
  { origin: "BLR", destination: "BOM", label: "Bangalore → Mumbai" },
  { origin: "BLR", destination: "HYD", label: "Bangalore → Hyderabad" },
  { origin: "BLR", destination: "MAA", label: "Bangalore → Chennai" },
  { origin: "BLR", destination: "CCU", label: "Bangalore → Kolkata" },
  { origin: "BLR", destination: "PNQ", label: "Bangalore → Pune" },
  { origin: "DEL", destination: "BOM", label: "Delhi → Mumbai" },
  { origin: "DEL", destination: "BLR", label: "Delhi → Bangalore" },
  { origin: "DEL", destination: "HYD", label: "Delhi → Hyderabad" },
];

/**
 * Indian city → IATA code mapping (extends existing airportMap).
 */
export const INDIAN_AIRPORTS: Record<string, string> = {
  delhi: "DEL",
  "new delhi": "DEL",
  del: "DEL",
  mumbai: "BOM",
  bombay: "BOM",
  bom: "BOM",
  bangalore: "BLR",
  bengaluru: "BLR",
  blr: "BLR",
  hyderabad: "HYD",
  hyd: "HYD",
  chennai: "MAA",
  madras: "MAA",
  maa: "MAA",
  kolkata: "CCU",
  calcutta: "CCU",
  ccu: "CCU",
  pune: "PNQ",
  pnq: "PNQ",
  ahmedabad: "AMD",
  amd: "AMD",
  goa: "GOI",
  goi: "GOI",
  jaipur: "JAI",
  jai: "JAI",
  lucknow: "LKO",
  lko: "LKO",
  kochi: "COK",
  cochin: "COK",
  cok: "COK",
  thiruvananthapuram: "TRV",
  trivandrum: "TRV",
  trv: "TRV",
  chandigarh: "IXC",
  ixc: "IXC",
  indore: "IDR",
  idr: "IDR",
  varanasi: "VNS",
  vns: "VNS",
  patna: "PAT",
  pat: "PAT",
  bhubaneswar: "BBI",
  bbi: "BBI",
  nagpur: "NAG",
  nag: "NAG",
  coimbatore: "CJB",
  cjb: "CJB",
  srinagar: "SXR",
  sxr: "SXR",
};

/**
 * Indian airline code mapping.
 */
export const INDIAN_AIRLINES: Record<string, string> = {
  indigo: "6E",
  "6e": "6E",
  "air india": "AI",
  ai: "AI",
  akasa: "QP",
  "akasa air": "QP",
  qp: "QP",
  spicejet: "SG",
  sg: "SG",
  "air india express": "IX",
  ix: "IX",
  vistara: "AI", // merged into Air India
  "star air": "S5",
  s5: "S5",
  "alliance air": "9I",
  "9i": "9I",
};
