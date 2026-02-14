import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

const DEMO_EMAILS = [
  "demo-new@skyswift.app",
  "demo-learning@skyswift.app",
  process.env.DEMO_USER_EMAIL ?? "demo@skyswift.app",
];

interface DemoUserInfo {
  id: string;
  email: string;
  name: string;
  tier: "cold_start" | "learning" | "autopilot";
  tierLabel: string;
  bookingCount: number;
  routes: Array<{
    route: string;
    timesBooked: number;
    familiarityLevel: string;
    preferredAirline: string | null;
    avgPrice: number | null;
  }>;
  demoPrompts: string[];
}

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

  // Use service role to read other users' data
  const { createClient: createServiceClient } = await import("@supabase/supabase-js");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Config error", message: "Service role key not configured" },
      { status: 500 }
    );
  }

  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const demoUsers: DemoUserInfo[] = [];

  for (const email of DEMO_EMAILS) {
    // Find user by email
    const { data: usersData } = await adminClient.auth.admin.listUsers();
    const demoUser = usersData?.users?.find((u) => u.email === email);
    if (!demoUser) continue;

    const uid = demoUser.id;

    // Load profile
    const { data: profile } = await adminClient
      .from("user_profiles")
      .select("first_name, last_name")
      .eq("id", uid)
      .single();

    // Load route familiarity
    const { data: routes } = await adminClient
      .from("route_familiarity")
      .select("route, times_booked, familiarity_level, preferred_airline_name, avg_price_paid")
      .eq("user_id", uid)
      .order("times_booked", { ascending: false });

    // Count bookings
    const { count: bookingCount } = await adminClient
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid)
      .eq("status", "confirmed");

    // Determine tier
    const totalBooked = routes?.reduce((sum, r) => sum + (r.times_booked ?? 0), 0) ?? 0;
    const tier: "cold_start" | "learning" | "autopilot" =
      totalBooked === 0 ? "cold_start" : totalBooked < 6 ? "learning" : "autopilot";

    const tierLabels = {
      cold_start: "Cold Start",
      learning: "Learning Mode",
      autopilot: "Autopilot Mode",
    };

    // Demo prompts based on tier
    const demoPrompts: string[] = [];
    if (tier === "cold_start") {
      demoPrompts.push(
        "Mumbai next Friday",
        "Goa this weekend, cheapest",
        "I need to fly to Bangalore tomorrow"
      );
    } else if (tier === "learning") {
      demoPrompts.push(
        "Delhi next Monday",
        "I need to be at CP by 10 AM next week",
        "anything cheaper?"
      );
    } else {
      demoPrompts.push(
        "the usual",
        "Delhi again Thursday",
        "need to be at CP by 10 AM",
        "Mumbai tomorrow, same day return"
      );
    }

    demoUsers.push({
      id: uid,
      email,
      name: profile ? `${profile.first_name} ${profile.last_name}` : email,
      tier,
      tierLabel: tierLabels[tier],
      bookingCount: bookingCount ?? 0,
      routes: (routes ?? []).map((r) => ({
        route: r.route,
        timesBooked: r.times_booked ?? 0,
        familiarityLevel: r.familiarity_level ?? "discovery",
        preferredAirline: r.preferred_airline_name,
        avgPrice: r.avg_price_paid ? parseFloat(r.avg_price_paid) : null,
      })),
      demoPrompts,
    });
  }

  return NextResponse.json<ApiResponse>({
    data: { users: demoUsers, currentUserEmail: user.email },
    error: null,
    message: "Demo users loaded",
  });
}
