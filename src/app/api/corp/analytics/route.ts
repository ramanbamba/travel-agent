import { NextResponse } from "next/server";
import { requireCorpAuth } from "@/lib/corp/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = any;

export async function GET() {
  try {
    const auth = await requireCorpAuth({ roles: ["admin", "travel_manager", "approver"] });
    if (auth.error) return auth.error;

    const { member, db } = auth;
    const orgId = member.org_id;

    const [bookingsResult, membersResult, gstResult] = await Promise.all([
      db.from("corp_bookings")
        .select("id, member_id, origin, destination, total_amount, currency, status, booking_channel, policy_compliant, departure_date, department, created_at")
        .eq("org_id", orgId),
      db.from("org_members")
        .select("id, full_name, department")
        .eq("org_id", orgId)
        .eq("status", "active"),
      db.from("gst_invoices")
        .select("total_gst, itc_eligible, created_at")
        .eq("org_id", orgId),
    ]);

    const bookings: DbRow[] = bookingsResult.data ?? [];
    const members: DbRow[] = membersResult.data ?? [];
    const gstInvoices: DbRow[] = gstResult.data ?? [];

    const nameMap: Record<string, string> = {};
    const deptMap: Record<string, string> = {};
    for (const m of members) {
      nameMap[m.id] = m.full_name ?? "Unknown";
      deptMap[m.id] = m.department ?? "Unassigned";
    }

    const now = new Date();

    // Monthly spend (last 12 months)
    const monthlySpend: { month: string; amount: number; bookings: number; compliant: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const mb = bookings.filter((b: DbRow) => (b.created_at ?? "") >= mStart && (b.created_at ?? "") <= mEnd);
      monthlySpend.push({
        month: monthKey,
        amount: mb.reduce((s: number, b: DbRow) => s + (b.total_amount ?? 0), 0),
        bookings: mb.length,
        compliant: mb.filter((b: DbRow) => b.policy_compliant).length,
      });
    }

    // Spend by department
    const deptSpend: Record<string, number> = {};
    for (const b of bookings) {
      const dept = deptMap[b.member_id] ?? "Unassigned";
      deptSpend[dept] = (deptSpend[dept] ?? 0) + (b.total_amount ?? 0);
    }
    const spendByDepartment = Object.entries(deptSpend)
      .map(([dept, amount]) => ({ department: dept, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Top routes
    const routeCounts: Record<string, { count: number; totalAmount: number }> = {};
    for (const b of bookings) {
      if (b.origin && b.destination) {
        const route = `${b.origin}-${b.destination}`;
        if (!routeCounts[route]) routeCounts[route] = { count: 0, totalAmount: 0 };
        routeCounts[route].count++;
        routeCounts[route].totalAmount += b.total_amount ?? 0;
      }
    }
    const topRoutes = Object.entries(routeCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([route, data]) => ({ route, count: data.count, avgAmount: Math.round(data.totalAmount / data.count) }));

    // Top travelers
    const travelerStats: Record<string, { count: number; totalAmount: number }> = {};
    for (const b of bookings) {
      if (!travelerStats[b.member_id]) travelerStats[b.member_id] = { count: 0, totalAmount: 0 };
      travelerStats[b.member_id].count++;
      travelerStats[b.member_id].totalAmount += b.total_amount ?? 0;
    }
    const topTravelers = Object.entries(travelerStats)
      .sort((a, b) => b[1].totalAmount - a[1].totalAmount)
      .slice(0, 10)
      .map(([id, data]) => ({
        name: nameMap[id] ?? "Unknown",
        department: deptMap[id] ?? "—",
        bookings: data.count,
        totalSpend: data.totalAmount,
      }));

    // Channel distribution
    const channelCounts: Record<string, number> = {};
    for (const b of bookings) {
      const ch = b.booking_channel ?? "web";
      channelCounts[ch] = (channelCounts[ch] ?? 0) + 1;
    }

    // Policy compliance trend (monthly)
    const complianceTrend = monthlySpend.map((ms) => ({
      month: ms.month,
      rate: ms.bookings > 0 ? Math.round((ms.compliant / ms.bookings) * 100) : 100,
    }));

    // Average advance booking days
    const advanceDays: number[] = [];
    for (const b of bookings) {
      if (b.departure_date && b.created_at) {
        const dep = new Date(b.departure_date).getTime();
        const created = new Date(b.created_at).getTime();
        const days = Math.floor((dep - created) / (1000 * 60 * 60 * 24));
        if (days >= 0 && days < 365) advanceDays.push(days);
      }
    }
    const avgAdvanceDays = advanceDays.length > 0
      ? Math.round(advanceDays.reduce((a, b) => a + b, 0) / advanceDays.length)
      : 0;

    // GST recovery rate
    const totalGst = gstInvoices.reduce((s: number, i: DbRow) => s + (i.total_gst ?? 0), 0);
    const itcEligible = gstInvoices
      .filter((i: DbRow) => i.itc_eligible)
      .reduce((s: number, i: DbRow) => s + (i.total_gst ?? 0), 0);
    const gstRecoveryRate = totalGst > 0 ? Math.round((itcEligible / totalGst) * 100) : 0;

    return NextResponse.json({
      data: {
        monthlySpend,
        spendByDepartment,
        topRoutes,
        topTravelers,
        channelCounts,
        complianceTrend,
        avgAdvanceDays,
        gstRecoveryRate,
        totalBookings: bookings.length,
        totalSpend: bookings.reduce((s: number, b: DbRow) => s + (b.total_amount ?? 0), 0),
      },
      error: null,
    });
  } catch (error) {
    console.error("[Corp Analytics] Error:", error);
    return NextResponse.json({ data: null, error: "Failed to load analytics" }, { status: 500 });
  }
}
