// ── Supplier identification ──────────────────────────────────────────────────

/** Known supplier names. Extensible via string for NDC suppliers (e.g. "ba_ndc"). */
export type SupplierName = "amadeus" | "duffel" | "mock" | (string & {});

// ── Cabin class ──────────────────────────────────────────────────────────────

export type CabinClass = "economy" | "premium_economy" | "business" | "first";

// ── Flight offer types ───────────────────────────────────────────────────────

export interface SupplyFlightSegment {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  departure: {
    airport: string;
    airportCode: string;
    time: string; // ISO 8601
    terminal?: string;
  };
  arrival: {
    airport: string;
    airportCode: string;
    time: string;
    terminal?: string;
  };
  duration: string; // e.g. "7h 30m"
  cabin: CabinClass;
  aircraft?: string;
}

export interface PriceBreakdown {
  baseFare: number;
  taxesAndFees: number;
  total: number;
  currency: string;
  markup?: number;
  serviceFee?: number;
}

export interface FareConditions {
  changeable: boolean;
  refundable: boolean;
  changePenalty?: number;
  cancelPenalty?: number;
}

export interface BaggageAllowance {
  carryOn: number; // number of pieces
  checked: number;
  checkedWeightKg?: number;
}

export interface FlightOffer {
  id: string;
  supplierName: SupplierName;
  supplierId: string; // supplier's own ID for this offer
  segments: SupplyFlightSegment[];
  totalDuration: string;
  stops: number;
  price: PriceBreakdown;
  seatsRemaining?: number;
  expiresAt?: string; // ISO 8601
  conditions?: FareConditions;
  baggageIncluded?: BaggageAllowance;
}

// ── Search parameters ────────────────────────────────────────────────────────

export interface SupplySearchParams {
  origin: string;
  destination: string;
  departureDate: string; // YYYY-MM-DD
  returnDate?: string;
  adults?: number;
  cabinClass?: CabinClass;
  airline?: string; // IATA airline code — used for NDC routing
  maxResults?: number;
  currency?: string; // Preferred currency (e.g. "INR", "USD")
}

// ── Booking types (interface-complete, used in future prompts) ───────────────

export interface SupplyPassenger {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  passportNumber?: string;
  passportExpiry?: string;
  nationality?: string;
  gender?: "male" | "female";
}

export interface SupplyPaymentInfo {
  type: "stripe" | "duffel_balance" | "card";
  token?: string;
  currency: string;
  amount: number;
}

export interface SupplyBooking {
  id: string;
  supplierName: SupplierName;
  supplierBookingId: string;
  confirmationCode: string;
  status: "confirmed" | "pending" | "cancelled" | "failed";
  offer: FlightOffer;
  passengers: SupplyPassenger[];
  totalPrice: PriceBreakdown;
  bookedAt: string;
}

export interface SupplyCancellationResult {
  success: boolean;
  refundAmount?: number;
  refundCurrency?: string;
  message?: string;
}

// ── Search result ────────────────────────────────────────────────────────────

export interface SupplySearchResult {
  offers: FlightOffer[];
  source: SupplierName;
}

// ── Error type ───────────────────────────────────────────────────────────────

export class SupplyError extends Error {
  supplier: SupplierName;
  code: string;
  status: number;

  constructor(
    message: string,
    supplier: SupplierName,
    code: string,
    status: number = 500
  ) {
    super(message);
    this.name = "SupplyError";
    this.supplier = supplier;
    this.code = code;
    this.status = status;
  }
}
