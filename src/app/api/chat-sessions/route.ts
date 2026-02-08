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

  const { data: sessions, error } = await supabase
    .from("chat_sessions")
    .select("id, title, booking_id, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: error.message, message: "Failed to fetch sessions" },
      { status: 500 }
    );
  }

  return NextResponse.json<ApiResponse>({
    data: sessions,
    error: null,
    message: "Sessions fetched",
  });
}

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

  const body = await request.json().catch(() => ({}));
  const title = body.title ?? "New booking";

  const { data: session, error } = await supabase
    .from("chat_sessions")
    .insert({ user_id: user.id, title, messages: [] })
    .select("id, title, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: error.message, message: "Failed to create session" },
      { status: 500 }
    );
  }

  return NextResponse.json<ApiResponse>({
    data: session,
    error: null,
    message: "Session created",
  });
}
