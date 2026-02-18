import { NextRequest, NextResponse } from "next/server";
import { requireCorpAuth } from "@/lib/corp/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = any;

export async function GET(req: NextRequest) {
  try {
    const auth = await requireCorpAuth({ roles: ["admin", "travel_manager", "approver"] });
    if (auth.error) return auth.error;

    const { member, db } = auth;
    const orgId = member.org_id;

    const p = req.nextUrl.searchParams;

    let query = db
      .from("corp_bookings")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    const status = p.get("status");
    if (status) query = query.eq("status", status);

    const memberId = p.get("member_id");
    if (memberId) query = query.eq("member_id", memberId);

    const compliant = p.get("policy_compliant");
    if (compliant === "true") query = query.eq("policy_compliant", true);
    if (compliant === "false") query = query.eq("policy_compliant", false);

    const dateFrom = p.get("date_from");
    if (dateFrom) query = query.gte("departure_date", dateFrom);

    const dateTo = p.get("date_to");
    if (dateTo) query = query.lte("departure_date", dateTo);

    const page = Number(p.get("page") ?? 0);
    const pageSize = Number(p.get("page_size") ?? 20);
    query = query.range(page * pageSize, (page + 1) * pageSize - 1);

    const { data: bookings, error, count } = await query;
    if (error) throw error;

    // Enrich with member names
    const memberIds = Array.from(new Set((bookings ?? []).map((b: DbRow) => b.member_id))) as string[];
    const { data: members } = await db
      .from("org_members")
      .select("id, full_name")
      .in("id", memberIds.length > 0 ? memberIds : ["__none__"]);

    const nameMap: Record<string, string> = {};
    for (const m of (members ?? [])) nameMap[m.id] = m.full_name ?? "Unknown";

    const enriched = (bookings ?? []).map((b: DbRow) => ({
      ...b,
      member_name: nameMap[b.member_id] ?? "Unknown",
    }));

    // Get approval history for these bookings
    const bookingIds = (bookings ?? []).map((b: DbRow) => b.id);
    const { data: approvals } = await db
      .from("approval_requests")
      .select("*")
      .in("booking_id", bookingIds.length > 0 ? bookingIds : ["__none__"]);

    const approvalMap: Record<string, DbRow[]> = {};
    for (const a of (approvals ?? [])) {
      if (!approvalMap[a.booking_id]) approvalMap[a.booking_id] = [];
      approvalMap[a.booking_id].push(a);
    }

    return NextResponse.json({
      data: {
        bookings: enriched,
        approvals: approvalMap,
        total: count ?? enriched.length,
        page,
        pageSize,
      },
      error: null,
    });
  } catch (error) {
    console.error("[Corp Bookings] Error:", error);
    return NextResponse.json({ data: null, error: "Failed to load bookings" }, { status: 500 });
  }
}
