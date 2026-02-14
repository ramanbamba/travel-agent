import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";

// ── Types ────────────────────────────────────────────────────────────────────

interface QuickAction {
  /** Label shown on the pill/button */
  label: string;
  /** The prompt sent to chat when tapped */
  prompt: string;
  /** Visual style hint */
  type: "usual" | "frequent" | "suggestion";
  /** Extra context for display */
  meta?: {
    airline?: string;
    flightNumber?: string;
    time?: string;
    price?: number;
    route?: string;
  };
}

interface ReturningUserData {
  isReturning: boolean;
  greeting: string;
  quickActions: QuickAction[];
}

// ── Day-of-week helpers ──────────────────────────────────────────────────────

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getNextDateForDay(dayOfWeek: number): string {
  const now = new Date();
  const today = now.getDay();
  let daysAhead = dayOfWeek - today;
  if (daysAhead <= 0) daysAhead += 7;
  const next = new Date(now);
  next.setDate(now.getDate() + daysAhead);
  return next.toISOString().split("T")[0];
}

function formatTime12h(timeStr: string): string {
  try {
    const d = new Date(timeStr);
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
  } catch {
    return timeStr;
  }
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Unauthorized", message: "You must be logged in" },
      { status: 401 }
    );
  }

  // Load profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("first_name")
    .eq("id", user.id)
    .single();

  const firstName = profile?.first_name ?? "there";

  // Load route familiarity (top 5 routes)
  const { data: routes } = await supabase
    .from("route_familiarity")
    .select("route, times_booked, familiarity_level, preferred_airline_name, preferred_flight_number, preferred_departure_window, avg_price_paid")
    .eq("user_id", user.id)
    .order("times_booked", { ascending: false })
    .limit(5);

  // Load booking patterns for day-of-week analysis
  const { data: patterns } = await supabase
    .from("booking_patterns")
    .select("route, airline_name, flight_number, departure_time, day_of_week, price_paid, cabin_class, seat_type")
    .eq("user_id", user.id)
    .eq("booking_completed", true)
    .order("created_at", { ascending: false })
    .limit(20);

  // Determine if returning user
  const totalBookings = patterns?.length ?? 0;
  const isReturning = totalBookings > 0;

  if (!isReturning || !routes || routes.length === 0) {
    // New user — return default suggestions
    return NextResponse.json<ApiResponse>({
      data: {
        isReturning: false,
        greeting: "",
        quickActions: [],
      } satisfies ReturningUserData,
      error: null,
      message: "New user",
    });
  }

  // ── Build quick actions ──────────────────────────────────────────────

  const quickActions: QuickAction[] = [];
  const now = new Date();
  const todayDOW = now.getDay();

  // 1. "The usual" for autopilot routes — match today's day of week
  for (const route of routes) {
    if (route.familiarity_level !== "autopilot") continue;

    // Find pattern matching today's day of week (or next occurrence)
    const routePatterns = patterns?.filter(
      (p) => p.route === route.route
    ) ?? [];

    // Find the most common day-of-week for this route
    const dowCounts = new Map<number, number>();
    for (const p of routePatterns) {
      dowCounts.set(p.day_of_week, (dowCounts.get(p.day_of_week) ?? 0) + 1);
    }

    // Get the top day of week
    let topDOW = -1;
    let topCount = 0;
    dowCounts.forEach((count, dow) => {
      if (count > topCount) {
        topDOW = dow;
        topCount = count;
      }
    });

    if (topDOW >= 0 && routePatterns.length > 0) {
      const lastPattern = routePatterns[0];
      const [origin, dest] = route.route.split("-");
      const dayName = DAY_NAMES[topDOW];
      const nextDate = getNextDateForDay(topDOW);
      const price = route.avg_price_paid ? Math.round(parseFloat(route.avg_price_paid)) : null;
      const timeStr = lastPattern.departure_time ? formatTime12h(lastPattern.departure_time) : null;

      // Only show if this day is today or within next 3 days (relevant)
      const daysUntil = ((topDOW - todayDOW) + 7) % 7;
      if (daysUntil <= 3) {
        const dayLabel = daysUntil === 0 ? "today" : daysUntil === 1 ? "tomorrow" : `this ${dayName}`;
        quickActions.push({
          label: `${dest} ${dayLabel}`,
          prompt: `the usual ${dest.toLowerCase() === "del" ? "Delhi" : dest.toLowerCase() === "bom" ? "Mumbai" : dest.toLowerCase() === "hyd" ? "Hyderabad" : dest} flight ${dayLabel}`,
          type: "usual",
          meta: {
            airline: lastPattern.airline_name ?? route.preferred_airline_name ?? undefined,
            flightNumber: lastPattern.flight_number ?? route.preferred_flight_number ?? undefined,
            time: timeStr ?? undefined,
            price: price ?? undefined,
            route: route.route,
          },
        });
      }
    }

    if (quickActions.length >= 2) break; // Max 2 "usual" actions
  }

  // 2. Frequent route suggestions (for learning/discovery routes not already added)
  const addedRoutes = new Set(quickActions.map((a) => a.meta?.route));
  for (const route of routes) {
    if (addedRoutes.has(route.route)) continue;
    if (quickActions.length >= 4) break;

    const [, dest] = route.route.split("-");
    const iataToCity: Record<string, string> = {
      DEL: "Delhi", BOM: "Mumbai", HYD: "Hyderabad", MAA: "Chennai",
      CCU: "Kolkata", BLR: "Bangalore", PNQ: "Pune", GOI: "Goa",
      AMD: "Ahmedabad", JAI: "Jaipur", LKO: "Lucknow", COK: "Kochi",
    };
    const cityName = iataToCity[dest] ?? dest;

    quickActions.push({
      label: cityName,
      prompt: `I need to fly to ${cityName}`,
      type: "frequent",
      meta: {
        route: route.route,
      },
    });
  }

  // ── Build pattern-aware greeting ────────────────────────────────────

  let greeting = "";

  // Check for autopilot "usual" suggestion
  const usualAction = quickActions.find((a) => a.type === "usual");
  if (usualAction?.meta) {
    const { airline, flightNumber, time, price } = usualAction.meta;
    const parts: string[] = [];
    if (airline && flightNumber) parts.push(`${airline} ${flightNumber}`);
    else if (airline) parts.push(airline);
    if (time) parts.push(time);
    if (price) parts.push(`₹${price.toLocaleString("en-IN")}`);

    greeting = parts.length > 0
      ? `Your usual ${usualAction.label} flight? ${parts.join(", ")}.`
      : `Your usual ${usualAction.label} flight?`;
  }

  return NextResponse.json<ApiResponse>({
    data: {
      isReturning: true,
      greeting,
      quickActions,
    } satisfies ReturningUserData,
    error: null,
    message: "Returning user data",
  });
}
