import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = any;

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const db = supabase as DbRow;

    const { data: member } = await db
      .from("org_members")
      .select("id, org_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .single();

    if (!member) {
      return NextResponse.json({ data: { preferences: null, learned: null }, error: null });
    }

    // Load saved preferences
    const { data: prefs } = await db
      .from("traveler_preferences")
      .select("*")
      .eq("member_id", member.id)
      .limit(1)
      .single();

    // Load learned insights from bookings
    const { data: bookings } = await db
      .from("corp_bookings")
      .select("origin, destination, airline_code, airline_name, departure_date, created_at")
      .eq("member_id", member.id)
      .not("status", "eq", "cancelled");

    let learned: DbRow = null;
    if (bookings && bookings.length > 0) {
      // Top route
      const routeCounts: Record<string, number> = {};
      for (const b of bookings) {
        if (b.origin && b.destination) {
          const route = `${b.origin}→${b.destination}`;
          routeCounts[route] = (routeCounts[route] ?? 0) + 1;
        }
      }
      const topRouteEntry = Object.entries(routeCounts).sort((a, b) => b[1] - a[1])[0];

      // Top airline
      const airlineCounts: Record<string, { name: string; count: number }> = {};
      for (const b of bookings) {
        const code = b.airline_code;
        if (code) {
          if (!airlineCounts[code]) airlineCounts[code] = { name: b.airline_name ?? code, count: 0 };
          airlineCounts[code].count++;
        }
      }
      const topAirlineEntry = Object.entries(airlineCounts).sort((a, b) => b[1].count - a[1].count)[0];

      // Avg advance days
      const advanceDays: number[] = [];
      for (const b of bookings) {
        if (b.departure_date && b.created_at) {
          const dep = new Date(b.departure_date).getTime();
          const created = new Date(b.created_at).getTime();
          const days = Math.floor((dep - created) / (1000 * 60 * 60 * 24));
          if (days >= 0 && days < 365) advanceDays.push(days);
        }
      }

      learned = {
        totalBookings: bookings.length,
        topRoute: topRouteEntry
          ? { route: topRouteEntry[0], count: topRouteEntry[1] }
          : null,
        topAirline: topAirlineEntry
          ? { code: topAirlineEntry[0], name: topAirlineEntry[1].name, count: topAirlineEntry[1].count }
          : null,
        avgAdvanceDays: advanceDays.length > 0
          ? Math.round(advanceDays.reduce((a, b) => a + b, 0) / advanceDays.length)
          : null,
      };
    }

    return NextResponse.json({
      data: {
        preferences: prefs ?? null,
        learned,
      },
      error: null,
    });
  } catch (error) {
    console.error("[Employee Preferences GET] Error:", error);
    return NextResponse.json({ data: null, error: "Failed to load" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const db = supabase as DbRow;
    const body = await req.json();

    const { data: member } = await db
      .from("org_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .single();

    if (!member) {
      return NextResponse.json({ data: null, error: "No membership" }, { status: 400 });
    }

    // Upsert preferences
    const { data: existing } = await db
      .from("traveler_preferences")
      .select("id")
      .eq("member_id", member.id)
      .limit(1)
      .single();

    const prefData = {
      member_id: member.id,
      preferred_airlines: body.preferred_airlines ?? [],
      departure_window: body.departure_window ?? "morning",
      seat_preference: body.seat_preference ?? "no_preference",
      meal_preference: body.meal_preference ?? "no_preference",
      bag_preference: body.bag_preference ?? "cabin_only",
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await db.from("traveler_preferences").update(prefData).eq("id", existing.id);
    } else {
      await db.from("traveler_preferences").insert(prefData);
    }

    return NextResponse.json({ data: { success: true }, error: null });
  } catch (error) {
    console.error("[Employee Preferences PUT] Error:", error);
    return NextResponse.json({ data: null, error: "Failed to save" }, { status: 500 });
  }
}
