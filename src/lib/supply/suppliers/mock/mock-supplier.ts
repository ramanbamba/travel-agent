import type { FlightSupplier } from "../../supplier.interface";
import type {
  FlightOffer,
  SupplySearchParams,
  SupplyBooking,
  SupplyPassenger,
  SupplyPaymentInfo,
  SupplyCancellationResult,
} from "../../types";
import { generateMockFlights } from "@/lib/mock/flights";
import type { FlightOption } from "@/types/flights";

/** Convert a FlightOption (from existing mock code) to a FlightOffer */
function toFlightOffer(option: FlightOption): FlightOffer {
  return {
    id: option.id,
    supplierName: "mock",
    supplierId: option.id,
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
      baseFare: option.price.amount * 0.85,
      taxesAndFees: option.price.amount * 0.15,
      total: option.price.amount,
      currency: option.price.currency,
    },
    seatsRemaining: option.seatsRemaining,
    conditions: {
      changeable: true,
      refundable: false,
      changePenalty: 75,
    },
    baggageIncluded: {
      carryOn: 1,
      checked: 1,
      checkedWeightKg: 23,
    },
  };
}

export class MockSupplier implements FlightSupplier {
  readonly name = "mock";

  isAvailable(): boolean {
    return true;
  }

  async searchFlights(params: SupplySearchParams): Promise<FlightOffer[]> {
    const results = generateMockFlights(
      params.origin,
      params.destination,
      params.departureDate
    );
    return results.map(toFlightOffer);
  }

  async getOfferDetails(offerId: string): Promise<FlightOffer> {
    // Generate a single mock flight and return it
    const flights = generateMockFlights("JFK", "LHR");
    const offer = toFlightOffer(flights[0]);
    return { ...offer, id: offerId, supplierId: offerId };
  }

  async createBooking(
    offerId: string,
    passengers: SupplyPassenger[],
    payment: SupplyPaymentInfo
  ): Promise<SupplyBooking> {
    const offer = await this.getOfferDetails(offerId);
    return {
      id: `mock-booking-${crypto.randomUUID().slice(0, 8)}`,
      supplierName: "mock",
      supplierBookingId: `MOCK${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      confirmationCode: `MK${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      status: "confirmed",
      offer,
      passengers,
      totalPrice: {
        baseFare: payment.amount * 0.85,
        taxesAndFees: payment.amount * 0.15,
        total: payment.amount,
        currency: payment.currency,
      },
      bookedAt: new Date().toISOString(),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async cancelBooking(bookingId: string): Promise<SupplyCancellationResult> {
    return {
      success: true,
      message: "Mock booking cancelled successfully",
    };
  }

  async getBooking(bookingId: string): Promise<SupplyBooking> {
    const offer = await this.getOfferDetails("mock-offer");
    return {
      id: bookingId,
      supplierName: "mock",
      supplierBookingId: bookingId,
      confirmationCode: "MOCK123",
      status: "confirmed",
      offer,
      passengers: [],
      totalPrice: offer.price,
      bookedAt: new Date().toISOString(),
    };
  }
}
