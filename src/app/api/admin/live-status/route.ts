import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLiveModeStatus } from "@/lib/config/app-mode";
import type { ApiResponse } from "@/types";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Unauthorized", message: "Not logged in" },
      { status: 401 }
    );
  }

  if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(user.email ?? "")) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Forbidden", message: "Not authorized" },
      { status: 403 }
    );
  }

  const status = getLiveModeStatus();

  // Check for critical missing configs in live mode
  const warnings: string[] = [];
  if (status.mode === "live") {
    if (!status.duffelConfigured) warnings.push("DUFFEL_LIVE_TOKEN is not set");
    if (!status.razorpayConfigured) warnings.push("Razorpay live keys are not configured");
    if (!status.stripeConfigured) warnings.push("STRIPE_SECRET_KEY is not set");
  }

  return NextResponse.json<ApiResponse>({
    data: {
      ...status,
      warnings,
      ready: status.mode === "live" && warnings.length === 0,
    },
    error: null,
    message: "Live mode status",
  });
}
