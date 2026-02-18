import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", data: null, message: "" },
        { status: 401 }
      );
    }

    // Find active membership
    const { data: member, error: memberError } = await supabase
      .from("org_members")
      .select("*, organizations(*)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (memberError || !member) {
      return NextResponse.json({
        data: { member: null, org: null },
        error: null,
        message: "No active membership found",
      });
    }

    return NextResponse.json({
      data: {
        member: { ...member, organizations: undefined },
        org: member.organizations,
      },
      error: null,
      message: "OK",
    });
  } catch (err) {
    console.error("Org me error:", err);
    return NextResponse.json(
      { error: "Internal server error", data: null, message: "" },
      { status: 500 }
    );
  }
}
