import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import type { ApiResponse, DbBooking } from "@/types";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
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

  const bookingId = params.id;

  // Fetch the booking and verify ownership
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !booking) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Not found", message: "Booking not found" },
      { status: 404 }
    );
  }

  const typedBooking = booking as DbBooking;

  if (typedBooking.status !== "confirmed" && typedBooking.status !== "pending") {
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: "Bad request",
        message: `Cannot cancel a booking with status "${typedBooking.status}"`,
      },
      { status: 400 }
    );
  }

  // If there's a Stripe payment, issue a refund
  let paymentStatus = typedBooking.payment_status;
  if (typedBooking.stripe_payment_intent_id) {
    try {
      await stripe.refunds.create({
        payment_intent: typedBooking.stripe_payment_intent_id,
      });
      paymentStatus = "refunded";
    } catch (err: unknown) {
      const stripeErr = err as { message?: string };
      return NextResponse.json<ApiResponse>(
        {
          data: null,
          error: "refund_failed",
          message: stripeErr.message ?? "Failed to process refund",
        },
        { status: 500 }
      );
    }
  }

  // Update booking status
  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      payment_status: paymentStatus,
    })
    .eq("id", bookingId)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: updateError.message,
        message: "Failed to cancel booking",
      },
      { status: 500 }
    );
  }

  return NextResponse.json<ApiResponse<DbBooking>>({
    data: updated as DbBooking,
    error: null,
    message: "Booking cancelled successfully",
  });
}
