import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyPayment, refundPayment } from "@/lib/payments/razorpay";
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
 * Verify Razorpay payment and create booking.
 * Sequence: verify signature → book with supplier → save to DB.
 * On supplier failure: auto-refund via Razorpay.
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

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    booking,
  } = body as {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    booking: BookingSummary;
  };

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Bad request", message: "Payment verification fields are required" },
      { status: 400 }
    );
  }

  if (!booking) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Bad request", message: "Booking summary is required" },
      { status: 400 }
    );
  }

  // ── Step 1: Verify payment signature ────────────────────────────────────────
  const isValid = verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);

  if (!isValid) {
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: "payment_verification_failed",
        message: "Payment verification failed. Please try again.",
      },
      { status: 400 }
    );
  }

  // ── Step 2: Fetch profile for supplier booking ──────────────────────────────
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("first_name, last_name, date_of_birth, gender, phone")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Refund immediately — no profile means we can't book
    try {
      await refundPayment(razorpay_payment_id);
    } catch (refundErr) {
      console.error("[razorpay-verify] Refund failed (no profile):", refundErr);
    }
    return NextResponse.json<ApiResponse>(
      { data: null, error: "No profile", message: "User profile not found. Payment refunded." },
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

  // ── Step 3: Book with supplier ──────────────────────────────────────────────
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
      console.error("[razorpay-verify] Supplier booking failed:", err);

      // Auto-refund via Razorpay
      try {
        await refundPayment(razorpay_payment_id);
      } catch (refundErr) {
        console.error("[razorpay-verify] Refund after supplier failure:", refundErr);

        // Log incident — refund also failed
        await supabase.from("booking_incidents").insert({
          user_id: user.id,
          incident_type: "refund_failed",
          razorpay_payment_id,
          razorpay_order_id,
          amount: booking.totalPrice.amount,
          currency: booking.totalPrice.currency,
          error_message: `Supplier failed + refund failed: ${refundErr instanceof Error ? refundErr.message : String(refundErr)}`,
        }).then(() => {});
      }

      // Log incident — payment made but booking failed
      supabase.from("booking_incidents").insert({
        user_id: user.id,
        incident_type: "payment_booking_mismatch",
        razorpay_payment_id,
        razorpay_order_id,
        amount: booking.totalPrice.amount,
        currency: booking.totalPrice.currency,
        error_message: err instanceof Error ? err.message : String(err),
      }).then(() => {});

      logAudit(supabase, {
        userId: user.id,
        action: "booking.supplier_failed",
        resourceType: "booking",
        resourceId: "none",
        metadata: {
          supplier: supplierName,
          offerId,
          razorpay_payment_id,
          error: err instanceof Error ? err.message : String(err),
        },
      }).catch(() => {});

      const isExpired = err instanceof SupplyError && err.status === 410;
      const refundMsg = ` Your payment of ${booking.totalPrice.currency === "INR" ? "₹" : "$"}${booking.totalPrice.amount.toLocaleString()} has been refunded.`;
      return NextResponse.json<ApiResponse>(
        {
          data: null,
          error: isExpired ? "offer_expired" : "supplier_booking_failed",
          message: isExpired
            ? `This offer has expired. Please search for flights again.${refundMsg}`
            : `Booking failed with the airline.${refundMsg}`,
        },
        { status: isExpired ? 410 : 502 }
      );
    }
  } else {
    confirmationCode = generateConfirmationCode();
    dataSource = "manual";
  }

  // ── Step 4: Save to DB ──────────────────────────────────────────────────────
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
      razorpay_payment_id,
      razorpay_order_id,
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
    console.error("[razorpay-verify] DB insert failed:", bookingError?.message);

    // Log incident — Duffel succeeded but DB save failed
    supabase.from("booking_incidents").insert({
      user_id: user.id,
      incident_type: "db_save_failed",
      razorpay_payment_id,
      razorpay_order_id,
      duffel_order_id: supplierBookingId,
      amount: booking.totalPrice.amount,
      currency: booking.totalPrice.currency,
      error_message: bookingError?.message ?? "Unknown DB error",
    }).then(() => {});

    // Still return the PNR — it's the most important thing for the user
    const confirmation: BookingConfirmation = {
      bookingId: "pending-db-save",
      confirmationCode,
      flight: booking.flight,
      passenger: booking.passenger,
      totalPrice: booking.totalPrice,
      bookedAt: new Date().toISOString(),
    };

    return NextResponse.json<ApiResponse<BookingConfirmation>>({
      data: confirmation,
      error: null,
      message: "Booking confirmed (DB save pending — your PNR is valid)",
    });
  }

  // Save flight segments
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
    console.error("[razorpay-verify] Segment insert failed:", segmentError.message);
  }

  const confirmation: BookingConfirmation = {
    bookingId: bookingRow.id,
    confirmationCode,
    flight: booking.flight,
    passenger: booking.passenger,
    totalPrice: booking.totalPrice,
    bookedAt: new Date().toISOString(),
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
      paymentMethod: "razorpay",
      razorpay_payment_id,
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
      console.error("[razorpay-verify] Preference learning failed:", err)
    );

  return NextResponse.json<ApiResponse<BookingConfirmation>>({
    data: confirmation,
    error: null,
    message: "Booking confirmed",
  });
}
