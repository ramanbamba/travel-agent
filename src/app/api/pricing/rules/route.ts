import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";
import type { PricingRule } from "@/lib/pricing/pricing-engine";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || !isAdmin(user.email)) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Forbidden", message: "Admin access required" },
      { status: 403 }
    );
  }

  const { data: rules, error } = await supabase
    .from("pricing_rules")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: error.message, message: "Failed to fetch pricing rules" },
      { status: 500 }
    );
  }

  return NextResponse.json<ApiResponse<PricingRule | null>>({
    data: rules?.[0] ?? null,
    error: null,
    message: "Pricing rule fetched",
  });
}

export async function PUT(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || !isAdmin(user.email)) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Forbidden", message: "Admin access required" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const {
    id,
    markup_type,
    markup_value,
    markup_cap,
    service_fee_type,
    service_fee_value,
    min_total_fee,
  } = body;

  if (!id) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Bad request", message: "Rule ID is required" },
      { status: 400 }
    );
  }

  const { data: updated, error } = await supabase
    .from("pricing_rules")
    .update({
      markup_type,
      markup_value: Number(markup_value),
      markup_cap: markup_cap !== null && markup_cap !== "" ? Number(markup_cap) : null,
      service_fee_type,
      service_fee_value: Number(service_fee_value),
      min_total_fee: Number(min_total_fee),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: error.message, message: "Failed to update pricing rule" },
      { status: 500 }
    );
  }

  return NextResponse.json<ApiResponse<PricingRule>>({
    data: updated,
    error: null,
    message: "Pricing rule updated",
  });
}
