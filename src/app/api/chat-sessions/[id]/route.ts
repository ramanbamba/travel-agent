import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
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

  const { data: session, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: error.message, message: "Session not found" },
      { status: 404 }
    );
  }

  return NextResponse.json<ApiResponse>({
    data: session,
    error: null,
    message: "Session fetched",
  });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
  const updates: Record<string, unknown> = {};

  if (body.messages !== undefined) updates.messages = body.messages;
  if (body.title !== undefined) updates.title = body.title;
  if (body.booking_id !== undefined) updates.booking_id = body.booking_id;

  const { data: session, error } = await supabase
    .from("chat_sessions")
    .update(updates)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select("id, title, booking_id, updated_at")
    .single();

  if (error) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: error.message, message: "Failed to update session" },
      { status: 500 }
    );
  }

  return NextResponse.json<ApiResponse>({
    data: session,
    error: null,
    message: "Session updated",
  });
}
