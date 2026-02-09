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
    .select("*, flight_segments(*), payment_methods(card_brand, card_last_four)")
    .eq("user_id", user.id);

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

  const now = new Date();

  // Sort segments within each booking by segment_order
  const withSortedSegments = (bookings as BookingWithSegments[]).map((b) => ({
    ...b,
    flight_segments: b.flight_segments.sort(
      (a, b) => a.segment_order - b.segment_order
    ),
  }));

  // Smart sort: upcoming flights first (by departure asc), then past flights (most recent first)
  const sorted = withSortedSegments.sort((a, b) => {
    const aDepart = a.flight_segments[0]
      ? new Date(a.flight_segments[0].departure_time)
      : new Date(0);
    const bDepart = b.flight_segments[0]
      ? new Date(b.flight_segments[0].departure_time)
      : new Date(0);
    const aUpcoming = aDepart >= now;
    const bUpcoming = bDepart >= now;

    if (aUpcoming && !bUpcoming) return -1;
    if (!aUpcoming && bUpcoming) return 1;
    if (aUpcoming && bUpcoming) return aDepart.getTime() - bDepart.getTime();
    return bDepart.getTime() - aDepart.getTime();
  });

  return NextResponse.json<ApiResponse<BookingWithSegments[]>>({
    data: sorted,
    error: null,
    message: "Bookings fetched successfully",
  });
}
