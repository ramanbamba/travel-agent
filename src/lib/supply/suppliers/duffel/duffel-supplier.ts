import type { FlightSupplier } from "../../supplier.interface";
import type {
  FlightOffer,
  SupplySearchParams,
  SupplyBooking,
  SupplyPassenger,
  SupplyPaymentInfo,
  SupplyCancellationResult,
} from "../../types";
import { SupplyError } from "../../types";
import { getDuffelClient } from "./client";
import { getAppMode } from "@/lib/config/app-mode";
import {
  mapDuffelOfferToFlightOffer,
  mapPassengerToDuffel,
  mapDuffelOrderToBooking,
  mapCabinClass,
} from "./mapper";

export class DuffelSupplier implements FlightSupplier {
  readonly name = "duffel";

  isAvailable(): boolean {
    const mode = getAppMode();
    if (mode === "live") return !!process.env.DUFFEL_LIVE_TOKEN;
    return !!process.env.DUFFEL_API_TOKEN;
  }

  async searchFlights(params: SupplySearchParams): Promise<FlightOffer[]> {
    try {
      const duffel = getDuffelClient();

      const passengers: { type: "adult" }[] = Array.from(
        { length: params.adults ?? 1 },
        () => ({ type: "adult" as const })
      );

      const slices = [
        {
          origin: params.origin,
          destination: params.destination,
          departure_date: params.departureDate,
          departure_time: null,
          arrival_time: null,
        },
      ];

      // Add return slice if round-trip
      if (params.returnDate) {
        slices.push({
          origin: params.destination,
          destination: params.origin,
          departure_date: params.returnDate,
          departure_time: null,
          arrival_time: null,
        });
      }

      const offerRequest = await duffel.offerRequests.create({
        slices,
        passengers,
        cabin_class: mapCabinClass(params.cabinClass) as
          | "economy"
          | "premium_economy"
          | "business"
          | "first"
          | undefined,
        return_offers: true,
      });

      const offers = offerRequest.data?.offers ?? [];

      const mapped = offers.map(mapDuffelOfferToFlightOffer);

      // Sort by price ascending
      mapped.sort((a, b) => a.price.total - b.price.total);

      // Limit results
      const maxResults = params.maxResults ?? 20;
      return mapped.slice(0, maxResults);
    } catch (err) {
      if (err instanceof SupplyError) throw err;

      const message = err instanceof Error ? err.message : "Duffel search failed";
      const status = (err as { meta?: { status?: number } })?.meta?.status ?? 500;

      throw new SupplyError(message, "duffel", "SEARCH_FAILED", status);
    }
  }

  async getOfferDetails(offerId: string): Promise<FlightOffer> {
    try {
      const duffel = getDuffelClient();
      // Strip our "duffel-" prefix if present
      const duffelId = offerId.replace(/^duffel-/, "");
      const response = await duffel.offers.get(duffelId);
      return mapDuffelOfferToFlightOffer(response.data);
    } catch (err) {
      if (err instanceof SupplyError) throw err;

      const message = err instanceof Error ? err.message : "Failed to get offer details";
      throw new SupplyError(message, "duffel", "OFFER_DETAILS_FAILED", 500);
    }
  }

  async createBooking(
    offerId: string,
    passengers: SupplyPassenger[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    payment: SupplyPaymentInfo
  ): Promise<SupplyBooking> {
    try {
      const duffel = getDuffelClient();
      const duffelOfferId = offerId.replace(/^duffel-/, "");

      // Fetch the offer to get passenger IDs assigned by Duffel
      const offerResponse = await duffel.offers.get(duffelOfferId);
      const offer = offerResponse.data;
      const offerPassengers = offer.passengers ?? [];

      // Map our passengers to Duffel format, using the IDs from the offer
      const duffelPassengers = passengers.map((p, i) => {
        const passengerId = offerPassengers[i]?.id ?? `pas_unknown_${i}`;
        return mapPassengerToDuffel(p, passengerId);
      });

      // Use the fetched offer's exact price — Duffel re-prices on fetch and
      // rejects payments that don't match the current offer total.
      const order = await duffel.orders.create({
        selected_offers: [duffelOfferId],
        passengers: duffelPassengers,
        type: "instant",
        payments: [
          {
            type: "balance",
            amount: offer.total_amount,
            currency: offer.total_currency,
          },
        ],
      });

      return mapDuffelOrderToBooking(order.data);
    } catch (err) {
      if (err instanceof SupplyError) throw err;

      // Log the full Duffel error for debugging
      const errRecord = err as Record<string, unknown>;
      const meta = errRecord?.meta as Record<string, unknown> | undefined;
      const duffelErrors = (meta?.errors ?? errRecord?.errors ?? []) as { code?: string; message?: string; title?: string }[];
      const firstError = duffelErrors[0];

      console.error("[duffel] createBooking failed:", {
        message: err instanceof Error ? err.message : String(err),
        meta: meta ? JSON.stringify(meta) : undefined,
        errors: duffelErrors.length > 0 ? JSON.stringify(duffelErrors) : undefined,
        offerId,
      });

      const message = firstError?.message
        || (err instanceof Error ? err.message : undefined)
        || "Booking creation failed";

      if (firstError?.code === "offer_expired") {
        throw new SupplyError(
          "This offer has expired. Please search again.",
          "duffel",
          "OFFER_EXPIRED",
          410
        );
      }
      if (firstError?.code === "offer_no_longer_available") {
        throw new SupplyError(
          "This flight is no longer available.",
          "duffel",
          "SOLD_OUT",
          410
        );
      }

      throw new SupplyError(message, "duffel", "BOOKING_FAILED", meta?.status as number ?? 500);
    }
  }

  async cancelBooking(bookingId: string): Promise<SupplyCancellationResult> {
    try {
      const duffel = getDuffelClient();
      const duffelOrderId = bookingId.replace(/^duffel-/, "");

      // Create a cancellation (gets a quote)
      const cancellation = await duffel.orderCancellations.create({
        order_id: duffelOrderId,
      });

      // Confirm the cancellation
      const confirmed = await duffel.orderCancellations.confirm(
        cancellation.data.id
      );

      return {
        success: true,
        refundAmount: confirmed.data.refund_amount
          ? parseFloat(confirmed.data.refund_amount)
          : undefined,
        refundCurrency: confirmed.data.refund_currency ?? undefined,
        message: "Booking cancelled successfully",
      };
    } catch (err) {
      if (err instanceof SupplyError) throw err;

      const message = err instanceof Error ? err.message : "Cancellation failed";
      throw new SupplyError(message, "duffel", "CANCELLATION_FAILED", 500);
    }
  }

  async getBooking(bookingId: string): Promise<SupplyBooking> {
    try {
      const duffel = getDuffelClient();
      const duffelOrderId = bookingId.replace(/^duffel-/, "");
      const response = await duffel.orders.get(duffelOrderId);
      return mapDuffelOrderToBooking(response.data);
    } catch (err) {
      if (err instanceof SupplyError) throw err;

      const message = err instanceof Error ? err.message : "Failed to retrieve booking";
      throw new SupplyError(message, "duffel", "BOOKING_RETRIEVAL_FAILED", 500);
    }
  }
}
