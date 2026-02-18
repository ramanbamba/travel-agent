import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = any;
const db = supabase as DbRow;

export async function GET(req: NextRequest) {
  try {
    const orgId = req.nextUrl.searchParams.get("org_id");
    if (!orgId) {
      return NextResponse.json({ data: null, error: "org_id required" }, { status: 400 });
    }

    const { data: policy, error } = await db
      .from("travel_policies")
      .select("*")
      .eq("org_id", orgId)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows

    return NextResponse.json({ data: policy ?? null, error: null });
  } catch (error) {
    console.error("[Corp Policy GET] Error:", error);
    return NextResponse.json({ data: null, error: "Failed to load policy" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { org_id, flight_rules, spend_limits, approval_rules, booking_rules, policy_mode } = body;

    if (!org_id) {
      return NextResponse.json({ data: null, error: "org_id required" }, { status: 400 });
    }

    // Check if policy exists
    const { data: existing } = await db
      .from("travel_policies")
      .select("id")
      .eq("org_id", org_id)
      .eq("is_active", true)
      .limit(1)
      .single();

    const policyData = {
      org_id,
      flight_rules: flight_rules ?? {},
      spend_limits: spend_limits ?? {},
      approval_rules: approval_rules ?? {},
      booking_rules: booking_rules ?? {},
      policy_mode: policy_mode ?? "soft",
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      const { error } = await db
        .from("travel_policies")
        .update(policyData)
        .eq("id", existing.id);
      if (error) throw error;
      return NextResponse.json({ data: { id: existing.id }, error: null });
    } else {
      const { data: created, error } = await db
        .from("travel_policies")
        .insert(policyData)
        .select("id")
        .single();
      if (error) throw error;
      return NextResponse.json({ data: created, error: null });
    }
  } catch (error) {
    console.error("[Corp Policy PUT] Error:", error);
    return NextResponse.json({ data: null, error: "Failed to save policy" }, { status: 500 });
  }
}
