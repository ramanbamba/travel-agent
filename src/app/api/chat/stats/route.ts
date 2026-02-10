import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";

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

  // Count confirmed bookings
  const { count: totalBookings } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "confirmed");

  // Count routes with familiarity data
  const { count: routesLearned } = await supabase
    .from("route_familiarity")
    .select("route", { count: "exact", head: true })
    .eq("user_id", user.id);

  return NextResponse.json<ApiResponse>({
    data: {
      totalBookings: totalBookings ?? 0,
      routesLearned: routesLearned ?? 0,
    },
    error: null,
    message: "Stats fetched",
  });
}
