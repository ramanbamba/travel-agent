import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Verify the caller is an admin/travel_manager
    const supabase = createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", data: null, message: "" },
        { status: 401 }
      );
    }

    // Get caller's membership
    const { data: callerMember } = await supabaseAdmin
      .from("org_members")
      .select("id, org_id, role")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!callerMember || !["admin", "travel_manager"].includes(callerMember.role)) {
      return NextResponse.json(
        { error: "Only admins and travel managers can invite members", data: null, message: "" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, phone, department, role, seniority } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required", data: null, message: "" },
        { status: 400 }
      );
    }

    // Check if member already exists in this org
    const { data: existing } = await supabaseAdmin
      .from("org_members")
      .select("id, status")
      .eq("org_id", callerMember.org_id)
      .eq("email", email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: `This email is already ${existing.status} in your organization`, data: null, message: "" },
        { status: 409 }
      );
    }

    // Create invited member record
    const { data: member, error: memberError } = await supabaseAdmin
      .from("org_members")
      .insert({
        org_id: callerMember.org_id,
        full_name: name,
        email,
        phone: phone || null,
        department: department || null,
        role: role || "employee",
        seniority_level: seniority || "individual_contributor",
        status: "invited",
        reports_to: callerMember.id,
      })
      .select("id")
      .single();

    if (memberError) {
      console.error("Failed to create invite:", memberError);
      return NextResponse.json(
        { error: "Failed to create invite", data: null, message: memberError.message },
        { status: 500 }
      );
    }

    // Send invite email via Resend (if configured)
    if (process.env.RESEND_API_KEY) {
      try {
        const { data: org } = await supabaseAdmin
          .from("organizations")
          .select("name")
          .eq("id", callerMember.org_id)
          .single();

        const signupUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/signup?invite=${member.id}&email=${encodeURIComponent(email)}`;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "SkySwift <noreply@skyswift.ai>",
            to: email,
            subject: `You've been invited to ${org?.name || "SkySwift"} on SkySwift`,
            html: `
              <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
                <h2>You're invited to join ${org?.name || "your company"} on SkySwift</h2>
                <p>${name}, your company uses SkySwift for corporate travel booking.</p>
                <p>Sign up to start booking flights in 30 seconds via WhatsApp.</p>
                <a href="${signupUrl}" style="display: inline-block; background: #2563EB; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
                  Accept Invite
                </a>
                <p style="color: #6b7280; font-size: 14px;">Or copy this link: ${signupUrl}</p>
              </div>
            `,
          }),
        });
      } catch {
        // Non-critical — invite still created
        console.error("Failed to send invite email");
      }
    }

    return NextResponse.json({
      data: { memberId: member.id },
      error: null,
      message: "Invite sent successfully",
    });
  } catch (err) {
    console.error("Invite error:", err);
    return NextResponse.json(
      { error: "Internal server error", data: null, message: "" },
      { status: 500 }
    );
  }
}
