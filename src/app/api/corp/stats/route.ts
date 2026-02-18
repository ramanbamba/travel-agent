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
      return NextResponse.json(
        { data: null, error: "org_id required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    // Parallel queries for performance
    const [
      bookingsThisMonth,
      bookingsLastMonth,
      recentBookings,
      pendingApprovals,
      allBookings,
      members,
      gstInvoices,
    ] = await Promise.all([
      // Bookings this month
      db.from("corp_bookings")
        .select("id, total_amount, currency, status, policy_compliant")
        .eq("org_id", orgId)
        .gte("created_at", startOfMonth),

      // Bookings last month
      db.from("corp_bookings")
        .select("id, total_amount")
        .eq("org_id", orgId)
        .gte("created_at", startOfLastMonth)
        .lte("created_at", endOfLastMonth),

      // Recent bookings (last 10)
      db.from("corp_bookings")
        .select("id, pnr, status, origin, destination, departure_date, airline_name, airline_code, total_amount, currency, booking_channel, member_id, policy_compliant, approval_status, created_at")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(10),

      // Pending approvals
      db.from("approval_requests")
        .select("id, booking_id, requester_id, status, created_at, message")
        .eq("org_id", orgId)
        .eq("status", "pending"),

      // All bookings for compliance rate
      db.from("corp_bookings")
        .select("id, policy_compliant, booking_channel, origin, destination, total_amount, status")
        .eq("org_id", orgId),

      // Active members
      db.from("org_members")
        .select("id, full_name")
        .eq("org_id", orgId)
        .eq("status", "active"),

      // GST invoices
      db.from("gst_invoices")
        .select("id, total_gst, itc_eligible, total_amount")
        .eq("org_id", orgId),
    ]);

    // Compute KPIs
    const thisMonthBookings = bookingsThisMonth.data ?? [];
    const lastMonthBookings = bookingsLastMonth.data ?? [];
    const all = allBookings.data ?? [];

    const totalBookingsThisMonth = thisMonthBookings.length;
    const totalBookingsLastMonth = lastMonthBookings.length;
    const bookingsTrend = totalBookingsLastMonth > 0
      ? Math.round(((totalBookingsThisMonth - totalBookingsLastMonth) / totalBookingsLastMonth) * 100)
      : 0;

    const spendThisMonth = thisMonthBookings.reduce(
      (sum: number, b: DbRow) => sum + (b.total_amount ?? 0), 0
    );
    const spendLastMonth = lastMonthBookings.reduce(
      (sum: number, b: DbRow) => sum + (b.total_amount ?? 0), 0
    );
    const spendTrend = spendLastMonth > 0
      ? Math.round(((spendThisMonth - spendLastMonth) / spendLastMonth) * 100)
      : 0;

    const compliantBookings = all.filter((b: DbRow) => b.policy_compliant);
    const complianceRate = all.length > 0
      ? Math.round((compliantBookings.length / all.length) * 100)
      : 100;

    const gstData = gstInvoices.data ?? [];
    const itcRecovered = gstData
      .filter((g: DbRow) => g.itc_eligible)
      .reduce((sum: number, g: DbRow) => sum + (g.total_gst ?? 0), 0);

    // Bookings by channel
    const channelCounts: Record<string, number> = {};
    for (const b of all) {
      const ch = b.booking_channel ?? "web";
      channelCounts[ch] = (channelCounts[ch] ?? 0) + 1;
    }

    // Top routes
    const routeCounts: Record<string, { count: number; totalAmount: number }> = {};
    for (const b of all) {
      if (b.origin && b.destination) {
        const route = `${b.origin}-${b.destination}`;
        if (!routeCounts[route]) routeCounts[route] = { count: 0, totalAmount: 0 };
        routeCounts[route].count++;
        routeCounts[route].totalAmount += b.total_amount ?? 0;
      }
    }
    const topRoutes = Object.entries(routeCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([route, data]) => ({
        route,
        count: data.count,
        avgAmount: Math.round(data.totalAmount / data.count),
      }));

    // Monthly spend (last 6 months)
    const monthlySpend: { month: string; amount: number; bookings: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const monthBookings = all.filter((b: DbRow) => {
        const t = b.created_at ?? "";
        return t >= mStart && t <= mEnd;
      });
      monthlySpend.push({
        month: monthKey,
        amount: monthBookings.reduce((s: number, b: DbRow) => s + (b.total_amount ?? 0), 0),
        bookings: monthBookings.length,
      });
    }

    // Flagged bookings (out-of-policy)
    const flaggedBookings = (recentBookings.data ?? []).filter(
      (b: DbRow) => !b.policy_compliant && b.status !== "cancelled"
    );

    // Look up member names for recent bookings
    const memberMap: Record<string, string> = {};
    for (const m of (members.data ?? [])) {
      memberMap[m.id] = m.full_name ?? "Unknown";
    }

    const recent = (recentBookings.data ?? []).map((b: DbRow) => ({
      ...b,
      member_name: memberMap[b.member_id] ?? "Unknown",
    }));

    return NextResponse.json({
      data: {
        kpi: {
          totalBookingsThisMonth,
          bookingsTrend,
          spendThisMonth,
          spendTrend,
          complianceRate,
          itcRecovered,
          currency: "INR",
        },
        recentBookings: recent,
        pendingApprovals: pendingApprovals.data ?? [],
        flaggedBookings,
        channelCounts,
        topRoutes,
        monthlySpend,
        totalMembers: (members.data ?? []).length,
        totalBookings: all.length,
      },
      error: null,
    });
  } catch (error) {
    console.error("[Corp Stats] Error:", error);
    return NextResponse.json(
      { data: null, error: "Failed to load stats" },
      { status: 500 }
    );
  }
}
