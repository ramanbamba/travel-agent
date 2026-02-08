import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import type { ApiResponse, PaymentMethod } from "@/types";

export async function GET() {
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

  const { data: methods, error } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: error.message, message: "Failed to load" },
      { status: 500 }
    );
  }

  const result: PaymentMethod[] = (methods ?? []).map((m) => ({
    id: m.id,
    stripe_payment_method_id: m.stripe_payment_method_id,
    card_brand: m.card_brand,
    card_last_four: m.card_last_four,
    card_exp_month: m.card_exp_month,
    card_exp_year: m.card_exp_year,
    is_default: m.is_default,
    created_at: m.created_at,
  }));

  return NextResponse.json<ApiResponse<PaymentMethod[]>>({
    data: result,
    error: null,
    message: "Payment methods loaded",
  });
}

export async function DELETE(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Bad request", message: "id is required" },
      { status: 400 }
    );
  }

  // Get the payment method to find Stripe ID
  const { data: pm, error: fetchError } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !pm) {
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: "Not found",
        message: "Payment method not found",
      },
      { status: 404 }
    );
  }

  try {
    await stripe.paymentMethods.detach(pm.stripe_payment_method_id);
  } catch {
    // Stripe detach can fail if already detached — continue with DB cleanup
  }

  const { error: deleteError } = await supabase
    .from("payment_methods")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: deleteError.message, message: "Delete failed" },
      { status: 500 }
    );
  }

  // If deleted card was default, make the most recent remaining card default
  if (pm.is_default) {
    const { data: remaining } = await supabase
      .from("payment_methods")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (remaining) {
      await supabase
        .from("payment_methods")
        .update({ is_default: true })
        .eq("id", remaining.id);
    }
  }

  return NextResponse.json<ApiResponse>({
    data: null,
    error: null,
    message: "Payment method deleted",
  });
}
