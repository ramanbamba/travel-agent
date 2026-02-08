import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse, BookingWithSegments } from "@/types";

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

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("*, flight_segments(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (bookingsError) {
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: bookingsError.message,
        message: "Failed to fetch bookings",
      },
      { status: 500 }
    );
  }

  // Sort segments within each booking by segment_order
  const sorted = (bookings as BookingWithSegments[]).map((b) => ({
    ...b,
    flight_segments: b.flight_segments.sort(
      (a, b) => a.segment_order - b.segment_order
    ),
  }));

  return NextResponse.json<ApiResponse<BookingWithSegments[]>>({
    data: sorted,
    error: null,
    message: "Bookings fetched successfully",
  });
}
