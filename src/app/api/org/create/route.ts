import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function extractDomain(email: string): string {
  return email.split("@")[1] || "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company, admin, travel } = body;

    if (!company?.companyName || !company?.workEmail || !admin?.userId || !admin?.fullName) {
      return NextResponse.json(
        { error: "Missing required fields", data: null, message: "Validation error" },
        { status: 400 }
      );
    }

    const domain = extractDomain(company.workEmail);
    let slug = slugify(company.companyName);

    // Ensure slug is unique
    const { data: existingSlug } = await supabaseAdmin
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // 1. Create organization
    const { data: org, error: orgError } = await supabaseAdmin
      .from("organizations")
      .insert({
        name: company.companyName,
        slug,
        domain,
        industry: company.industry || null,
        employee_count_range: company.employeeCount || null,
        gstin: travel?.gstin || null,
        gst_state_code: travel?.gstin ? travel.gstin.substring(0, 2) : null,
        onboarding_completed: true,
      })
      .select("id")
      .single();

    if (orgError || !org) {
      console.error("Failed to create org:", orgError);
      return NextResponse.json(
        { error: "Failed to create organization", data: null, message: orgError?.message || "" },
        { status: 500 }
      );
    }

    // 2. Create admin member
    const { error: memberError } = await supabaseAdmin
      .from("org_members")
      .insert({
        org_id: org.id,
        user_id: admin.userId,
        full_name: admin.fullName,
        email: company.workEmail,
        phone: company.phone || null,
        designation: admin.designation || null,
        seniority_level: "c_suite",
        role: "admin",
        status: "active",
        joined_at: new Date().toISOString(),
      });

    if (memberError) {
      console.error("Failed to create admin member:", memberError);
      // Cleanup: delete the org we just created
      await supabaseAdmin.from("organizations").delete().eq("id", org.id);
      return NextResponse.json(
        { error: "Failed to create admin profile", data: null, message: memberError.message },
        { status: 500 }
      );
    }

    // 3. Create default travel policy
    const { error: policyError } = await supabaseAdmin
      .from("travel_policies")
      .insert({
        org_id: org.id,
        name: "Default Policy",
        is_active: true,
        policy_mode: "soft",
      });

    if (policyError) {
      console.error("Failed to create default policy:", policyError);
      // Non-critical — org is still usable
    }

    return NextResponse.json({
      data: { orgId: org.id, slug },
      error: null,
      message: "Organization created successfully",
    });
  } catch (err) {
    console.error("Org creation error:", err);
    return NextResponse.json(
      { error: "Internal server error", data: null, message: "" },
      { status: 500 }
    );
  }
}
