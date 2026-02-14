/**
 * Demo Seed Script — creates three demo users for YC demo.
 *
 * User A: Priya Sharma — Cold start (0 bookings, fresh onboarding)
 * User B: Arjun Mehta  — Emerging traveler (3 bookings, learning mode)
 * User C: Raman Bamba  — Power traveler (10+ bookings, autopilot mode)
 *
 * Usage:
 *   npm run seed:demo
 *
 * Env vars (from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (required — admin access to bypass RLS)
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

// ── Shared Flight DNA seed data ──────────────────────────────────────────

const FLIGHT_DNA_ENTRIES = [
  // BLR → DEL
  { airline_code: "6E", route: "BLR-DEL", flight_number: "6E-302", aircraft_type: "A320neo", seat_pitch: 30, wifi: false, ontime_pct: 87.4, food_rating: 3.0, power_outlets: false, entertainment: "streaming", baggage_included: "cabin_only", notes: "Popular early morning. VISTA streaming via personal device." },
  { airline_code: "6E", route: "BLR-DEL", flight_number: "6E-508", aircraft_type: "A320neo", seat_pitch: 30, wifi: false, ontime_pct: 87.4, food_rating: 3.0, power_outlets: false, entertainment: "streaming", baggage_included: "cabin_only", notes: "Pre-dawn 04:25 departure." },
  { airline_code: "6E", route: "BLR-DEL", flight_number: null, aircraft_type: "A320neo", seat_pitch: 30, wifi: false, ontime_pct: 87.4, food_rating: 3.0, power_outlets: false, entertainment: "streaming", baggage_included: "cabin_only", notes: "Generic IndiGo BLR-DEL. 186-seat config." },
  { airline_code: "AI", route: "BLR-DEL", flight_number: "AI-501", aircraft_type: "A320neo", seat_pitch: 32, wifi: false, ontime_pct: 79.7, food_rating: 3.8, power_outlets: true, entertainment: "personal_screen", baggage_included: "15kg", notes: "Full-service. Complimentary meal + 15kg bag. USB all seats." },
  { airline_code: "AI", route: "BLR-DEL", flight_number: null, aircraft_type: "A320neo", seat_pitch: 32, wifi: false, ontime_pct: 79.7, food_rating: 3.8, power_outlets: true, entertainment: "personal_screen", baggage_included: "15kg", notes: "Generic Air India BLR-DEL. Full-service." },
  { airline_code: "QP", route: "BLR-DEL", flight_number: null, aircraft_type: "B737 MAX 8", seat_pitch: 31, wifi: true, ontime_pct: 86.9, food_rating: 3.2, power_outlets: true, entertainment: "streaming", baggage_included: "cabin_only", notes: "Newest fleet. Wi-Fi + power at every seat." },
  // BLR → BOM
  { airline_code: "6E", route: "BLR-BOM", flight_number: "6E-511", aircraft_type: "A320neo", seat_pitch: 30, wifi: false, ontime_pct: 87.4, food_rating: 3.0, power_outlets: false, entertainment: "streaming", baggage_included: "cabin_only", notes: "Popular morning slot. 1h 55m flight." },
  { airline_code: "6E", route: "BLR-BOM", flight_number: null, aircraft_type: "A320neo", seat_pitch: 30, wifi: false, ontime_pct: 87.4, food_rating: 3.0, power_outlets: false, entertainment: "streaming", baggage_included: "cabin_only", notes: "Generic IndiGo BLR-BOM. 20+ daily." },
  { airline_code: "AI", route: "BLR-BOM", flight_number: "AI-589", aircraft_type: "A320neo", seat_pitch: 32, wifi: false, ontime_pct: 79.7, food_rating: 3.8, power_outlets: true, entertainment: "personal_screen", baggage_included: "15kg", notes: "Full-service. Meal + 15kg bag included." },
  { airline_code: "QP", route: "BLR-BOM", flight_number: null, aircraft_type: "B737 MAX 8", seat_pitch: 31, wifi: true, ontime_pct: 86.9, food_rating: 3.2, power_outlets: true, entertainment: "streaming", baggage_included: "cabin_only", notes: "Wi-Fi enabled. Power outlets at every seat." },
  // BLR → HYD
  { airline_code: "6E", route: "BLR-HYD", flight_number: "6E-701", aircraft_type: "A320neo", seat_pitch: 30, wifi: false, ontime_pct: 87.4, food_rating: 3.0, power_outlets: false, entertainment: "streaming", baggage_included: "cabin_only", notes: "Short hop — 1h 15m. High frequency." },
  { airline_code: "6E", route: "BLR-HYD", flight_number: null, aircraft_type: "A320neo", seat_pitch: 30, wifi: false, ontime_pct: 87.4, food_rating: 3.0, power_outlets: false, entertainment: "streaming", baggage_included: "cabin_only", notes: "Generic IndiGo BLR-HYD. 30+ daily." },
  { airline_code: "AI", route: "BLR-HYD", flight_number: null, aircraft_type: "A320neo", seat_pitch: 32, wifi: false, ontime_pct: 79.7, food_rating: 3.8, power_outlets: true, entertainment: "personal_screen", baggage_included: "15kg", notes: "Full-service even on short hop." },
  { airline_code: "QP", route: "BLR-HYD", flight_number: null, aircraft_type: "B737 MAX 8", seat_pitch: 31, wifi: true, ontime_pct: 86.9, food_rating: 3.2, power_outlets: true, entertainment: "streaming", baggage_included: "cabin_only", notes: "Wi-Fi for quick work on short flights." },
  { airline_code: "IX", route: "BLR-HYD", flight_number: null, aircraft_type: "A320", seat_pitch: 29, wifi: false, ontime_pct: 80.0, food_rating: 2.8, power_outlets: false, entertainment: "none", baggage_included: "cabin_only", notes: "Budget option. Competitive pricing." },
];

async function seedFlightDNA() {
  // Clear existing DNA for ICP routes
  await supabase
    .from("flight_dna")
    .delete()
    .in("route", ["BLR-DEL", "BLR-BOM", "BLR-HYD", "DEL-BLR", "BOM-BLR", "HYD-BLR"]);

  // Add return legs
  const returnEntries = FLIGHT_DNA_ENTRIES.map((e) => {
    const [origin, dest] = e.route.split("-");
    return {
      ...e,
      route: `${dest}-${origin}`,
      notes: e.notes ? e.notes.replace(e.route, `${dest}-${origin}`) : e.notes,
    };
  });

  const allDna = [...FLIGHT_DNA_ENTRIES, ...returnEntries];
  const { error } = await supabase.from("flight_dna").insert(allDna);
  if (error) {
    console.error("  Flight DNA seed error:", error.message);
  } else {
    console.log(`  Flight DNA seeded: ${allDna.length} entries across 6 routes`);
  }
}

// ── Get or create user ──────────────────────────────────────────────────

async function getOrCreateUser(email: string, password: string): Promise<string> {
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers?.users?.find((u) => u.email === email);

  if (existing) {
    console.log(`  Found existing user: ${existing.id} (${email})`);
    return existing.id;
  }

  const { data: newUser, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !newUser.user) {
    console.error(`  Failed to create user ${email}:`, error?.message);
    process.exit(1);
  }
  console.log(`  Created user: ${newUser.user.id} (${email})`);
  return newUser.user.id;
}

// ── Clear user data ─────────────────────────────────────────────────────

async function clearUserData(userId: string) {
  // Delete in dependency order
  await supabase.from("flight_segments").delete().in(
    "booking_id",
    (await supabase.from("bookings").select("id").eq("user_id", userId)).data?.map((b) => b.id) ?? []
  );
  await supabase.from("bookings").delete().eq("user_id", userId);
  await supabase.from("booking_patterns").delete().eq("user_id", userId);
  await supabase.from("route_familiarity").delete().eq("user_id", userId);
  await supabase.from("onboarding_responses").delete().eq("user_id", userId);
  await supabase.from("chat_sessions").delete().eq("user_id", userId);
  await supabase.from("conversation_sessions").delete().eq("user_id", userId);
}

// ══════════════════════════════════════════════════════════════════════════
// USER A — Priya Sharma — Cold Start (0 bookings)
// ══════════════════════════════════════════════════════════════════════════

async function seedUserA() {
  console.log("\n── User A: Priya Sharma (Cold Start) ──────────────────");
  const email = "demo-new@skyswift.app";
  const password = "demo123456";
  const userId = await getOrCreateUser(email, password);

  await clearUserData(userId);

  // Profile — just completed onboarding
  await supabase.from("user_profiles").upsert(
    {
      id: userId,
      first_name: "Priya",
      last_name: "Sharma",
      phone: "+919812345678",
      date_of_birth: "1993-03-22",
      gender: "female",
      seat_preference: "window",
      meal_preference: "vegetarian",
      onboarding_completed: true,
    },
    { onConflict: "id" }
  );
  console.log("  Profile created");

  // Minimal travel preferences — from onboarding questionnaire only
  await supabase.from("user_travel_preferences").upsert(
    {
      user_id: userId,
      home_airport: "DEL",
      preferred_airlines: [],
      seat_preference: "window",
      cabin_class: "economy",
      price_sensitivity: 0.7, // budget-conscious
      advance_booking_days_avg: 5,
      communication_style: "balanced",
    },
    { onConflict: "user_id" }
  );
  console.log("  Travel preferences set (minimal — from onboarding only)");

  // Onboarding responses
  const onboardingResponses = [
    { question_key: "frequency", response_value: "monthly", raw_response: { selected: "1-2x/month" } },
    { question_key: "seat_pref", response_value: "window", raw_response: { selected: "window" } },
    { question_key: "time_vs_price", response_value: "price", raw_response: { selected: "Save money, flexible on timing" } },
    { question_key: "airline_loyalty", response_value: "none", raw_response: { selected: "No strong preference" } },
    { question_key: "baggage", response_value: "cabin_only", raw_response: { selected: "Just carry-on" } },
  ];
  for (const r of onboardingResponses) {
    await supabase.from("onboarding_responses").upsert(
      { user_id: userId, ...r },
      { onConflict: "user_id,question_key" }
    );
  }
  console.log("  Onboarding responses seeded");

  // No bookings, no patterns, no route familiarity — pure cold start
  console.log("  No booking history (cold start)");

  return { email, password, userId, name: "Priya Sharma", tier: "cold_start" };
}

// ══════════════════════════════════════════════════════════════════════════
// USER B — Arjun Mehta — Emerging Traveler (3 bookings, learning)
// ══════════════════════════════════════════════════════════════════════════

async function seedUserB() {
  console.log("\n── User B: Arjun Mehta (Learning Mode) ────────────────");
  const email = "demo-learning@skyswift.app";
  const password = "demo123456";
  const userId = await getOrCreateUser(email, password);

  await clearUserData(userId);

  // Profile
  await supabase.from("user_profiles").upsert(
    {
      id: userId,
      first_name: "Arjun",
      last_name: "Mehta",
      phone: "+919898765432",
      date_of_birth: "1990-11-08",
      gender: "male",
      seat_preference: "aisle",
      meal_preference: "no_preference",
      onboarding_completed: true,
    },
    { onConflict: "id" }
  );
  console.log("  Profile created");

  // Travel preferences — starting to develop
  await supabase.from("user_travel_preferences").upsert(
    {
      user_id: userId,
      home_airport: "BLR",
      preferred_airlines: [
        { code: "6E", name: "IndiGo", score: 0.65 },
      ],
      seat_preference: "aisle",
      cabin_class: "economy",
      price_sensitivity: 0.5,
      advance_booking_days_avg: 6,
      preferred_departure_windows: {
        monday: "morning",
        wednesday: "morning",
        friday: "evening",
      },
      communication_style: "concise",
    },
    { onConflict: "user_id" }
  );
  console.log("  Travel preferences set (emerging patterns)");

  // 3 BLR-DEL booking patterns — enough for learning mode
  const patterns = [
    { daysAgo: 42, airline: "6E", name: "IndiGo", flight: "6E-302", depH: 6, depM: 15, arrH: 8, arrM: 45, price: 4500, dow: 1 },
    { daysAgo: 25, airline: "AI", name: "Air India", flight: "AI-501", depH: 7, depM: 30, arrH: 10, arrM: 0, price: 5400, dow: 3 },
    { daysAgo: 10, airline: "6E", name: "IndiGo", flight: "6E-302", depH: 6, depM: 15, arrH: 8, arrM: 45, price: 4800, dow: 1 },
  ];

  for (const p of patterns) {
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
      days_before_departure: randomBetween(4, 8),
      booking_source: "chat",
      created_at: daysAgo(p.daysAgo),
    });
  }
  console.log("  Seeded 3 BLR-DEL booking patterns");

  // Route familiarity — learning level
  await supabase.from("route_familiarity").upsert(
    {
      user_id: userId,
      route: "BLR-DEL",
      times_booked: 3,
      last_booked_at: daysAgo(10),
      avg_price_paid: 4900,
      min_price_paid: 4500,
      max_price_paid: 5400,
      preferred_airline_code: "6E",
      preferred_airline_name: "IndiGo",
      preferred_flight_number: "6E-302",
      preferred_departure_window: "early_morning",
      avg_days_before_departure: 6,
      familiarity_level: "learning",
    },
    { onConflict: "user_id,route" }
  );
  console.log("  Route familiarity seeded (BLR-DEL=learning)");

  // Seed 2 confirmed bookings for stats
  for (let i = 0; i < 2; i++) {
    const bookingDate = dateStr(-(25 - i * 15));
    const { data: booking } = await supabase
      .from("bookings")
      .insert({
        user_id: userId,
        status: "confirmed",
        pnr: "DEL" + randomBetween(100, 999),
        total_price_cents: patterns[i].price * 100,
        currency: "INR",
        cabin_class: "economy",
        data_source: "mock",
        booked_at: daysAgo(patterns[i].daysAgo),
        payment_status: "captured",
      })
      .select("id")
      .single();

    if (booking) {
      await supabase.from("flight_segments").insert({
        booking_id: booking.id,
        segment_order: 1,
        airline_code: patterns[i].airline,
        flight_number: patterns[i].flight,
        departure_airport: "BLR",
        arrival_airport: "DEL",
        departure_time: `${dateStr(-patterns[i].daysAgo + 2)}T${String(patterns[i].depH).padStart(2, "0")}:${String(patterns[i].depM).padStart(2, "0")}:00+05:30`,
        arrival_time: `${dateStr(-patterns[i].daysAgo + 2)}T${String(patterns[i].arrH).padStart(2, "0")}:${String(patterns[i].arrM).padStart(2, "0")}:00+05:30`,
        cabin_class: "economy",
      });
    }
  }
  console.log("  Seeded 2 confirmed bookings");

  return { email, password, userId, name: "Arjun Mehta", tier: "learning" };
}

// ══════════════════════════════════════════════════════════════════════════
// USER C — Raman Bamba — Power Traveler (10+ bookings, autopilot)
// ══════════════════════════════════════════════════════════════════════════

async function seedUserC() {
  console.log("\n── User C: Raman Bamba (Autopilot Mode) ───────────────");
  const email = process.env.DEMO_USER_EMAIL ?? "demo@skyswift.app";
  const password = process.env.DEMO_USER_PASSWORD ?? "demo123456";
  const userId = await getOrCreateUser(email, password);

  await clearUserData(userId);

  // Profile
  await supabase.from("user_profiles").upsert(
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
  console.log("  Profile created");

  // Rich travel preferences
  await supabase.from("user_travel_preferences").upsert(
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
  console.log("  Travel preferences set (strong prefs)");

  // 8 BLR-DEL booking patterns (Autopilot)
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
      created_at: daysAgo(p.daysAgo),
    });
  }
  console.log("  Seeded 8 BLR-DEL booking patterns");

  // 3 BLR-BOM booking patterns (Learning)
  const blrBomPatterns = [
    { daysAgo: 60, airline: "6E", name: "IndiGo", flight: "6E-511", depH: 8, depM: 0, arrH: 9, arrM: 30, price: 4800, dow: 3 },
    { daysAgo: 35, airline: "AI", name: "Air India", flight: "AI-802", depH: 9, depM: 15, arrH: 10, arrM: 45, price: 5600, dow: 1 },
    { daysAgo: 15, airline: "6E", name: "IndiGo", flight: "6E-511", depH: 8, depM: 0, arrH: 9, arrM: 30, price: 5200, dow: 5 },
  ];

  for (const p of blrBomPatterns) {
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
      created_at: daysAgo(p.daysAgo),
    });
  }
  console.log("  Seeded 3 BLR-BOM booking patterns");

  // Route familiarity
  await supabase.from("route_familiarity").upsert(
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

  await supabase.from("route_familiarity").upsert(
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
  console.log("  Route familiarity seeded (BLR-DEL=autopilot, BLR-BOM=learning)");

  // Seed confirmed bookings for stats display
  for (let i = 0; i < 5; i++) {
    const p = blrDelPatterns[i];
    const { data: booking } = await supabase
      .from("bookings")
      .insert({
        user_id: userId,
        status: "confirmed",
        pnr: "DEL" + randomBetween(100, 999),
        total_price_cents: p.price * 100,
        currency: "INR",
        cabin_class: "economy",
        data_source: "mock",
        booked_at: daysAgo(p.daysAgo),
        payment_status: "captured",
      })
      .select("id")
      .single();

    if (booking) {
      await supabase.from("flight_segments").insert({
        booking_id: booking.id,
        segment_order: 1,
        airline_code: p.airline,
        flight_number: p.flight,
        departure_airport: "BLR",
        arrival_airport: "DEL",
        departure_time: `${dateStr(-p.daysAgo + 2)}T${String(p.depH).padStart(2, "0")}:${String(p.depM).padStart(2, "0")}:00+05:30`,
        arrival_time: `${dateStr(-p.daysAgo + 2)}T${String(p.arrH).padStart(2, "0")}:${String(p.arrM).padStart(2, "0")}:00+05:30`,
        cabin_class: "economy",
      });
    }
  }

  // Upcoming booking (tomorrow) for greeting context
  const upcomingDate = dateStr(1);
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
  }
  console.log("  Seeded 6 confirmed bookings (5 past + 1 upcoming)");

  return { email, password, userId, name: "Raman Bamba", tier: "autopilot" };
}

// ══════════════════════════════════════════════════════════════════════════
// Main
// ══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  SkySwift Demo Seed — 3 Users");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Seed Flight DNA first (shared across users)
  console.log("\n── Flight DNA (shared) ────────────────────────────────");
  await seedFlightDNA();

  // Seed all three users
  const userA = await seedUserA();
  const userB = await seedUserB();
  const userC = await seedUserC();

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Demo users seeded successfully!

  USER A — Cold Start (Act 1: Onboarding)
    Name:     ${userA.name}
    Email:    ${userA.email}
    Password: ${userA.password}
    Bookings: 0 · Routes: none
    Demo:     "Delhi next Tuesday" → Discovery mode, 3-5 options

  USER B — Learning Mode (Act 2: Pattern Recognition)
    Name:     ${userB.name}
    Email:    ${userB.email}
    Password: ${userB.password}
    Bookings: 3 · Routes: BLR-DEL (learning)
    Demo:     "Delhi next Monday" → Top 3, recommendation first

  USER C — Autopilot Mode (Act 3: "The Usual")
    Name:     ${userC.name}
    Email:    ${userC.email}
    Password: ${userC.password}
    Bookings: 11 · Routes: BLR-DEL (autopilot), BLR-BOM (learning)
    Demo:     "the usual" → One confident recommendation
              "need to be at CP by 10 AM" → Meeting-time logic

  Admin:    /dashboard/admin/demo-users → Switch between users
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
