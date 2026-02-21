import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { searchFlights } from "@/lib/supply";
import type { FlightOffer, CabinClass } from "@/lib/supply/types";
import type { PolicyCompliance, CorporateFlightResult } from "@/lib/whatsapp/formatters";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = any;

interface SearchRequest {
  origin: string;
  destination: string;
  date: string;
  return_date?: string;
  cabin_class?: string;
  time_preference?: string;
  org_id: string;
  member_id: string;
}

// ── Policy Checker ──

interface PolicyRules {
  domestic_cabin_class: { default: string; overrides: Array<{ seniority: string[]; allowed: string[] }> };
  max_flight_price: { domestic: number | null; international: number | null };
  advance_booking_days: { minimum: number };
  preferred_airlines: string[];
  blocked_airlines: string[];
  allow_refundable_only: boolean;
  max_stops: number;
  flight_duration_limit_hours: number | null;
}

function checkPolicyCompliance(
  offer: FlightOffer,
  flightRules: PolicyRules,
  seniority: string,
  policyMode: string
): PolicyCompliance {
  const violations: string[] = [];

  // Cabin class check
  const allowedCabins = getAllowedCabins(flightRules, seniority);
  const offerCabin = offer.segments[0]?.cabin ?? "economy";
  if (!allowedCabins.includes(offerCabin)) {
    violations.push(`${offerCabin} class not allowed — max: ${allowedCabins.join(", ")}`);
  }

  // Price check (domestic = both airports in India)
  const isDomestic = isIndianRoute(offer);
  const maxPrice = isDomestic
    ? flightRules.max_flight_price?.domestic
    : flightRules.max_flight_price?.international;
  if (maxPrice && offer.price.total > maxPrice) {
    violations.push(`₹${Math.round(offer.price.total).toLocaleString("en-IN")} exceeds ₹${maxPrice.toLocaleString("en-IN")} limit`);
  }

  // Advance booking check
  if (flightRules.advance_booking_days?.minimum > 0) {
    const depDate = new Date(offer.segments[0]?.departure.time);
    const now = new Date();
    const daysAhead = Math.floor((depDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAhead < flightRules.advance_booking_days.minimum) {
      violations.push(`Booked ${daysAhead} day(s) ahead — minimum ${flightRules.advance_booking_days.minimum} days required`);
    }
  }

  // Blocked airlines
  if (flightRules.blocked_airlines?.length > 0) {
    const airlineCode = offer.segments[0]?.airlineCode;
    if (airlineCode && flightRules.blocked_airlines.includes(airlineCode)) {
      violations.push(`${airlineCode} is blocked by company policy`);
    }
  }

  // Max stops
  if (flightRules.max_stops != null && offer.stops > flightRules.max_stops) {
    violations.push(`${offer.stops} stops exceeds maximum ${flightRules.max_stops}`);
  }

  // Refundable only
  if (flightRules.allow_refundable_only && offer.conditions && !offer.conditions.refundable) {
    violations.push("Non-refundable fares not allowed");
  }

  if (violations.length === 0) {
    return { status: "compliant", violations: [] };
  }

  // Hard policy = blocked, soft = warning
  return {
    status: policyMode === "hard" ? "blocked" : "warning",
    violations,
  };
}

function getAllowedCabins(rules: PolicyRules, seniority: string): string[] {
  // Check overrides first
  for (const override of (rules.domestic_cabin_class?.overrides ?? [])) {
    if (override.seniority.includes(seniority)) {
      return override.allowed;
    }
  }
  // Default
  const defaultCabin = rules.domestic_cabin_class?.default ?? "economy";
  const cabinHierarchy = ["economy", "premium_economy", "business", "first"];
  const maxIdx = cabinHierarchy.indexOf(defaultCabin);
  return cabinHierarchy.slice(0, maxIdx + 1);
}

function isIndianRoute(offer: FlightOffer): boolean {
  const indianCodes = ["DEL", "BOM", "BLR", "HYD", "MAA", "CCU", "PNQ", "AMD", "GOI", "JAI", "LKO", "COK", "GAU", "IXR", "PAT", "NAG", "IDR", "BBI", "RPR", "SXR", "IXC", "ATQ"];
  const dep = offer.segments[0]?.departure.airportCode;
  const arr = offer.segments[offer.segments.length - 1]?.arrival.airportCode;
  return indianCodes.includes(dep) && indianCodes.includes(arr);
}

// ── Main API Route ──

export async function POST(req: NextRequest) {
  try {
    // Verify caller is authenticated
    const authClient = createServerClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const body: SearchRequest = await req.json();
    const { origin, destination, date, return_date, cabin_class, org_id, member_id } = body;

    if (!origin || !destination || !date || !org_id || !member_id) {
      return NextResponse.json(
        { data: null, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Load policy and member seniority in parallel
    const db = supabase as DbRow;
    const [policyResult, memberResult] = await Promise.all([
      db.from("travel_policies")
        .select("*")
        .eq("org_id", org_id)
        .eq("is_active", true)
        .limit(1)
        .single(),
      db.from("org_members")
        .select("seniority_level")
        .eq("id", member_id)
        .single(),
    ]);

    const policy = policyResult.data;
    const seniority = memberResult.data?.seniority_level ?? "individual_contributor";
    const flightRules: PolicyRules = policy?.flight_rules ?? {};
    const policyMode = policy?.policy_mode ?? "soft";

    // Search flights via supply layer
    const searchResult = await searchFlights({
      origin,
      destination,
      departureDate: date,
      returnDate: return_date,
      cabinClass: (cabin_class as CabinClass) || "economy",
      currency: "INR",
      maxResults: 10,
    });

    // Apply policy compliance to each result
    const results: CorporateFlightResult[] = searchResult.offers.map((offer) => {
      const compliance = checkPolicyCompliance(offer, flightRules, seniority, policyMode);
      return { offer, compliance };
    });

    // Filter out blocked results in hard policy mode
    const filtered = policyMode === "hard"
      ? results.filter((r) => r.compliance.status !== "blocked")
      : results;

    // Sort: compliant first, then warnings, then by price
    filtered.sort((a, b) => {
      const statusOrder = { compliant: 0, warning: 1, blocked: 2 };
      const aOrder = statusOrder[a.compliance.status] ?? 2;
      const bOrder = statusOrder[b.compliance.status] ?? 2;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.offer.price.total - b.offer.price.total;
    });

    // Return top 5
    const topResults = filtered.slice(0, 5);

    return NextResponse.json({
      data: {
        results: topResults,
        total_found: searchResult.offers.length,
        policy_filtered: searchResult.offers.length - filtered.length,
        source: searchResult.source,
      },
      error: null,
    });
  } catch (error) {
    console.error("[Corporate Search] Error:", error);
    return NextResponse.json(
      { data: null, error: "Flight search failed" },
      { status: 500 }
    );
  }
}
