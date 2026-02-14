import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { getResend, FROM_EMAIL } from "@/lib/email/client";
import { BookingConfirmationEmail } from "@/lib/email/booking-confirmation";
import { logAudit } from "@/lib/audit";
import {
  resolveSupplierFromOfferId,
  createSupplyBooking,
  validateOfferFreshness,
  SupplyError,
} from "@/lib/supply";
import type { SupplyPassenger, SupplyPaymentInfo } from "@/lib/supply";
import type { ApiResponse, BookingConfirmation, BookingSummary } from "@/types";
import { PreferenceEngine } from "@/lib/intelligence/preference-engine";
import { getOrCreateReferralCode, recordReferralBooking } from "@/lib/referrals";

function generateConfirmationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function friendlyStripeError(code: string | undefined): string {
  switch (code) {
    case "card_declined":
      return "Your card was declined. Please try a different card.";
    case "insufficient_funds":
      return "Insufficient funds. Please try a different card.";
    case "expired_card":
      return "Your card has expired. Please update your card details.";
    case "incorrect_cvc":
      return "Incorrect CVC. Please check your card details.";
    case "processing_error":
      return "A processing error occurred. Please try again.";
    default:
      return "Payment failed. Please try a different card.";
  }
}

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

  const body = await request.json();
  const booking = body.booking as BookingSummary;
  const paymentMethodId = body.paymentMethodId as string | undefined;

  if (!booking) {
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: "Bad request",
        message: "Booking summary is required",
      },
      { status: 400 }
    );
  }

  if (!paymentMethodId) {
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: "Bad request",
        message: "Payment method is required",
      },
      { status: 400 }
    );
  }

  // Verify the payment method belongs to this user
  const { data: pmRow } = await supabase
    .from("payment_methods")
    .select("stripe_payment_method_id")
    .eq("id", paymentMethodId)
    .eq("user_id", user.id)
    .single();

  if (!pmRow) {
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: "Not found",
        message: "Payment method not found",
      },
      { status: 404 }
    );
  }

  // Get Stripe customer ID and profile info for email + supplier booking
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("stripe_customer_id, first_name, last_name, date_of_birth, gender, phone")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: "No customer",
        message: "No Stripe customer found. Please add a payment method first.",
      },
      { status: 400 }
    );
  }

  const amountCents = Math.round(booking.totalPrice.amount * 100);

  // Calculate cost breakdown for revenue tracking
  const serviceFeeCents = booking.totalPrice.serviceFee
    ? Math.round(booking.totalPrice.serviceFee * 100)
    : 0;
  const markupCents = booking.totalPrice.markup
    ? Math.round(booking.totalPrice.markup * 100)
    : 0;
  const supplierCostCents = amountCents - serviceFeeCents - markupCents;
  const ourRevenueCents = markupCents + serviceFeeCents;

  // ── Pre-booking: validate offer freshness ───────────────────────────────────
  const preOfferId = booking.flight.id;
  try {
    const freshness = await validateOfferFreshness(preOfferId, amountCents, booking.totalPrice.currency.toLowerCase());
    if (freshness.priceChanged) {
      console.warn(
        `[booking] Price changed: expected ${amountCents}, got ${freshness.currentPriceCents}`
      );
    }
  } catch (err) {
    if (err instanceof SupplyError && err.status === 410) {
      return NextResponse.json<ApiResponse>(
        {
          data: null,
          error: "offer_expired",
          message: "This offer has expired. Please search for flights again.",
        },
        { status: 410 }
      );
    }
    console.warn("[booking] Offer validation failed, proceeding:", err);
  }

  // Create and confirm PaymentIntent
  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: booking.totalPrice.currency.toLowerCase(),
      customer: profile.stripe_customer_id,
      payment_method: pmRow.stripe_payment_method_id,
      confirm: true,
      off_session: true,
      metadata: {
        supabase_user_id: user.id,
      },
    });
  } catch (err: unknown) {
    const stripeErr = err as { code?: string; message?: string };
    const friendlyMsg = friendlyStripeError(stripeErr.code);
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: stripeErr.code ?? "payment_failed",
        message: friendlyMsg,
      },
      { status: 402 }
    );
  }

  if (paymentIntent.status !== "succeeded") {
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: "payment_incomplete",
        message: "Payment could not be completed. Please try again.",
      },
      { status: 402 }
    );
  }

  // ── Phase 2: Book with supplier ─────────────────────────────────────────────
  const offerId = booking.flight.id;
  const supplierName = resolveSupplierFromOfferId(offerId);
  const BOOKABLE_SUPPLIERS = new Set(["duffel", "mock"]);
  const isBookable = BOOKABLE_SUPPLIERS.has(supplierName);

  let confirmationCode: string;
  let supplierBookingId: string | null = null;
  let dataSource: string;

  if (isBookable) {
    // Build passenger from profile
    const passenger: SupplyPassenger = {
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: user.email ?? "",
      phone: profile.phone ?? undefined,
      dateOfBirth: profile.date_of_birth ?? undefined,
      gender: profile.gender === "male" || profile.gender === "female"
        ? profile.gender
        : undefined,
    };

    // Payment to supplier is at supplier cost, not customer-facing price
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
      // Supplier booking failed — auto-refund Stripe
      console.error("[booking] Supplier booking failed, refunding Stripe:", err);

      let refundSucceeded = false;
      try {
        await stripe.refunds.create({ payment_intent: paymentIntent.id });
        refundSucceeded = true;
      } catch (refundErr) {
        console.error("[booking] Stripe refund also failed:", refundErr);

        // Log refund failure as critical incident
        supabase.from("booking_incidents").insert({
          user_id: user.id,
          incident_type: "refund_failed",
          amount: booking.totalPrice.amount,
          currency: booking.totalPrice.currency,
          error_message: `Supplier failed + Stripe refund failed: ${refundErr instanceof Error ? refundErr.message : String(refundErr)}`,
        }).then(() => {});
      }

      // Log payment-booking mismatch incident
      supabase.from("booking_incidents").insert({
        user_id: user.id,
        incident_type: "payment_booking_mismatch",
        amount: booking.totalPrice.amount,
        currency: booking.totalPrice.currency,
        error_message: `Stripe PI ${paymentIntent.id}: ${err instanceof Error ? err.message : String(err)}`,
      }).then(() => {});

      // Audit the failure
      logAudit(supabase, {
        userId: user.id,
        action: "booking.supplier_failed",
        resourceType: "booking",
        resourceId: "none",
        metadata: {
          supplier: supplierName,
          offerId,
          stripePaymentIntentId: paymentIntent.id,
          refundSucceeded,
          error: err instanceof Error ? err.message : String(err),
        },
      }).catch(() => {});

      const isExpired = err instanceof SupplyError && err.status === 410;
      const refundMsg = refundSucceeded ? " Your card has been refunded." : " A refund will be processed shortly.";
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
    // Non-bookable supplier (amadeus, unknown) — use random PNR
    confirmationCode = generateConfirmationCode();
    dataSource = "manual";
  }

  const segment = booking.flight.segments[0];
  const cabinClass = segment?.cabin ?? "economy";

  // Insert booking into database
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
      stripe_payment_intent_id: paymentIntent.id,
      payment_status: "captured",
      payment_method_id: paymentMethodId,
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
    console.error("[booking] DB insert failed:", bookingError?.message, bookingError?.details, bookingError?.hint);
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: bookingError?.message ?? "Failed to create booking",
        message: "Booking failed",
      },
      { status: 500 }
    );
  }

  // Insert flight segments
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
    await supabase
      .from("bookings")
      .update({ status: "failed" })
      .eq("id", bookingRow.id);

    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: segmentError.message,
        message: "Booking failed — could not save flight segments",
      },
      { status: 500 }
    );
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

  // Fire-and-forget: send confirmation email + audit logs
  const passengerName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name}`
    : booking.passenger.firstName;

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: booking.totalPrice.currency,
  }).format(booking.totalPrice.amount);

  const emailSegment = booking.flight.segments[0];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://skyswift.app";

  // Get referral code for email (fire-and-forget, don't block confirmation)
  let userReferralCode: string | undefined;
  try {
    userReferralCode = await getOrCreateReferralCode(supabase, user.id);
  } catch {
    // Non-critical
  }

  // Record referral conversion if this user was referred
  recordReferralBooking(supabase, user.id).catch(() => {});

  const emailPromise = user.email
    ? getResend().emails
        .send({
          from: FROM_EMAIL,
          to: user.email,
          subject: `Booking Confirmed: ${emailSegment.departure.airportCode} → ${emailSegment.arrival.airportCode} (${confirmationCode})`,
          react: BookingConfirmationEmail({
            confirmationCode,
            passengerName,
            flight: {
              airline: emailSegment.airline,
              flightNumber: emailSegment.flightNumber,
              departureAirport: emailSegment.departure.airportCode,
              arrivalAirport: emailSegment.arrival.airportCode,
              departureTime: emailSegment.departure.time,
              arrivalTime: emailSegment.arrival.time,
              cabin: emailSegment.cabin,
            },
            totalPrice: formattedPrice,
            bookedAt,
            bookingId: bookingRow.id,
            referralCode: userReferralCode,
            appUrl,
          }),
        })
        .then((result) => {
          if (result.error) {
            console.error("[email] Failed to send confirmation:", result.error);
          }
          // Audit the email send
          logAudit(supabase, {
            userId: user.id,
            action: "email.booking_confirmation_sent",
            resourceType: "booking",
            resourceId: bookingRow.id,
            metadata: { emailId: result.data?.id },
          });
        })
        .catch((err) => {
          console.error("[email] Unexpected error:", err);
        })
    : Promise.resolve();

  const auditPromise = logAudit(supabase, {
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
    },
  });

  // ── Learn from this booking (fire-and-forget) ─────────────────────────────
  const depDate = new Date(segment.departure.time);
  const daysBeforeDep = Math.max(
    0,
    Math.round((depDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );
  const prefEngine = new PreferenceEngine(supabase);
  const learnPromise = prefEngine
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
      console.error("[booking] Preference learning failed:", err)
    );

  // Don't await — fire-and-forget so we don't delay the response
  Promise.all([emailPromise, auditPromise, learnPromise]).catch(() => {});

  return NextResponse.json<ApiResponse<BookingConfirmation>>({
    data: confirmation,
    error: null,
    message: "Booking confirmed",
  });
}
