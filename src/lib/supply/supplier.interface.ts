import type {
  FlightOffer,
  SupplySearchParams,
  SupplyBooking,
  SupplyPassenger,
  SupplyPaymentInfo,
  SupplyCancellationResult,
} from "./types";

export interface FlightSupplier {
  /** Unique supplier identifier (e.g. "amadeus", "ba_ndc") */
  readonly name: string;

  /** Whether this supplier is configured and available */
  isAvailable(): boolean;

  /** Search for flight offers */
  searchFlights(params: SupplySearchParams): Promise<FlightOffer[]>;

  /** Get full details for a specific offer */
  getOfferDetails(offerId: string): Promise<FlightOffer>;

  /** Create a booking from an offer */
  createBooking(
    offerId: string,
    passengers: SupplyPassenger[],
    payment: SupplyPaymentInfo
  ): Promise<SupplyBooking>;

  /** Cancel an existing booking */
  cancelBooking(bookingId: string): Promise<SupplyCancellationResult>;

  /** Retrieve booking details */
  getBooking(bookingId: string): Promise<SupplyBooking>;
}
