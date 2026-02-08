import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import type { ApiResponse, PaymentMethod } from "@/types";

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
  const { paymentMethodId } = body as { paymentMethodId: string };

  if (!paymentMethodId) {
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: "Bad request",
        message: "paymentMethodId is required",
      },
      { status: 400 }
    );
  }

  try {
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);

    if (!pm.card) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: "Invalid payment method", message: "Not a card" },
        { status: 400 }
      );
    }

    // Check if user has any existing payment methods
    const { count } = await supabase
      .from("payment_methods")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    const isFirst = (count ?? 0) === 0;

    const { data: saved, error: insertError } = await supabase
      .from("payment_methods")
      .insert({
        user_id: user.id,
        stripe_payment_method_id: paymentMethodId,
        card_brand: pm.card.brand,
        card_last_four: pm.card.last4,
        card_exp_month: pm.card.exp_month,
        card_exp_year: pm.card.exp_year,
        is_default: isFirst,
      })
      .select()
      .single();

    if (insertError || !saved) {
      return NextResponse.json<ApiResponse>(
        {
          data: null,
          error: insertError?.message ?? "Failed to save",
          message: "Could not save payment method",
        },
        { status: 500 }
      );
    }

    const result: PaymentMethod = {
      id: saved.id,
      stripe_payment_method_id: saved.stripe_payment_method_id,
      card_brand: saved.card_brand,
      card_last_four: saved.card_last_four,
      card_exp_month: saved.card_exp_month,
      card_exp_year: saved.card_exp_year,
      is_default: saved.is_default,
      created_at: saved.created_at,
    };

    return NextResponse.json<ApiResponse<PaymentMethod>>({
      data: result,
      error: null,
      message: "Payment method saved",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to confirm setup";
    return NextResponse.json<ApiResponse>(
      { data: null, error: message, message: "Confirm setup failed" },
      { status: 500 }
    );
  }
}
