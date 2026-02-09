import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getResend, FROM_EMAIL } from "@/lib/email/client";
import { BookingConfirmationEmail } from "@/lib/email/booking-confirmation";
import { logAudit } from "@/lib/audit";
import type { ApiResponse } from "@/types";

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
  const bookingId = body.bookingId as string | undefined;

  if (!bookingId) {
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: "Bad request",
        message: "bookingId is required",
      },
      { status: 400 }
    );
  }

  // Fetch booking + segments (verifies ownership via RLS)
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("*, flight_segments(*)")
    .eq("id", bookingId)
    .eq("user_id", user.id)
    .single();

  if (bookingError || !booking) {
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: "Not found",
        message: "Booking not found",
      },
      { status: 404 }
    );
  }

  // Fetch user profile for passenger name
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();

  const passengerName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : user.email ?? "Traveler";

  const segments = booking.flight_segments ?? [];
  const firstSegment = segments.sort(
    (a: { segment_order: number }, b: { segment_order: number }) =>
      a.segment_order - b.segment_order
  )[0];

  if (!firstSegment) {
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: "No segments",
        message: "Booking has no flight segments",
      },
      { status: 400 }
    );
  }

  const priceCents = booking.total_price_cents ?? 0;
  const currency = booking.currency ?? "USD";
  const totalPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(priceCents / 100);

  try {
    const { data: emailResult, error: emailError } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: user.email!,
      subject: `Booking Confirmed: ${firstSegment.departure_airport} → ${firstSegment.arrival_airport} (${booking.pnr})`,
      react: BookingConfirmationEmail({
        confirmationCode: booking.pnr ?? "N/A",
        passengerName,
        flight: {
          airline: firstSegment.airline_code,
          flightNumber: firstSegment.flight_number,
          departureAirport: firstSegment.departure_airport,
          arrivalAirport: firstSegment.arrival_airport,
          departureTime: firstSegment.departure_time,
          arrivalTime: firstSegment.arrival_time,
          cabin: firstSegment.cabin_class,
        },
        totalPrice,
        bookedAt: booking.booked_at ?? booking.created_at,
        bookingId: booking.id,
      }),
    });

    if (emailError) {
      console.error("[email] Resend error:", emailError);
      return NextResponse.json<ApiResponse>(
        {
          data: null,
          error: "email_failed",
          message: "Failed to send confirmation email",
        },
        { status: 500 }
      );
    }

    // Audit log (fire-and-forget)
    logAudit(supabase, {
      userId: user.id,
      action: "email.booking_confirmation_sent",
      resourceType: "booking",
      resourceId: bookingId,
      metadata: { emailId: emailResult?.id },
    });

    return NextResponse.json<ApiResponse<{ emailId: string | undefined }>>({
      data: { emailId: emailResult?.id },
      error: null,
      message: "Confirmation email sent",
    });
  } catch (err) {
    console.error("[email] Unexpected error:", err);
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: "email_failed",
        message: "Failed to send confirmation email",
      },
      { status: 500 }
    );
  }
}
