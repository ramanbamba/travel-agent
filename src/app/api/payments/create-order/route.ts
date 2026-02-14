import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOrder } from "@/lib/payments/razorpay";
import { getPublicRazorpayKeyId } from "@/lib/config/app-mode";
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

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Bad request", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { amount, currency, bookingReference } = body;

  if (!amount || !currency) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Bad request", message: "amount and currency are required" },
      { status: 400 }
    );
  }

  // Amount comes in as rupees; convert to paise (smallest unit)
  const amountPaise = Math.round(amount * 100);

  try {
    const order = await createOrder(amountPaise, currency, bookingReference ?? `booking-${Date.now()}`);

    return NextResponse.json<ApiResponse<{
      orderId: string;
      amount: number;
      currency: string;
      keyId: string;
    }>>({
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: getPublicRazorpayKeyId(),
      },
      error: null,
      message: "Order created",
    });
  } catch (err) {
    console.error("[razorpay] Failed to create order:", err);
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: "payment_error",
        message: "Failed to create payment order. Please try again.",
      },
      { status: 500 }
    );
  }
}
