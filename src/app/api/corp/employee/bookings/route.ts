import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = any;

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const db = supabase as DbRow;

    // Get member
    const { data: member } = await db
      .from("org_members")
      .select("id, org_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .single();

    if (!member) {
      return NextResponse.json({ data: [], error: null });
    }

    let query = db
      .from("corp_bookings")
      .select("*")
      .eq("member_id", member.id)
      .order("created_at", { ascending: false });

    const status = req.nextUrl.searchParams.get("status");
    if (status) query = query.eq("status", status);

    const { data: bookings, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data: bookings ?? [], error: null });
  } catch (error) {
    console.error("[Employee Bookings] Error:", error);
    return NextResponse.json({ data: null, error: "Failed to load bookings" }, { status: 500 });
  }
}
