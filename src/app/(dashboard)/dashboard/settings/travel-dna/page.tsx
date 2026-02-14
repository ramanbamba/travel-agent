"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plane,
  MapPin,
  TrendingUp,
  Clock,
  Shield,
  Armchair,
  Wifi,
  Briefcase,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  CloudSun,
} from "lucide-react";
import { GlassCard, GlassPill } from "@/components/ui/glass";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils/format-india";
import type {
  ConfidenceScores,
  TemporalPrefs,
  AirlinePrefs,
  ComfortPrefs,
  PriceSensitivity,
  ContextPatterns,
} from "@/types/preferences";

// ── Types ────────────────────────────────────────────────────────────────────

interface TravelDNA {
  totalBookings: number;
  routesLearned: number;
  preferences: {
    homeAirport: string;
    seatPreference: string;
    cabinClass: string;
    priceSensitivity: number;
    advanceBookingDaysAvg: number;
    communicationStyle: string;
    preferredAirlines: Array<{ code: string; name: string; score: number }>;
  };
  topRoutes: Array<{
    route: string;
    timesBooked: number;
    familiarityLevel: string;
    avgPrice: number | null;
  }>;
  airlineUsage: Array<{
    code: string;
    name: string;
    percentage: number;
  }>;
}

interface TasteProfile {
  confidenceScores: ConfidenceScores;
  temporalPrefs: TemporalPrefs;
  airlinePrefs: AirlinePrefs;
  comfortPrefs: ComfortPrefs;
  priceSensitivity: PriceSensitivity;
  contextPatterns: ContextPatterns;
  totalBookings: number;
  lastBookingAt: string | null;
}

// ── Confidence Ring (SVG) ────────────────────────────────────────────────────

function ConfidenceRing({
  score,
  size = 140,
}: {
  score: number;
  size?: number;
}) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - score * circumference;
  const percent = Math.round(score * 100);

  const label =
    score < 0.2
      ? "Just getting started"
      : score < 0.4
        ? "Learning your style"
        : score < 0.6
          ? "Getting to know you"
          : score < 0.8
            ? "Knows you well"
            : "Knows you inside out";

  const color =
    score < 0.3
      ? "var(--glass-text-tertiary)"
      : score < 0.6
        ? "rgb(245, 158, 11)"
        : "var(--glass-accent-blue)";

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--glass-border)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-expo-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-3xl font-bold"
            style={{ color }}
          >
            {percent}%
          </span>
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-[var(--glass-text-primary)]">
        {label}
      </p>
      <p className="mt-0.5 text-xs text-[var(--glass-text-tertiary)]">
        AI confidence score
      </p>
    </div>
  );
}

// ── Confidence Category Bar ──────────────────────────────────────────────────

function ConfidenceBar({
  label,
  score,
  icon: Icon,
}: {
  label: string;
  score: number;
  icon: React.ElementType;
}) {
  const percent = Math.round(score * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--glass-subtle)]">
        <Icon className="h-3.5 w-3.5 text-[var(--glass-text-tertiary)]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-[var(--glass-text-secondary)]">
            {label}
          </span>
          <span className="text-xs tabular-nums text-[var(--glass-text-tertiary)]">
            {percent}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--glass-border)]">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-expo-out",
              score >= 0.6
                ? "bg-[var(--glass-accent-blue)]"
                : score >= 0.3
                  ? "bg-amber-500"
                  : "bg-[var(--glass-text-tertiary)]"
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Familiarity Progress ─────────────────────────────────────────────────────

function FamiliarityProgress({ level }: { level: string }) {
  const segments = ["discovery", "learning", "autopilot"];
  const idx = segments.indexOf(level);

  const colors = {
    discovery: "bg-purple-500",
    learning: "bg-amber-500",
    autopilot: "bg-[var(--glass-accent-blue)]",
  };

  return (
    <div className="flex items-center gap-1">
      {segments.map((s, i) => (
        <div
          key={s}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors duration-500",
            i <= idx ? colors[level as keyof typeof colors] ?? "bg-[var(--glass-text-tertiary)]" : "bg-[var(--glass-border)]"
          )}
        />
      ))}
    </div>
  );
}

// ── Time Window Icon ─────────────────────────────────────────────────────────

const TIME_WINDOW_ICONS: Record<string, React.ElementType> = {
  early_morning: Sunrise,
  morning: Sun,
  afternoon: CloudSun,
  evening: Sunset,
  late_evening: Moon,
};

const TIME_WINDOW_LABELS: Record<string, string> = {
  early_morning: "Early AM",
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  late_evening: "Late PM",
};

const DAY_ABBREVS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

// ── Airline Card ─────────────────────────────────────────────────────────────

function AirlineCard({
  name,
  code,
  score,
  percentage,
}: {
  name: string;
  code: string;
  score: number;
  percentage: number;
}) {
  return (
    <div className={cn(
      "flex items-center gap-3 rounded-xl p-3",
      "bg-[var(--glass-standard)] border border-[var(--glass-border)]/50"
    )}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--glass-accent-blue-light)] text-sm font-bold text-[var(--glass-accent-blue)]">
        {code}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--glass-text-primary)]">{name}</p>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-[var(--glass-border)]">
            <div
              className="h-full rounded-full bg-[var(--glass-accent-blue)] transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-[11px] tabular-nums text-[var(--glass-text-tertiary)]">
            {percentage}%
          </span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-[var(--glass-text-tertiary)]">affinity</p>
        <p className="text-sm font-semibold text-[var(--glass-text-primary)]">
          {Math.round(score * 100)}
        </p>
      </div>
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <GlassCard tier="subtle" hover={false} padding="md">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--glass-accent-blue-light)]">
          <Icon className="h-4 w-4 text-[var(--glass-accent-blue)]" />
        </div>
        <div>
          <p className="text-2xl font-bold text-[var(--glass-text-primary)]">
            {value}
          </p>
          <p className="text-xs text-[var(--glass-text-tertiary)]">{label}</p>
        </div>
      </div>
    </GlassCard>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <GlassCard tier="subtle" hover={false} padding="lg">
      <div className="flex flex-col items-center py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--glass-accent-blue-light)]">
          <Plane className="h-7 w-7 text-[var(--glass-accent-blue)]" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-[var(--glass-text-primary)]">
          No travel data yet
        </h3>
        <p className="mt-2 max-w-sm text-sm text-[var(--glass-text-secondary)]">
          Book your first flight and we&apos;ll start learning your preferences.
          Over time, we&apos;ll personalize search results and recommendations
          just for you.
        </p>
        <Link
          href="/dashboard"
          className={cn(
            "mt-6 inline-flex items-center gap-2 rounded-[var(--glass-radius-button)] px-5 py-2.5",
            "bg-[var(--glass-accent-blue)] text-sm font-medium text-white",
            "transition-all duration-200 ease-spring",
            "hover:brightness-110 active:scale-[0.97]"
          )}
        >
          <Plane className="h-4 w-4" />
          Book a Flight
        </Link>
      </div>
    </GlassCard>
  );
}

// ── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-center">
        <div className="h-[140px] w-[140px] rounded-full bg-[var(--glass-subtle)]" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-[var(--glass-radius-card)] bg-[var(--glass-subtle)]" />
        ))}
      </div>
      <div className="h-48 rounded-[var(--glass-radius-card)] bg-[var(--glass-subtle)]" />
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function TravelDNAPage() {
  const [dna, setDNA] = useState<TravelDNA | null>(null);
  const [taste, setTaste] = useState<TasteProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDNA() {
      try {
        const res = await fetch("/api/preferences/travel-dna");
        if (!res.ok) return;
        const json = await res.json();
        if (json.data?.dna) setDNA(json.data.dna);
        if (json.data?.tasteProfile) setTaste(json.data.tasteProfile);
      } catch {
        // Fail silently
      } finally {
        setLoading(false);
      }
    }
    fetchDNA();
  }, []);

  const priceSensitivityLabel =
    dna?.preferences.priceSensitivity != null
      ? dna.preferences.priceSensitivity < 0.3
        ? "Budget-focused"
        : dna.preferences.priceSensitivity > 0.7
          ? "Comfort-focused"
          : "Balanced"
      : "Balanced";

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/settings"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-primary)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Settings
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--glass-text-primary)] sm:text-4xl">
          Travel DNA
        </h1>
        <p className="mt-1 text-sm text-[var(--glass-text-secondary)]">
          Your personalized travel intelligence — learned from your bookings.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {loading ? (
          <LoadingSkeleton />
        ) : !dna || dna.totalBookings === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* ── "How well AI knows you" Ring ── */}
            {taste && (
              <GlassCard tier="subtle" hover={false} padding="lg">
                <div className="flex flex-col items-center">
                  <ConfidenceRing score={taste.confidenceScores.overall} />

                  {/* Per-category breakdown */}
                  <div className="mt-6 w-full space-y-3">
                    <ConfidenceBar
                      label="Timing preferences"
                      score={taste.confidenceScores.temporal}
                      icon={Clock}
                    />
                    <ConfidenceBar
                      label="Airline preferences"
                      score={taste.confidenceScores.airline}
                      icon={Plane}
                    />
                    <ConfidenceBar
                      label="Comfort preferences"
                      score={taste.confidenceScores.comfort}
                      icon={Armchair}
                    />
                    <ConfidenceBar
                      label="Price sensitivity"
                      score={taste.confidenceScores.price}
                      icon={TrendingUp}
                    />
                    <ConfidenceBar
                      label="Context patterns"
                      score={taste.confidenceScores.context}
                      icon={Briefcase}
                    />
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Plane} label="Total Bookings" value={dna.totalBookings} />
              <StatCard icon={MapPin} label="Routes Learned" value={dna.routesLearned} />
              <StatCard icon={TrendingUp} label="Price Style" value={priceSensitivityLabel} />
              <StatCard
                icon={Clock}
                label="Avg. Advance"
                value={`${Math.round(dna.preferences.advanceBookingDaysAvg)}d`}
              />
            </div>

            {/* ── Temporal Heatmap ── */}
            {taste && Object.keys(taste.temporalPrefs.departure_windows).length > 0 && (
              <div>
                <p className="mb-1.5 px-1 text-xs font-medium uppercase tracking-wider text-[var(--glass-text-tertiary)]">
                  Departure Time Patterns
                </p>
                <GlassCard tier="subtle" hover={false} padding="md">
                  <div className="space-y-2">
                    {DAY_KEYS.map((dayKey, i) => {
                      const window = taste.temporalPrefs.departure_windows[dayKey];
                      if (!window) return null;
                      const WinIcon = TIME_WINDOW_ICONS[window] ?? Clock;
                      return (
                        <div key={dayKey} className="flex items-center gap-3">
                          <span className="w-8 text-xs font-medium text-[var(--glass-text-tertiary)]">
                            {DAY_ABBREVS[i]}
                          </span>
                          <div className={cn(
                            "flex items-center gap-1.5 rounded-full px-2.5 py-1",
                            "bg-[var(--glass-standard)] border border-[var(--glass-border)]/50"
                          )}>
                            <WinIcon className="h-3 w-3 text-[var(--glass-accent-blue)]" />
                            <span className="text-xs font-medium text-[var(--glass-text-primary)]">
                              {TIME_WINDOW_LABELS[window] ?? window}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>
              </div>
            )}

            {/* ── Airline Preferences ── */}
            {dna.airlineUsage.length > 0 && (
              <div>
                <p className="mb-1.5 px-1 text-xs font-medium uppercase tracking-wider text-[var(--glass-text-tertiary)]">
                  Airline Preferences
                </p>
                <div className="space-y-2">
                  {dna.airlineUsage.map((airline) => {
                    const prefScore = dna.preferences.preferredAirlines.find(
                      (a) => a.code === airline.code
                    )?.score ?? 0;
                    return (
                      <AirlineCard
                        key={airline.code}
                        name={airline.name}
                        code={airline.code}
                        score={prefScore}
                        percentage={airline.percentage}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Top Routes ── */}
            {dna.topRoutes.length > 0 && (
              <div>
                <p className="mb-1.5 px-1 text-xs font-medium uppercase tracking-wider text-[var(--glass-text-tertiary)]">
                  Route Intelligence
                </p>
                <GlassCard tier="subtle" hover={false} padding="none" className="overflow-hidden">
                  {dna.topRoutes.map((route, i) => (
                    <div
                      key={route.route}
                      className={cn(
                        "px-4 py-3",
                        i < dna.topRoutes.length - 1 && "border-b border-[var(--glass-border)]/50"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--glass-text-primary)]">
                            {route.route}
                          </span>
                          <GlassPill
                            variant={route.familiarityLevel === "autopilot" ? "green" : "default"}
                            size="sm"
                          >
                            {route.familiarityLevel}
                          </GlassPill>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-[var(--glass-text-primary)]">
                            {route.timesBooked}x
                          </span>
                          {route.avgPrice != null && (
                            <span className="ml-2 text-xs text-[var(--glass-text-tertiary)]">
                              avg {formatPrice(route.avgPrice, "INR")}
                            </span>
                          )}
                        </div>
                      </div>
                      <FamiliarityProgress level={route.familiarityLevel} />
                    </div>
                  ))}
                </GlassCard>
              </div>
            )}

            {/* ── Comfort Preferences ── */}
            {taste && (
              <div>
                <p className="mb-1.5 px-1 text-xs font-medium uppercase tracking-wider text-[var(--glass-text-tertiary)]">
                  Comfort Profile
                </p>
                <GlassCard tier="subtle" hover={false} padding="none" className="overflow-hidden">
                  <PreferenceRow
                    label="Seat"
                    value={taste.comfortPrefs.seat_type}
                    icon={Armchair}
                  />
                  <PreferenceRow
                    label="Cabin"
                    value={taste.comfortPrefs.cabin_class}
                    icon={Plane}
                  />
                  {taste.comfortPrefs.wifi_important && (
                    <PreferenceRow label="Wi-Fi" value="Important" icon={Wifi} />
                  )}
                  <PreferenceRow
                    label="Baggage"
                    value={taste.comfortPrefs.baggage}
                    icon={Briefcase}
                  />
                  <PreferenceRow
                    label="Travel mode"
                    value={taste.contextPatterns.primary_mode}
                    icon={Shield}
                    last
                  />
                </GlassCard>
              </div>
            )}

            {/* ── Price Anchors ── */}
            {taste && Object.keys(taste.priceSensitivity.price_anchors).length > 0 && (
              <div>
                <p className="mb-1.5 px-1 text-xs font-medium uppercase tracking-wider text-[var(--glass-text-tertiary)]">
                  Price Anchors
                </p>
                <GlassCard tier="subtle" hover={false} padding="none" className="overflow-hidden">
                  {Object.entries(taste.priceSensitivity.price_anchors).map(([route, price], i, arr) => (
                    <div
                      key={route}
                      className={cn(
                        "flex items-center justify-between px-4 py-3",
                        i < arr.length - 1 && "border-b border-[var(--glass-border)]/50"
                      )}
                    >
                      <span className="text-sm font-medium text-[var(--glass-text-primary)]">
                        {route}
                      </span>
                      <span className="text-sm text-[var(--glass-text-secondary)]">
                        ~{formatPrice(price, "INR")}
                      </span>
                    </div>
                  ))}
                </GlassCard>
              </div>
            )}

            {/* Home Airport */}
            <div>
              <p className="mb-1.5 px-1 text-xs font-medium uppercase tracking-wider text-[var(--glass-text-tertiary)]">
                Base
              </p>
              <GlassCard tier="subtle" hover={false} padding="md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--glass-accent-blue-light)]">
                    <MapPin className="h-4 w-4 text-[var(--glass-accent-blue)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--glass-text-primary)]">
                      {dna.preferences.homeAirport}
                    </p>
                    <p className="text-xs text-[var(--glass-text-tertiary)]">
                      Home airport
                    </p>
                  </div>
                </div>
              </GlassCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Preference Row ───────────────────────────────────────────────────────────

function PreferenceRow({
  label,
  value,
  icon: Icon,
  last,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3",
        !last && "border-b border-[var(--glass-border)]/50"
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-[var(--glass-text-tertiary)]" />
      <span className="text-sm text-[var(--glass-text-secondary)]">
        {label}
      </span>
      <span className="ml-auto text-sm font-medium capitalize text-[var(--glass-text-primary)]">
        {value.replace(/_/g, " ")}
      </span>
    </div>
  );
}
