export {
  searchFlights,
  searchFlightsParallel,
  searchFlightsCompat,
  toFlightOption,
  registerSupplier,
  resolveSupplierFromOfferId,
  createSupplyBooking,
  cancelSupplyBooking,
  validateOfferFreshness,
} from "./supply-manager";

export { resolveSuppliers } from "./rules-engine";
export type { SupplyRule } from "./rules-engine";
export type { FlightSupplier } from "./supplier.interface";

export {
  SupplyError,
} from "./types";

export type {
  SupplierName,
  CabinClass,
  FlightOffer,
  SupplyFlightSegment,
  PriceBreakdown,
  FareConditions,
  BaggageAllowance,
  SupplySearchParams,
  SupplySearchResult,
  SupplyPassenger,
  SupplyPaymentInfo,
  SupplyBooking,
  SupplyCancellationResult,
} from "./types";
