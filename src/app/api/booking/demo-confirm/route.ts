import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import {
  resolveSupplierFromOfferId,
  createSupplyBooking,
  SupplyError,
} from "@/lib/supply";
import type { SupplyPassenger, SupplyPaymentInfo } from "@/lib/supply";
import type { ApiResponse, BookingConfirmation, BookingSummary } from "@/types";
import { PreferenceEngine } from "@/lib/intelligence/preference-engine";

function generateConfirmationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Demo booking route — bypasses Stripe payment entirely.
 * Books directly with the supplier (Duffel/mock) and saves to DB.
 * Only for testing — do NOT use in production.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Unauthorized", message: "You must be logged in" },
      { status: 401 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Bad request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const booking = body.booking as BookingSummary;
  if (!booking) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Bad request", message: "Booking summary is required" },
      { status: 400 }
    );
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("first_name, last_name, date_of_birth, gender, phone")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "No profile", message: "User profile not found" },
      { status: 400 }
    );
  }

  const amountCents = Math.round(booking.totalPrice.amount * 100);
  const serviceFeeCents = booking.totalPrice.serviceFee
    ? Math.round(booking.totalPrice.serviceFee * 100)
    : 0;
  const markupCents = booking.totalPrice.markup
    ? Math.round(booking.totalPrice.markup * 100)
    : 0;
  const supplierCostCents = amountCents - serviceFeeCents - markupCents;
  const ourRevenueCents = markupCents + serviceFeeCents;

  // ── Book with supplier ──────────────────────────────────────────────────────
  const offerId = booking.flight.id;
  const supplierName = resolveSupplierFromOfferId(offerId);
  const BOOKABLE_SUPPLIERS = new Set(["duffel", "mock"]);
  const isBookable = BOOKABLE_SUPPLIERS.has(supplierName);

  let confirmationCode: string;
  let supplierBookingId: string | null = null;
  let dataSource: string;

  if (isBookable) {
    const passenger: SupplyPassenger = {
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: user.email ?? "",
      phone: profile.phone ?? undefined,
      dateOfBirth: profile.date_of_birth ?? undefined,
      gender:
        profile.gender === "male" || profile.gender === "female"
          ? profile.gender
          : undefined,
    };

    const supplyPayment: SupplyPaymentInfo = {
      type: supplierName === "duffel" ? "duffel_balance" : "card",
      currency: booking.totalPrice.currency,
      amount: supplierCostCents / 100,
    };

    try {
      const supplyBooking = await createSupplyBooking(
        offerId,
        [passenger],
        supplyPayment
      );
      confirmationCode = supplyBooking.confirmationCode;
      supplierBookingId = supplyBooking.supplierBookingId;
      dataSource = supplierName;
    } catch (err) {
      console.error("[demo-booking] Supplier booking failed:", err);

      logAudit(supabase, {
        userId: user.id,
        action: "booking.supplier_failed",
        resourceType: "booking",
        resourceId: "none",
        metadata: {
          supplier: supplierName,
          offerId,
          error: err instanceof Error ? err.message : String(err),
        },
      }).catch(() => {});

      const isExpired = err instanceof SupplyError && err.status === 410;
      return NextResponse.json<ApiResponse>(
        {
          data: null,
          error: isExpired ? "offer_expired" : "supplier_booking_failed",
          message: isExpired
            ? "This offer has expired. Please search for flights again."
            : "Booking failed with the airline. Please try again.",
        },
        { status: isExpired ? 410 : 502 }
      );
    }
  } else {
    confirmationCode = generateConfirmationCode();
    dataSource = "manual";
  }

  const segment = booking.flight.segments[0];
  const cabinClass = segment?.cabin ?? "economy";

  const { data: bookingRow, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      user_id: user.id,
      status: "confirmed",
      pnr: confirmationCode,
      total_price_cents: amountCents,
      currency: booking.totalPrice.currency,
      cabin_class: cabinClass,
      data_source: dataSource,
      booked_at: new Date().toISOString(),
      payment_status: "captured",
      supplier_cost_cents: supplierCostCents,
      markup_cents: markupCents,
      service_fee_cents: serviceFeeCents,
      our_revenue_cents: ourRevenueCents,
      supplier_name: isBookable ? supplierName : null,
      supplier_booking_id: supplierBookingId,
      supplier_offer_id: isBookable ? offerId : null,
    })
    .select("id")
    .single();

  if (bookingError || !bookingRow) {
    console.error("[demo-booking] DB insert failed:", bookingError?.message, bookingError?.details);
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: bookingError?.message ?? "Failed to create booking",
        message: "Booking failed — database error",
      },
      { status: 500 }
    );
  }

  const segmentInserts = booking.flight.segments.map((seg, index) => ({
    booking_id: bookingRow.id,
    segment_order: index + 1,
    airline_code: seg.airlineCode,
    flight_number: seg.flightNumber,
    departure_airport: seg.departure.airportCode,
    arrival_airport: seg.arrival.airportCode,
    departure_time: seg.departure.time,
    arrival_time: seg.arrival.time,
    aircraft_type: seg.aircraft ?? null,
    cabin_class: seg.cabin,
  }));

  const { error: segmentError } = await supabase
    .from("flight_segments")
    .insert(segmentInserts);

  if (segmentError) {
    console.error("[demo-booking] Segment insert failed:", segmentError.message);
  }

  const bookedAt = new Date().toISOString();

  const confirmation: BookingConfirmation = {
    bookingId: bookingRow.id,
    confirmationCode,
    flight: booking.flight,
    passenger: booking.passenger,
    totalPrice: booking.totalPrice,
    bookedAt,
  };

  logAudit(supabase, {
    userId: user.id,
    action: "booking.created",
    resourceType: "booking",
    resourceId: bookingRow.id,
    metadata: {
      pnr: confirmationCode,
      amountCents,
      currency: booking.totalPrice.currency,
      supplier: isBookable ? supplierName : "manual",
      supplierBookingId,
      demo: true,
    },
  }).catch(() => {});

  // ── Learn from this booking (fire-and-forget) ─────────────────────────────
  const depDate = new Date(segment.departure.time);
  const daysBeforeDep = Math.max(
    0,
    Math.round((depDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );
  const prefEngine = new PreferenceEngine(supabase);
  prefEngine
    .learnFromBooking(user.id, {
      route: `${segment.departure.airportCode}-${segment.arrival.airportCode}`,
      airlineCode: segment.airlineCode,
      airlineName: segment.airline,
      flightNumber: segment.flightNumber,
      departureTime: segment.departure.time,
      arrivalTime: segment.arrival.time,
      dayOfWeek: depDate.getDay(),
      daysBeforeDeparture: daysBeforeDep,
      pricePaid: booking.totalPrice.amount,
      currency: booking.totalPrice.currency,
      cabinClass,
      duffelOfferId: isBookable ? offerId : undefined,
      duffelOrderId: supplierBookingId ?? undefined,
    })
    .catch((err) =>
      console.error("[demo-booking] Preference learning failed:", err)
    );

  return NextResponse.json<ApiResponse<BookingConfirmation>>({
    data: confirmation,
    error: null,
    message: "Booking confirmed (demo)",
  });
}
