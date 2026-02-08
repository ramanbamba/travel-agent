import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse, BookingConfirmation, BookingSummary } from "@/types";

function generateConfirmationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
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

  const confirmationCode = generateConfirmationCode();
  const segment = booking.flight.segments[0];
  const cabinClass = segment?.cabin ?? "economy";

  // Insert booking into database
  const { data: bookingRow, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      user_id: user.id,
      status: "confirmed",
      pnr: confirmationCode,
      total_price_cents: Math.round(booking.totalPrice.amount * 100),
      currency: booking.totalPrice.currency,
      cabin_class: cabinClass,
      data_source: "manual",
      booked_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (bookingError || !bookingRow) {
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
    // Mark booking as failed if segments couldn't be inserted
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

  const confirmation: BookingConfirmation = {
    bookingId: bookingRow.id,
    confirmationCode,
    flight: booking.flight,
    passenger: booking.passenger,
    totalPrice: booking.totalPrice,
    bookedAt: new Date().toISOString(),
  };

  return NextResponse.json<ApiResponse<BookingConfirmation>>({
    data: confirmation,
    error: null,
    message: "Booking confirmed",
  });
}
