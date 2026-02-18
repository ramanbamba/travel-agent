import { NextRequest, NextResponse } from "next/server";
import { requireCorpAuth } from "@/lib/corp/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = any;

export async function GET() {
  try {
    const auth = await requireCorpAuth({ roles: ["admin", "travel_manager", "approver"] });
    if (auth.error) return auth.error;

    const { member, db } = auth;
    const orgId = member.org_id;

    const { data: members, error } = await db
      .from("org_members")
      .select("id, user_id, full_name, email, phone, department, role, seniority_level, status, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Get booking counts per member
    const memberIds = (members ?? []).map((m: DbRow) => m.id);
    const { data: bookings } = await db
      .from("corp_bookings")
      .select("member_id")
      .eq("org_id", orgId)
      .in("member_id", memberIds.length > 0 ? memberIds : ["__none__"]);

    const bookingCounts: Record<string, number> = {};
    for (const b of (bookings ?? [])) {
      bookingCounts[b.member_id] = (bookingCounts[b.member_id] ?? 0) + 1;
    }

    const enriched = (members ?? []).map((m: DbRow) => ({
      ...m,
      bookings_count: bookingCounts[m.id] ?? 0,
    }));

    return NextResponse.json({ data: enriched, error: null });
  } catch (error) {
    console.error("[Corp Members GET] Error:", error);
    return NextResponse.json({ data: null, error: "Failed to load members" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireCorpAuth({ roles: ["admin", "travel_manager"] });
    if (auth.error) return auth.error;

    const { member, db } = auth;
    const orgId = member.org_id;

    const body = await req.json();
    const { full_name, email, phone, department, role, seniority_level } = body;

    if (!full_name || !email) {
      return NextResponse.json({ data: null, error: "Missing required fields" }, { status: 400 });
    }

    // Check duplicate email in org
    const { data: existing } = await db
      .from("org_members")
      .select("id")
      .eq("org_id", orgId)
      .eq("email", email)
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json({ data: null, error: "Employee with this email already exists" }, { status: 409 });
    }

    const { data: newMember, error } = await db
      .from("org_members")
      .insert({
        org_id: orgId,
        full_name,
        email,
        phone: phone || null,
        department: department || null,
        role: role || "employee",
        seniority_level: seniority_level || "individual_contributor",
        status: "invited",
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ data: newMember, error: null });
  } catch (error) {
    console.error("[Corp Members POST] Error:", error);
    return NextResponse.json({ data: null, error: "Failed to add member" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireCorpAuth({ roles: ["admin", "travel_manager"] });
    if (auth.error) return auth.error;

    const { member, db } = auth;
    const orgId = member.org_id;

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ data: null, error: "Member ID required" }, { status: 400 });
    }

    // Verify the member belongs to the same org
    const { data: target } = await db
      .from("org_members")
      .select("id, org_id")
      .eq("id", id)
      .single();

    if (!target || target.org_id !== orgId) {
      return NextResponse.json({ data: null, error: "Member not found" }, { status: 404 });
    }

    // Only allow safe fields
    const allowed = ["full_name", "phone", "department", "role", "seniority_level", "status", "reports_to"];
    const safeUpdates: Record<string, DbRow> = {};
    for (const key of allowed) {
      if (key in updates) safeUpdates[key] = updates[key];
    }
    safeUpdates.updated_at = new Date().toISOString();

    const { error } = await db
      .from("org_members")
      .update(safeUpdates)
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ data: { id }, error: null });
  } catch (error) {
    console.error("[Corp Members PATCH] Error:", error);
    return NextResponse.json({ data: null, error: "Failed to update member" }, { status: 500 });
  }
}
