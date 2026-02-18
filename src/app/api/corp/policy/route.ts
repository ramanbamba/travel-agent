import { NextRequest, NextResponse } from "next/server";
import { requireCorpAuth } from "@/lib/corp/auth";

export async function GET() {
  try {
    const auth = await requireCorpAuth({ roles: ["admin", "travel_manager", "approver"] });
    if (auth.error) return auth.error;

    const { member, db } = auth;

    const { data: policy, error } = await db
      .from("travel_policies")
      .select("*")
      .eq("org_id", member.org_id)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    return NextResponse.json({ data: policy ?? null, error: null });
  } catch (error) {
    console.error("[Corp Policy GET] Error:", error);
    return NextResponse.json({ data: null, error: "Failed to load policy" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireCorpAuth({ roles: ["admin", "travel_manager"] });
    if (auth.error) return auth.error;

    const { member, db } = auth;
    const orgId = member.org_id;

    const body = await req.json();
    const { flight_rules, spend_limits, approval_rules, booking_rules, policy_mode } = body;

    // Check if policy exists
    const { data: existing } = await db
      .from("travel_policies")
      .select("id")
      .eq("org_id", orgId)
      .eq("is_active", true)
      .limit(1)
      .single();

    const policyData = {
      org_id: orgId,
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
