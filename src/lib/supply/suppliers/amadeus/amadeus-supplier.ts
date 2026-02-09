import type { FlightSupplier } from "../../supplier.interface";
import type {
  FlightOffer,
  SupplySearchParams,
  SupplyBooking,
  SupplyPassenger,
  SupplyPaymentInfo,
  SupplyCancellationResult,
  CabinClass,
} from "../../types";
import { SupplyError } from "../../types";
import { searchFlights as amadeusSearchFlights } from "@/lib/amadeus/flights";
import { AmadeusApiError } from "@/lib/amadeus/client";
import type { FlightOption } from "@/types/flights";

/** Map our CabinClass to Amadeus cabin class format */
function toAmadeusCabin(
  cabin?: CabinClass
): "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST" | undefined {
  if (!cabin) return undefined;
  return cabin.toUpperCase() as "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
}

/** Convert a FlightOption (from existing Amadeus code) to a FlightOffer */
function toFlightOffer(option: FlightOption): FlightOffer {
  return {
    id: option.id,
    supplierName: "amadeus",
    supplierId: option.id.replace("amadeus-", ""),
    segments: option.segments.map((seg) => ({
      id: seg.id,
      airline: seg.airline,
      airlineCode: seg.airlineCode,
      flightNumber: seg.flightNumber,
      departure: { ...seg.departure },
      arrival: { ...seg.arrival },
      duration: seg.duration,
      cabin: seg.cabin,
      aircraft: seg.aircraft,
    })),
    totalDuration: option.totalDuration,
    stops: option.stops,
    price: {
      baseFare: option.price.amount,
      taxesAndFees: 0, // Amadeus search doesn't break down taxes
      total: option.price.amount,
      currency: option.price.currency,
    },
    seatsRemaining: option.seatsRemaining,
  };
}

export class AmadeusSupplier implements FlightSupplier {
  readonly name = "amadeus";

  isAvailable(): boolean {
    return !!(process.env.AMADEUS_API_KEY && process.env.AMADEUS_API_SECRET);
  }

  async searchFlights(params: SupplySearchParams): Promise<FlightOffer[]> {
    try {
      const results = await amadeusSearchFlights({
        origin: params.origin,
        destination: params.destination,
        departureDate: params.departureDate,
        adults: params.adults,
        cabinClass: toAmadeusCabin(params.cabinClass),
        maxResults: params.maxResults,
      });

      return results.map(toFlightOffer);
    } catch (err) {
      if (err instanceof AmadeusApiError) {
        throw new SupplyError(
          err.message,
          "amadeus",
          err.code ?? "AMADEUS_ERROR",
          err.status
        );
      }
      throw new SupplyError(
        err instanceof Error ? err.message : "Amadeus search failed",
        "amadeus",
        "UNKNOWN",
        500
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getOfferDetails(offerId: string): Promise<FlightOffer> {
    throw new SupplyError(
      "Amadeus offer details not supported in test environment",
      "amadeus",
      "NOT_SUPPORTED"
    );
  }

  async createBooking(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    offerId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    passengers: SupplyPassenger[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    payment: SupplyPaymentInfo
  ): Promise<SupplyBooking> {
    throw new SupplyError(
      "Amadeus booking not supported in test environment",
      "amadeus",
      "NOT_SUPPORTED"
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async cancelBooking(bookingId: string): Promise<SupplyCancellationResult> {
    throw new SupplyError(
      "Amadeus cancellation not supported in test environment",
      "amadeus",
      "NOT_SUPPORTED"
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getBooking(bookingId: string): Promise<SupplyBooking> {
    throw new SupplyError(
      "Amadeus booking retrieval not supported in test environment",
      "amadeus",
      "NOT_SUPPORTED"
    );
  }
}
