import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse, BookingSummary, FlightOption } from "@/types";

export async function POST(request: Request) {
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

  const body = await request.json();
  const flight = body.flight as FlightOption;

  if (!flight) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Bad request", message: "Flight data is required" },
      { status: 400 }
    );
  }

  // Fetch full profile + loyalty programs for the booking summary
  const [{ data: profile }, { data: loyaltyPrograms }] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("first_name, last_name, seat_preference, passport_vault_id")
      .eq("id", user.id)
      .single(),
    supabase
      .from("loyalty_programs")
      .select("airline_code, airline_name, program_name, member_number")
      .eq("user_id", user.id)
      .limit(1),
  ]);

  // Find a matching loyalty program for this flight's airline
  const segment = flight.segments[0];
  const matchingLoyalty = loyaltyPrograms?.find(
    (lp) => lp.airline_code === segment.airlineCode
  );
  const anyLoyalty = matchingLoyalty ?? loyaltyPrograms?.[0];

  const summary: BookingSummary = {
    id: `bk-${crypto.randomUUID().slice(0, 8)}`,
    flight,
    passenger: {
      firstName: profile?.first_name ?? "Traveler",
      lastName: profile?.last_name ?? "",
      email: user.email ?? "",
      seatPreference: profile?.seat_preference ?? "no_preference",
      loyaltyProgram: anyLoyalty
        ? `${anyLoyalty.airline_name} ${anyLoyalty.program_name}`
        : undefined,
      loyaltyNumber: anyLoyalty?.member_number,
      passportOnFile: !!profile?.passport_vault_id,
    },
    totalPrice: flight.price,
    status: "pending",
  };

  return NextResponse.json<ApiResponse<BookingSummary>>({
    data: summary,
    error: null,
    message: "Booking prepared",
  });
}
