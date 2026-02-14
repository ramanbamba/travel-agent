"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plane,
  ArrowLeft,
  Wifi,
  WifiOff,
  Plug,
  Monitor,
  Loader2,
  Search,
  Clock,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { FlightDNARow } from "@/types/preferences";

const ROUTES = [
  "BLR-DEL", "DEL-BLR",
  "BLR-BOM", "BOM-BLR",
  "BLR-HYD", "HYD-BLR",
  "DEL-BOM", "BOM-DEL",
  "DEL-HYD", "HYD-DEL",
];

const AIRLINE_NAMES: Record<string, string> = {
  "6E": "IndiGo",
  AI: "Air India",
  QP: "Akasa Air",
  SG: "SpiceJet",
  IX: "Air India Express",
};

function OntimeBadge({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  const color =
    pct >= 85 ? "text-green-600 bg-green-50" :
    pct >= 70 ? "text-yellow-600 bg-yellow-50" :
    "text-red-600 bg-red-50";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", color)}>
      <Clock className="h-3 w-3" />
      {pct.toFixed(1)}%
    </span>
  );
}

function FoodRating({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="text-xs text-[var(--glass-text-tertiary)]">N/A</span>;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[var(--glass-text-secondary)]">
      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
      {rating.toFixed(1)}
    </span>
  );
}

export default function FlightDnaAdmin() {
  const [entries, setEntries] = useState<FlightDNARow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState("BLR-DEL");
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadEntries(selectedRoute);
  }, [selectedRoute]);

  async function loadEntries(route: string) {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("flight_dna")
      .select("*")
      .eq("route", route)
      .order("ontime_pct", { ascending: false });

    if (!error && data) {
      setEntries(data as FlightDNARow[]);
    }

    // Get total count across all routes
    const { count } = await supabase
      .from("flight_dna")
      .select("*", { count: "exact", head: true });
    setTotalCount(count ?? 0);

    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/admin"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--glass-subtle)] hover:bg-[var(--glass-hover)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-[var(--glass-text-secondary)]" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--glass-text-primary)]">
            Flight DNA
          </h1>
          <p className="text-sm text-[var(--glass-text-secondary)]">
            {totalCount} entries across {ROUTES.length} routes — curated product intelligence
          </p>
        </div>
      </div>

      {/* Route Selector */}
      <div className="flex flex-wrap gap-2">
        {ROUTES.filter((r) => r.startsWith("BLR") || r === "DEL-BOM").map((route) => (
          <button
            key={route}
            onClick={() => setSelectedRoute(route)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              selectedRoute === route
                ? "bg-[var(--glass-accent-blue)] text-white"
                : "bg-[var(--glass-subtle)] text-[var(--glass-text-secondary)] hover:bg-[var(--glass-hover)]"
            )}
          >
            {route.replace("-", " → ")}
          </button>
        ))}
      </div>

      {/* Entries */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--glass-text-tertiary)]" />
        </div>
      ) : entries.length === 0 ? (
        <div
          className={cn(
            "rounded-[var(--glass-radius-card)] p-8 text-center",
            "bg-[var(--glass-subtle)]",
            "backdrop-blur-[24px] [backdrop-filter:blur(24px)_saturate(1.8)] [-webkit-backdrop-filter:blur(24px)_saturate(1.8)]",
            "border border-[var(--glass-border)]"
          )}
        >
          <Search className="mx-auto mb-3 h-8 w-8 text-[var(--glass-text-tertiary)]" />
          <p className="text-sm text-[var(--glass-text-secondary)]">
            No Flight DNA entries for {selectedRoute}
          </p>
          <p className="mt-1 text-xs text-[var(--glass-text-tertiary)]">
            Run the seed migration or use npm run seed:demo to populate data
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                "rounded-[var(--glass-radius-card)] p-4",
                "bg-[var(--glass-subtle)]",
                "backdrop-blur-[24px] [backdrop-filter:blur(24px)_saturate(1.8)] [-webkit-backdrop-filter:blur(24px)_saturate(1.8)]",
                "border border-[var(--glass-border)]"
              )}
            >
              {/* Row 1: Airline + Flight + Aircraft */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--glass-accent-blue-light)]">
                    <Plane className="h-4 w-4 text-[var(--glass-accent-blue)]" />
                  </div>
                  <div>
                    <span className="font-semibold text-[var(--glass-text-primary)]">
                      {AIRLINE_NAMES[entry.airline_code] ?? entry.airline_code}
                    </span>
                    {entry.flight_number && (
                      <span className="ml-2 text-sm text-[var(--glass-text-secondary)]">
                        {entry.flight_number}
                      </span>
                    )}
                    {!entry.flight_number && (
                      <span className="ml-2 rounded bg-[var(--glass-hover)] px-1.5 py-0.5 text-xs text-[var(--glass-text-tertiary)]">
                        Generic
                      </span>
                    )}
                  </div>
                </div>
                <OntimeBadge pct={entry.ontime_pct} />
              </div>

              {/* Row 2: Specs */}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--glass-text-secondary)]">
                {entry.aircraft_type && (
                  <span className="rounded bg-[var(--glass-hover)] px-2 py-0.5">
                    {entry.aircraft_type}
                  </span>
                )}
                {entry.seat_pitch && (
                  <span>{entry.seat_pitch}&quot; pitch</span>
                )}
                <span className="inline-flex items-center gap-1">
                  {entry.wifi ? (
                    <Wifi className="h-3 w-3 text-green-500" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-[var(--glass-text-tertiary)]" />
                  )}
                  {entry.wifi ? "Wi-Fi" : "No Wi-Fi"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Plug className={cn("h-3 w-3", entry.power_outlets ? "text-green-500" : "text-[var(--glass-text-tertiary)]")} />
                  {entry.power_outlets ? "Power" : "No power"}
                </span>
                {entry.entertainment && entry.entertainment !== "none" && (
                  <span className="inline-flex items-center gap-1">
                    <Monitor className="h-3 w-3 text-[var(--glass-accent-blue)]" />
                    {entry.entertainment === "personal_screen" ? "IFE" : "Streaming"}
                  </span>
                )}
                <FoodRating rating={entry.food_rating} />
                {entry.baggage_included && entry.baggage_included !== "cabin_only" && (
                  <span className="rounded bg-green-50 px-2 py-0.5 text-green-700">
                    {entry.baggage_included} bag
                  </span>
                )}
              </div>

              {/* Row 3: Notes */}
              {entry.notes && (
                <p className="mt-2 text-xs text-[var(--glass-text-tertiary)] leading-relaxed">
                  {entry.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
