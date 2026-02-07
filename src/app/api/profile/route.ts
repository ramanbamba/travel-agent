import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse, UserProfile, LoyaltyProgram } from "@/types";

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

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: loyaltyPrograms, error: loyaltyError } = await supabase
    .from("loyalty_programs")
    .select("*")
    .eq("user_id", user.id);

  if (profileError && profileError.code !== "PGRST116") {
    return NextResponse.json<ApiResponse>(
      { data: null, error: profileError.message, message: "Failed to fetch profile" },
      { status: 500 }
    );
  }

  if (loyaltyError) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: loyaltyError.message, message: "Failed to fetch loyalty programs" },
      { status: 500 }
    );
  }

  return NextResponse.json<
    ApiResponse<{ profile: UserProfile | null; loyalty_programs: LoyaltyProgram[] }>
  >({
    data: {
      profile: profile as UserProfile | null,
      loyalty_programs: (loyaltyPrograms as LoyaltyProgram[]) ?? [],
    },
    error: null,
    message: "Profile fetched successfully",
  });
}

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

  const body = await request.json();

  // Remove fields that shouldn't be directly set by the client
  delete body.id;
  delete body.created_at;
  delete body.updated_at;

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert({ id: user.id, ...body }, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: error.message, message: "Failed to update profile" },
      { status: 500 }
    );
  }

  return NextResponse.json<ApiResponse<UserProfile>>({
    data: data as UserProfile,
    error: null,
    message: "Profile updated successfully",
  });
}
