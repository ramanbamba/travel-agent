/**
 * Corporate Demo Seed Script — creates a demo org with 5 employees,
 * 50+ bookings across 3 months, travel policy, and GST invoices.
 *
 * Usage:
 *   npx tsx scripts/seed-demo-corp.ts
 *
 * Env vars (from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Helpers ───────────────────────────────────────────────────────────────

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function dateStr(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split("T")[0];
}

function uuid(): string {
  return crypto.randomUUID();
}

// ── Constants ─────────────────────────────────────────────────────────────

const DEMO_ORG = {
  name: "AcmeTech Solutions",
  gstin: "29AABCA1234G1Z5",
  domain: "acmetech.com",
  billing_address: "100 MG Road, Koramangala, Bangalore 560034",
  industry: "Technology",
};

const EMPLOYEES = [
  { full_name: "Raman Bamba", email: "raman@acmetech.com", role: "admin", seniority: "director", department: "Engineering" },
  { full_name: "Priya Sharma", email: "priya@acmetech.com", role: "travel_manager", seniority: "manager", department: "Operations" },
  { full_name: "Arjun Mehta", email: "arjun@acmetech.com", role: "employee", seniority: "individual_contributor", department: "Engineering" },
  { full_name: "Sneha Reddy", email: "sneha@acmetech.com", role: "employee", seniority: "senior", department: "Product" },
  { full_name: "Vikram Singh", email: "vikram@acmetech.com", role: "approver", seniority: "vp", department: "Sales" },
];

const ROUTES = [
  { origin: "BLR", destination: "DEL", airlines: ["6E", "AI", "UK", "QP"], basePrice: { min: 3500, max: 7000 } },
  { origin: "BLR", destination: "BOM", airlines: ["6E", "AI", "SG", "UK"], basePrice: { min: 3200, max: 6500 } },
  { origin: "DEL", destination: "BOM", airlines: ["6E", "AI", "UK", "SG"], basePrice: { min: 3800, max: 7500 } },
  { origin: "BLR", destination: "HYD", airlines: ["6E", "AI", "QP"], basePrice: { min: 2500, max: 5000 } },
  { origin: "DEL", destination: "CCU", airlines: ["6E", "AI", "SG"], basePrice: { min: 3500, max: 6000 } },
  { origin: "BOM", destination: "GOI", airlines: ["6E", "AI", "SG"], basePrice: { min: 2200, max: 4500 } },
  { origin: "BLR", destination: "MAA", airlines: ["6E", "AI", "SG"], basePrice: { min: 2000, max: 4000 } },
];

const AIRLINE_NAMES: Record<string, string> = {
  "6E": "IndiGo", "AI": "Air India", "UK": "Vistara",
  "SG": "SpiceJet", "QP": "Akasa Air",
};

const CABINS = ["economy", "economy", "economy", "economy", "premium_economy", "business"];
const CHANNELS = ["whatsapp", "whatsapp", "whatsapp", "web", "web", "email"];
const STATUSES = ["confirmed", "confirmed", "confirmed", "confirmed", "confirmed", "pending_approval", "cancelled"];

// ── Seed Functions ────────────────────────────────────────────────────────

async function getOrCreateUser(email: string, password: string): Promise<string> {
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers?.users?.find((u) => u.email === email);

  if (existing) return existing.id;

  const { data: newUser, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !newUser.user) {
    console.error(`  Failed to create user ${email}:`, error?.message);
    process.exit(1);
  }
  return newUser.user.id;
}

async function seedOrg(): Promise<string> {
  // Check for existing
  const { data: existing } = await supabase
    .from("organizations")
    .select("id")
    .eq("name", DEMO_ORG.name)
    .limit(1)
    .single();

  if (existing) {
    console.log(`  Found existing org: ${existing.id}`);
    return existing.id;
  }

  const { data: org, error } = await supabase
    .from("organizations")
    .insert({
      name: DEMO_ORG.name,
      slug: "acmetech",
      gstin: DEMO_ORG.gstin,
      domain: DEMO_ORG.domain,
      billing_address: { address: DEMO_ORG.billing_address },
      industry: DEMO_ORG.industry,
      plan: "business",
      onboarding_completed: true,
    })
    .select("id")
    .single();

  if (error || !org) {
    console.error("  Failed to create org:", error?.message);
    process.exit(1);
  }
  console.log(`  Created org: ${org.id}`);
  return org.id;
}

async function seedPolicy(orgId: string): Promise<void> {
  const { data: existing } = await supabase
    .from("travel_policies")
    .select("id")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (existing) {
    console.log("  Policy already exists");
    return;
  }

  await supabase.from("travel_policies").insert({
    org_id: orgId,
    name: "Standard Travel Policy",
    is_active: true,
    policy_mode: "soft",
    flight_rules: {
      allowed_cabins: {
        individual_contributor: ["economy"],
        senior: ["economy", "premium_economy"],
        manager: ["economy", "premium_economy"],
        director: ["economy", "premium_economy", "business"],
        vp: ["economy", "premium_economy", "business"],
        c_suite: ["economy", "premium_economy", "business", "first"],
      },
      max_price_domestic: 8000,
      max_price_international: 50000,
      blocked_airlines: [],
      max_stops: 1,
      advance_booking_days: 2,
      refundable_only: false,
    },
    spend_limits: {
      per_trip: {
        individual_contributor: 10000,
        senior: 15000,
        manager: 25000,
        director: 50000,
        vp: 75000,
        c_suite: 150000,
      },
      monthly: {
        individual_contributor: 25000,
        senior: 40000,
        manager: 75000,
        director: 150000,
        vp: 200000,
        c_suite: 500000,
      },
    },
    approval_rules: {
      auto_approve_below: 7000,
      require_approval_above: 7000,
      approval_timeout_hours: 24,
      escalation_after_hours: 48,
    },
    booking_rules: {
      allowed_channels: ["whatsapp", "web", "email"],
      max_advance_days: 90,
      require_trip_purpose: false,
    },
  });
  console.log("  Travel policy created");
}

async function seedMembers(orgId: string): Promise<{ memberId: string; userId: string; name: string; seniority: string; department: string }[]> {
  const members: { memberId: string; userId: string; name: string; seniority: string; department: string }[] = [];

  for (const emp of EMPLOYEES) {
    const userId = await getOrCreateUser(emp.email, "demo123456");

    // Check existing membership
    const { data: existing } = await supabase
      .from("org_members")
      .select("id")
      .eq("user_id", userId)
      .eq("org_id", orgId)
      .limit(1)
      .single();

    if (existing) {
      members.push({ memberId: existing.id, userId, name: emp.full_name, seniority: emp.seniority, department: emp.department });
      continue;
    }

    const { data: member, error } = await supabase
      .from("org_members")
      .insert({
        user_id: userId,
        org_id: orgId,
        full_name: emp.full_name,
        email: emp.email,
        role: emp.role,
        seniority_level: emp.seniority,
        department: emp.department,
        status: "active",
      })
      .select("id")
      .single();

    if (error || !member) {
      console.error(`  Failed to create member ${emp.full_name}:`, error?.message);
      continue;
    }
    members.push({ memberId: member.id, userId, name: emp.full_name, seniority: emp.seniority, department: emp.department });
  }

  console.log(`  ${members.length} members seeded`);
  return members;
}

async function seedBookings(
  orgId: string,
  members: { memberId: string; userId: string; name: string; seniority: string; department: string }[]
): Promise<void> {
  // Clear existing demo bookings
  await supabase.from("corp_bookings").delete().eq("org_id", orgId);
  await supabase.from("gst_invoices").delete().eq("org_id", orgId);

  let bookingCount = 0;
  let gstCount = 0;

  // Generate 55 bookings across 90 days
  for (let i = 0; i < 55; i++) {
    const member = randomItem(members);
    const route = randomItem(ROUTES);
    const daysBack = randomInt(1, 90);
    const cabin = randomItem(CABINS);
    const channel = randomItem(CHANNELS);
    const status = randomItem(STATUSES);
    const airlineCode = randomItem(route.airlines);

    // Adjust price by cabin
    let price = randomInt(route.basePrice.min, route.basePrice.max);
    if (cabin === "premium_economy") price = Math.round(price * 1.6);
    if (cabin === "business") price = Math.round(price * 3.5);

    // Policy compliance
    const compliant = price <= 8000 && cabin === "economy";
    const violations: string[] = [];
    if (price > 8000) violations.push("Exceeds domestic price limit (₹8,000)");
    if (cabin === "business" && !["director", "vp", "c_suite"].includes(member.seniority)) {
      violations.push(`Business class not allowed for ${member.seniority}`);
    }

    const bookingDate = daysAgo(daysBack);
    const departureDate = dateStr(-daysBack + randomInt(2, 10));
    const pnr = status === "cancelled" ? null : `${airlineCode}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const { data: booking, error } = await supabase
      .from("corp_bookings")
      .insert({
        org_id: orgId,
        member_id: member.memberId,
        origin: route.origin,
        destination: route.destination,
        airline_code: airlineCode,
        airline_name: AIRLINE_NAMES[airlineCode],
        departure_date: departureDate,
        cabin_class: cabin,
        total_amount: price,
        currency: "INR",
        status,
        pnr,
        booking_channel: channel,
        policy_compliant: compliant,
        policy_violations: violations,
        purpose: randomItem(["client_meeting", "conference", "site_visit", "training", "team_offsite"]),
        flight_details: {
          airline: AIRLINE_NAMES[airlineCode],
          airline_code: airlineCode,
          origin: route.origin,
          destination: route.destination,
          departure: departureDate,
          cabin: cabin,
        },
        created_at: bookingDate,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`  Booking insert error:`, error.message);
      continue;
    }
    bookingCount++;

    // Create GST invoice for confirmed bookings
    if (status === "confirmed" && booking) {
      const baseAmount = Math.round(price / 1.05); // Extract pre-GST amount
      const gstAmount = price - baseAmount;
      const isInterstate = route.origin.slice(0, 2) !== route.destination.slice(0, 2); // Simplified

      const { error: gstError } = await supabase.from("gst_invoices").insert({
        org_id: orgId,
        booking_id: booking.id,
        invoice_number: `INV-${dateStr(-daysBack).replace(/-/g, "")}-${randomInt(100, 999)}`,
        invoice_date: bookingDate,
        vendor_name: AIRLINE_NAMES[airlineCode],
        vendor_gstin: `29AAB${airlineCode}${randomInt(1000, 9999)}G1Z${randomInt(0, 9)}`,
        base_amount: baseAmount,
        cgst_amount: isInterstate ? 0 : Math.round(gstAmount / 2),
        sgst_amount: isInterstate ? 0 : Math.round(gstAmount / 2),
        igst_amount: isInterstate ? gstAmount : 0,
        total_gst: gstAmount,
        total_amount: price,
        itc_eligible: true,
        itc_claimed: Math.random() > 0.3,
        sac_code: "996411",
      });

      if (!gstError) gstCount++;
    }

    // Create approval record for pending_approval bookings
    if (status === "pending_approval" && booking) {
      const approver = members.find((m) => m.seniority === "vp" || m.seniority === "director");
      if (approver) {
        await supabase.from("approval_requests").insert({
          booking_id: booking.id,
          org_id: orgId,
          requester_id: member.memberId,
          approver_id: approver.memberId,
          status: "pending",
          created_at: bookingDate,
        });
      }
    }
  }

  console.log(`  ${bookingCount} bookings seeded`);
  console.log(`  ${gstCount} GST invoices seeded`);
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  SkySwift Corporate Demo Seed");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("Creating organization...");
  const orgId = await seedOrg();

  console.log("\nSetting up travel policy...");
  await seedPolicy(orgId);

  console.log("\nCreating employees...");
  const members = await seedMembers(orgId);

  console.log("\nGenerating bookings & GST invoices...");
  await seedBookings(orgId, members);

  // Create traveler preferences for some employees
  console.log("\nSeeding traveler preferences...");
  for (const member of members.slice(0, 3)) {
    await supabase.from("traveler_preferences").upsert(
      {
        org_id: orgId,
        member_id: member.memberId,
        preferred_airlines: randomItem([["6E"], ["6E", "AI"], ["UK", "AI"]]),
        preferred_departure_window: randomItem(["morning", "early_morning", "afternoon"]),
        seat_preference: randomItem(["aisle", "window", "no_preference"]),
        meal_preference: randomItem(["vegetarian", "no_preference"]),
        bag_preference: randomItem(["cabin_only", "checked_15kg"]),
      },
      { onConflict: "org_id,member_id" }
    );
  }
  console.log("  3 traveler preferences seeded");

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Corporate demo data seeded successfully!

  Organization: ${DEMO_ORG.name}
  Org ID:       ${orgId}
  GSTIN:        ${DEMO_ORG.gstin}

  Employees (all password: demo123456):
  ─────────────────────────────────────────────
  ${members.map((m) => `${m.name.padEnd(20)} ${EMPLOYEES.find((e) => e.full_name === m.name)?.email}`).join("\n  ")}

  Data:
  • 55 bookings across 90 days
  • Mix of compliant & out-of-policy
  • GST invoices with ITC tracking
  • Pending approvals for demo flow

  Access:
  • Admin:    /dashboard/corp (login as raman@acmetech.com)
  • Employee: /book (login as arjun@acmetech.com)
  • Demo:     /demo (password: ${process.env.DEMO_PASSWORD || "skyswift2025"})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
