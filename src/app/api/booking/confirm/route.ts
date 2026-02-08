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

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const confirmation: BookingConfirmation = {
    bookingId: booking.id,
    confirmationCode: generateConfirmationCode(),
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
