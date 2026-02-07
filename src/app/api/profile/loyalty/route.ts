import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse, LoyaltyProgram } from "@/types";

export async function PUT(request: Request) {
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

  const { loyalty_programs } = await request.json();

  if (!Array.isArray(loyalty_programs)) {
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: "Invalid input",
        message: "loyalty_programs must be an array",
      },
      { status: 400 }
    );
  }

  // Delete-then-insert strategy: simpler than diffing, handles removals cleanly
  const { error: deleteError } = await supabase
    .from("loyalty_programs")
    .delete()
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: deleteError.message,
        message: "Failed to update loyalty programs",
      },
      { status: 500 }
    );
  }

  if (loyalty_programs.length === 0) {
    return NextResponse.json<ApiResponse<LoyaltyProgram[]>>({
      data: [],
      error: null,
      message: "Loyalty programs updated successfully",
    });
  }

  const rows = loyalty_programs.map(
    (lp: {
      airline_code: string;
      airline_name: string;
      program_name: string;
      member_number: string;
      tier?: string;
    }) => ({
      user_id: user.id,
      airline_code: lp.airline_code,
      airline_name: lp.airline_name,
      program_name: lp.program_name,
      member_number: lp.member_number,
      tier: lp.tier || null,
    })
  );

  const { data, error: insertError } = await supabase
    .from("loyalty_programs")
    .insert(rows)
    .select();

  if (insertError) {
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: insertError.message,
        message: "Failed to insert loyalty programs",
      },
      { status: 500 }
    );
  }

  return NextResponse.json<ApiResponse<LoyaltyProgram[]>>({
    data: data as LoyaltyProgram[],
    error: null,
    message: "Loyalty programs updated successfully",
  });
}
