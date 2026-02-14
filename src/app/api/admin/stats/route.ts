import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Fetch all stats in parallel
  const [
    recentBookingsRes,
    todayCountRes,
    weekCountRes,
    monthCountRes,
    revenueRes,
    incidentsRes,
    // P3-12 additions
    topRoutesRes,
    feedbackAcceptedRes,
    feedbackTotalRes,
    totalSessionsRes,
    searchSessionsRes,
    selectionSessionsRes,
    confirmedBookingsRes,
    activeUsersRes,
    failedIntentsRes,
    avgMessagesRes,
  ] = await Promise.all([
    // Recent 20 bookings
    supabase
      .from("bookings")
      .select("id, pnr, status, total_price_cents, currency, cabin_class, data_source, booked_at, supplier_name, our_revenue_cents, flight_segments(departure_airport, arrival_airport, airline_code, flight_number)")
      .order("booked_at", { ascending: false })
      .limit(20),
    // Today count
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .gte("booked_at", todayStart),
    // Week count
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .gte("booked_at", weekStart),
    // Month count
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .gte("booked_at", monthStart),
    // Total revenue
    supabase
      .from("bookings")
      .select("total_price_cents, our_revenue_cents, currency")
      .eq("status", "confirmed"),
    // Recent incidents
    supabase
      .from("booking_incidents")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10),

    // ── P3-12: Top Routes ──
    supabase
      .from("route_familiarity")
      .select("route, times_booked, familiarity_level, preferred_airline_name, avg_price_paid")
      .order("times_booked", { ascending: false })
      .limit(10),

    // ── P3-12: Preference Accuracy ──
    supabase
      .from("booking_feedback")
      .select("id", { count: "exact", head: true })
      .eq("signal_type", "accepted_recommendation"),
    supabase
      .from("booking_feedback")
      .select("id", { count: "exact", head: true }),

    // ── P3-12: Conversion Funnel ──
    // Total chat sessions
    supabase
      .from("conversation_sessions")
      .select("id", { count: "exact", head: true }),
    // Sessions that reached searching state
    supabase
      .from("conversation_sessions")
      .select("id", { count: "exact", head: true })
      .gte("messages_in_session", 1),
    // Sessions that reached selection
    supabase
      .from("conversation_sessions")
      .select("id", { count: "exact", head: true })
      .in("state", ["awaiting_selection", "confirming_booking", "processing_payment", "post_booking"]),
    // Confirmed bookings (for funnel bottom)
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "confirmed"),

    // ── P3-12: Active Users ──
    supabase
      .from("user_profiles")
      .select("id", { count: "exact", head: true })
      .eq("onboarding_completed", true),

    // ── P3-12: Failed Intents ──
    supabase
      .from("failed_intents")
      .select("failure_reason")
      .order("created_at", { ascending: false })
      .limit(100),

    // ── P3-12: Avg Messages per Session ──
    supabase
      .from("conversation_sessions")
      .select("messages_in_session")
      .gt("messages_in_session", 0)
      .limit(200),
  ]);

  // Calculate revenue stats
  const allBookings = revenueRes.data ?? [];
  const totalBookings = allBookings.length;
  const totalRevenueCents = allBookings.reduce(
    (sum, b) => sum + (b.total_price_cents ?? 0),
    0
  );
  const totalOurRevenueCents = allBookings.reduce(
    (sum, b) => sum + (b.our_revenue_cents ?? 0),
    0
  );
  const avgBookingCents = totalBookings > 0 ? Math.round(totalRevenueCents / totalBookings) : 0;

  // Top routes aggregation (group by route across users)
  const routeMap = new Map<string, { route: string; totalBooked: number; level: string; airline: string | null; avgPrice: number | null }>();
  for (const r of topRoutesRes.data ?? []) {
    const existing = routeMap.get(r.route);
    if (existing) {
      existing.totalBooked += r.times_booked ?? 0;
    } else {
      routeMap.set(r.route, {
        route: r.route,
        totalBooked: r.times_booked ?? 0,
        level: r.familiarity_level ?? "discovery",
        airline: r.preferred_airline_name,
        avgPrice: r.avg_price_paid ? parseFloat(r.avg_price_paid) : null,
      });
    }
  }
  const topRoutes = Array.from(routeMap.values())
    .sort((a, b) => b.totalBooked - a.totalBooked)
    .slice(0, 8);

  // Preference accuracy
  const acceptedCount = feedbackAcceptedRes.count ?? 0;
  const totalFeedback = feedbackTotalRes.count ?? 0;
  const preferenceAccuracy = totalFeedback > 0 ? Math.round((acceptedCount / totalFeedback) * 100) : null;

  // Conversion funnel
  const funnel = {
    sessions: totalSessionsRes.count ?? 0,
    searches: searchSessionsRes.count ?? 0,
    selections: selectionSessionsRes.count ?? 0,
    bookings: confirmedBookingsRes.count ?? 0,
  };

  // Avg messages per booking session
  const sessionMessages = (avgMessagesRes.data ?? []).map((s) => s.messages_in_session as number);
  const avgMessagesPerSession = sessionMessages.length > 0
    ? Math.round((sessionMessages.reduce((a, b) => a + b, 0) / sessionMessages.length) * 10) / 10
    : 0;

  // Failed intents breakdown
  const failedCounts: Record<string, number> = {};
  for (const fi of failedIntentsRes.data ?? []) {
    const reason = fi.failure_reason ?? "unknown";
    failedCounts[reason] = (failedCounts[reason] ?? 0) + 1;
  }

  return NextResponse.json<ApiResponse>({
    data: {
      recentBookings: recentBookingsRes.data ?? [],
      todayCount: todayCountRes.count ?? 0,
      weekCount: weekCountRes.count ?? 0,
      monthCount: monthCountRes.count ?? 0,
      totalBookings,
      totalRevenueCents,
      totalOurRevenueCents,
      avgBookingCents,
      currency: allBookings[0]?.currency ?? "INR",
      incidents: incidentsRes.data ?? [],
      // P3-12 additions
      topRoutes,
      preferenceAccuracy,
      totalFeedback,
      funnel,
      avgMessagesPerSession,
      activeUsers: activeUsersRes.count ?? 0,
      failedIntents: failedCounts,
      totalFailedIntents: (failedIntentsRes.data ?? []).length,
    },
    error: null,
    message: "Admin stats loaded",
  });
}
