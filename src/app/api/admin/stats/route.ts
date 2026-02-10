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

  // Fetch stats in parallel
  const [
    recentBookingsRes,
    todayCountRes,
    weekCountRes,
    monthCountRes,
    revenueRes,
    incidentsRes,
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
    },
    error: null,
    message: "Admin stats loaded",
  });
}
