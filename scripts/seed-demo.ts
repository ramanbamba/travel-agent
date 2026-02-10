/**
 * Demo Seed Script — creates a demo user with rich booking history.
 *
 * Usage:
 *   npm run seed:demo
 *
 * Env vars (from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (required — admin access to bypass RLS)
 *   DEMO_USER_EMAIL            (optional, defaults to demo@skyswift.app)
 *   DEMO_USER_PASSWORD         (optional, defaults to demo123456)
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEMO_EMAIL = process.env.DEMO_USER_EMAIL ?? "demo@skyswift.app";
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD ?? "demo123456";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing env vars. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Helpers ───────────────────────────────────────────────────────────────

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nSeeding demo user: ${DEMO_EMAIL}\n`);

  // 1. Create or find user
  let userId: string;

  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers?.users?.find((u) => u.email === DEMO_EMAIL);

  if (existing) {
    userId = existing.id;
    console.log(`  Found existing user: ${userId}`);
  } else {
    const { data: newUser, error } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
    });
    if (error || !newUser.user) {
      console.error("Failed to create user:", error?.message);
      process.exit(1);
    }
    userId = newUser.user.id;
    console.log(`  Created user: ${userId}`);
  }

  // 2. Upsert user profile
  const { error: profileError } = await supabase.from("user_profiles").upsert(
    {
      id: userId,
      first_name: "Raman",
      last_name: "Bamba",
      phone: "+919876543210",
      date_of_birth: "1995-06-15",
      gender: "male",
      seat_preference: "aisle",
      meal_preference: "no_preference",
      onboarding_completed: true,
    },
    { onConflict: "id" }
  );
  if (profileError) {
    console.error("  Profile upsert failed:", profileError.message);
  } else {
    console.log("  Profile upserted");
  }

  // 3. Seed user_travel_preferences
  const { error: prefError } = await supabase
    .from("user_travel_preferences")
    .upsert(
      {
        user_id: userId,
        home_airport: "BLR",
        preferred_airlines: [
          { code: "6E", name: "IndiGo", score: 0.85 },
          { code: "AI", name: "Air India", score: 0.45 },
        ],
        seat_preference: "aisle",
        cabin_class: "economy",
        price_sensitivity: 0.6,
        advance_booking_days_avg: 7,
        preferred_departure_windows: {
          monday: "early_morning",
          tuesday: "early_morning",
          wednesday: "morning",
          thursday: "morning",
          friday: "late_evening",
          saturday: "morning",
          sunday: "evening",
        },
        communication_style: "concise",
      },
      { onConflict: "user_id" }
    );
  if (prefError) {
    console.error("  Preferences upsert failed:", prefError.message);
  } else {
    console.log("  Travel preferences seeded");
  }

  // 4. Clear old demo patterns + familiarity
  await supabase.from("booking_patterns").delete().eq("user_id", userId);
  await supabase.from("route_familiarity").delete().eq("user_id", userId);
  console.log("  Cleared old booking patterns & route familiarity");

  // 5. Seed 8 BLR-DEL booking patterns (Autopilot)
  const blrDelPatterns = [
    { daysAgo: 85, airline: "6E", name: "IndiGo", flight: "6E-302", depH: 6, depM: 15, arrH: 8, arrM: 45, price: 4200, dow: 1 },
    { daysAgo: 72, airline: "6E", name: "IndiGo", flight: "6E-302", depH: 6, depM: 15, arrH: 8, arrM: 45, price: 4850, dow: 2 },
    { daysAgo: 58, airline: "AI", name: "Air India", flight: "AI-501", depH: 7, depM: 30, arrH: 10, arrM: 0, price: 5100, dow: 4 },
    { daysAgo: 45, airline: "6E", name: "IndiGo", flight: "6E-302", depH: 6, depM: 15, arrH: 8, arrM: 45, price: 4600, dow: 1 },
    { daysAgo: 32, airline: "6E", name: "IndiGo", flight: "6E-302", depH: 6, depM: 15, arrH: 8, arrM: 45, price: 5200, dow: 3 },
    { daysAgo: 21, airline: "6E", name: "IndiGo", flight: "6E-302", depH: 6, depM: 15, arrH: 8, arrM: 45, price: 4900, dow: 2 },
    { daysAgo: 12, airline: "AI", name: "Air India", flight: "AI-501", depH: 7, depM: 30, arrH: 10, arrM: 0, price: 5800, dow: 5 },
    { daysAgo: 5, airline: "6E", name: "IndiGo", flight: "6E-302", depH: 6, depM: 15, arrH: 8, arrM: 45, price: 4700, dow: 2 },
  ];

  for (const p of blrDelPatterns) {
    const createdAt = daysAgo(p.daysAgo);
    await supabase.from("booking_patterns").insert({
      user_id: userId,
      route: "BLR-DEL",
      airline_code: p.airline,
      airline_name: p.name,
      flight_number: p.flight,
      departure_time: `${String(p.depH).padStart(2, "0")}:${String(p.depM).padStart(2, "0")}:00`,
      arrival_time: `${String(p.arrH).padStart(2, "0")}:${String(p.arrM).padStart(2, "0")}:00`,
      day_of_week: p.dow,
      price_paid: p.price,
      currency: "INR",
      cabin_class: "economy",
      seat_type: "aisle",
      days_before_departure: randomBetween(5, 10),
      booking_source: "chat",
      created_at: createdAt,
    });
  }
  console.log("  Seeded 8 BLR-DEL booking patterns");

  // 6. Seed 3 BLR-BOM booking patterns (Learning)
  const blrBomPatterns = [
    { daysAgo: 60, airline: "6E", name: "IndiGo", flight: "6E-511", depH: 8, depM: 0, arrH: 9, arrM: 30, price: 4800, dow: 3 },
    { daysAgo: 35, airline: "AI", name: "Air India", flight: "AI-802", depH: 9, depM: 15, arrH: 10, arrM: 45, price: 5600, dow: 1 },
    { daysAgo: 15, airline: "6E", name: "IndiGo", flight: "6E-511", depH: 8, depM: 0, arrH: 9, arrM: 30, price: 5200, dow: 5 },
  ];

  for (const p of blrBomPatterns) {
    const createdAt = daysAgo(p.daysAgo);
    await supabase.from("booking_patterns").insert({
      user_id: userId,
      route: "BLR-BOM",
      airline_code: p.airline,
      airline_name: p.name,
      flight_number: p.flight,
      departure_time: `${String(p.depH).padStart(2, "0")}:${String(p.depM).padStart(2, "0")}:00`,
      arrival_time: `${String(p.arrH).padStart(2, "0")}:${String(p.arrM).padStart(2, "0")}:00`,
      day_of_week: p.dow,
      price_paid: p.price,
      currency: "INR",
      cabin_class: "economy",
      seat_type: "aisle",
      days_before_departure: randomBetween(3, 8),
      booking_source: "chat",
      created_at: createdAt,
    });
  }
  console.log("  Seeded 3 BLR-BOM booking patterns");

  // 7. Seed route familiarity
  const { error: rf1Error } = await supabase
    .from("route_familiarity")
    .upsert(
      {
        user_id: userId,
        route: "BLR-DEL",
        times_booked: 8,
        last_booked_at: daysAgo(5),
        avg_price_paid: 4850,
        min_price_paid: 4200,
        max_price_paid: 5800,
        preferred_airline_code: "6E",
        preferred_airline_name: "IndiGo",
        preferred_flight_number: "6E-302",
        preferred_departure_window: "early_morning",
        avg_days_before_departure: 7,
        familiarity_level: "autopilot",
      },
      { onConflict: "user_id,route" }
    );
  if (rf1Error) console.error("  Route familiarity BLR-DEL error:", rf1Error.message);

  const { error: rf2Error } = await supabase
    .from("route_familiarity")
    .upsert(
      {
        user_id: userId,
        route: "BLR-BOM",
        times_booked: 3,
        last_booked_at: daysAgo(15),
        avg_price_paid: 5200,
        min_price_paid: 4800,
        max_price_paid: 5600,
        preferred_airline_code: "6E",
        preferred_airline_name: "IndiGo",
        preferred_flight_number: "6E-511",
        preferred_departure_window: "morning",
        avg_days_before_departure: 5,
        familiarity_level: "learning",
      },
      { onConflict: "user_id,route" }
    );
  if (rf2Error) console.error("  Route familiarity BLR-BOM error:", rf2Error.message);

  console.log("  Route familiarity seeded (BLR-DEL=autopilot, BLR-BOM=learning)");

  // 8. Seed a fake upcoming booking (for greeting context)
  const upcomingDate = dateStr(1); // tomorrow
  const { data: upcomingBooking } = await supabase
    .from("bookings")
    .insert({
      user_id: userId,
      status: "confirmed",
      pnr: "HYD" + randomBetween(100, 999),
      total_price_cents: 520000,
      currency: "INR",
      cabin_class: "economy",
      data_source: "mock",
      booked_at: daysAgo(3),
      payment_status: "captured",
    })
    .select("id")
    .single();

  if (upcomingBooking) {
    await supabase.from("flight_segments").insert({
      booking_id: upcomingBooking.id,
      segment_order: 1,
      airline_code: "6E",
      flight_number: "6E-701",
      departure_airport: "BLR",
      arrival_airport: "HYD",
      departure_time: `${upcomingDate}T09:00:00+05:30`,
      arrival_time: `${upcomingDate}T10:15:00+05:30`,
      cabin_class: "economy",
    });
    console.log("  Seeded upcoming BLR-HYD booking for tomorrow (greeting context)");
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Demo user seeded successfully!

  Email:    ${DEMO_EMAIL}
  Password: ${DEMO_PASSWORD}

  Login and try:
    "Delhi next Tuesday"     → Autopilot mode
    "Mumbai on Thursday"     → Learning mode
    "hey"                    → Time-aware greeting

  Settings → Travel DNA     → See preference visualisation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
