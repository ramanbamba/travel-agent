import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import type { ApiResponse } from "@/types";

export async function POST() {
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

  try {
    // Get or create Stripe customer
    let stripeCustomerId: string | null = null;

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("[setup-intent] Profile fetch error:", profileError.message);
    }

    stripeCustomerId = profile?.stripe_customer_id ?? null;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      stripeCustomerId = customer.id;

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", user.id);

      if (updateError) {
        console.error("[setup-intent] Profile update error:", updateError.message);
      }
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
    });

    return NextResponse.json<ApiResponse<{ clientSecret: string }>>({
      data: { clientSecret: setupIntent.client_secret! },
      error: null,
      message: "SetupIntent created",
    });
  } catch (err) {
    console.error("[setup-intent] Error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to create setup intent";
    return NextResponse.json<ApiResponse>(
      { data: null, error: message, message },
      { status: 500 }
    );
  }
}
