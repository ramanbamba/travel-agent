import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";

export async function PUT(request: Request) {
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

  // Verify the payment method belongs to the user
  const { data: pm } = await supabase
    .from("payment_methods")
    .select("id")
    .eq("id", paymentMethodId)
    .eq("user_id", user.id)
    .single();

  if (!pm) {
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: "Not found",
        message: "Payment method not found",
      },
      { status: 404 }
    );
  }

  // Unset all defaults for this user
  await supabase
    .from("payment_methods")
    .update({ is_default: false })
    .eq("user_id", user.id);

  // Set the new default
  const { error } = await supabase
    .from("payment_methods")
    .update({ is_default: true })
    .eq("id", paymentMethodId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: error.message, message: "Update failed" },
      { status: 500 }
    );
  }

  return NextResponse.json<ApiResponse>({
    data: null,
    error: null,
    message: "Default payment method updated",
  });
}
