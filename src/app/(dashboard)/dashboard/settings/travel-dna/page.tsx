"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plane,
  MapPin,
  TrendingUp,
  Clock,
  BarChart3,
} from "lucide-react";
import { GlassCard, GlassPill } from "@/components/ui/glass";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils/format-india";

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

function FamiliarityBadge({ level }: { level: string }) {
  const config = {
    discovery: { label: "Discovery", variant: "default" as const },
    learning: { label: "Learning", variant: "green" as const },
    autopilot: { label: "Autopilot", variant: "green" as const },
  }[level] ?? { label: level, variant: "default" as const };

  return (
    <GlassPill variant={config.variant} size="sm">
      {config.label}
    </GlassPill>
  );
}

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

function AirlineBar({
  name,
  percentage,
}: {
  name: string;
  percentage: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--glass-text-primary)]">{name}</span>
        <span className="text-[var(--glass-text-tertiary)]">{percentage}%</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--glass-subtle)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--glass-accent-blue)] to-[var(--glass-accent-blue)]/60 transition-all duration-500 ease-expo-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

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

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-[var(--glass-radius-card)] bg-[var(--glass-subtle)]"
          />
        ))}
      </div>
      <div className="h-48 rounded-[var(--glass-radius-card)] bg-[var(--glass-subtle)]" />
      <div className="h-32 rounded-[var(--glass-radius-card)] bg-[var(--glass-subtle)]" />
    </div>
  );
}

export default function TravelDNAPage() {
  const [dna, setDNA] = useState<TravelDNA | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDNA() {
      try {
        const res = await fetch("/api/preferences/travel-dna");
        if (!res.ok) return;
        const json = await res.json();
        if (json.data?.dna) {
          setDNA(json.data.dna);
        }
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
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={Plane}
                label="Total Bookings"
                value={dna.totalBookings}
              />
              <StatCard
                icon={MapPin}
                label="Routes Learned"
                value={dna.routesLearned}
              />
              <StatCard
                icon={TrendingUp}
                label="Price Style"
                value={priceSensitivityLabel}
              />
              <StatCard
                icon={Clock}
                label="Avg. Advance"
                value={`${Math.round(dna.preferences.advanceBookingDaysAvg)}d`}
              />
            </div>

            {/* Top routes */}
            {dna.topRoutes.length > 0 && (
              <div>
                <p className="mb-1.5 px-1 text-xs font-medium uppercase tracking-wider text-[var(--glass-text-tertiary)]">
                  Top Routes
                </p>
                <GlassCard
                  tier="subtle"
                  hover={false}
                  padding="none"
                  className="overflow-hidden"
                >
                  {dna.topRoutes.map((route, i) => (
                    <div
                      key={route.route}
                      className={cn(
                        "flex items-center justify-between px-4 py-3",
                        i < dna.topRoutes.length - 1 &&
                          "border-b border-[var(--glass-border)]/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-[var(--glass-text-primary)]">
                          {route.route}
                        </span>
                        <FamiliarityBadge level={route.familiarityLevel} />
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-[var(--glass-text-primary)]">
                          {route.timesBooked}x
                        </p>
                        {route.avgPrice != null && (
                          <p className="text-xs text-[var(--glass-text-tertiary)]">
                            avg {formatPrice(route.avgPrice, "INR")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </GlassCard>
              </div>
            )}

            {/* Airline usage */}
            {dna.airlineUsage.length > 0 && (
              <div>
                <p className="mb-1.5 px-1 text-xs font-medium uppercase tracking-wider text-[var(--glass-text-tertiary)]">
                  Airline Preference
                </p>
                <GlassCard tier="subtle" hover={false} padding="md">
                  <div className="space-y-3">
                    {dna.airlineUsage.map((airline) => (
                      <AirlineBar
                        key={airline.code}
                        name={airline.name}
                        percentage={airline.percentage}
                      />
                    ))}
                  </div>
                </GlassCard>
              </div>
            )}

            {/* Preferences summary */}
            <div>
              <p className="mb-1.5 px-1 text-xs font-medium uppercase tracking-wider text-[var(--glass-text-tertiary)]">
                Learned Preferences
              </p>
              <GlassCard
                tier="subtle"
                hover={false}
                padding="none"
                className="overflow-hidden"
              >
                <PreferenceRow
                  label="Home Airport"
                  value={dna.preferences.homeAirport}
                />
                <PreferenceRow
                  label="Seat Preference"
                  value={dna.preferences.seatPreference}
                />
                <PreferenceRow
                  label="Cabin Class"
                  value={dna.preferences.cabinClass}
                />
                <PreferenceRow
                  label="Communication"
                  value={dna.preferences.communicationStyle}
                  last
                />
              </GlassCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PreferenceRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3",
        !last && "border-b border-[var(--glass-border)]/50"
      )}
    >
      <span className="text-sm text-[var(--glass-text-secondary)]">
        {label}
      </span>
      <span className="text-sm font-medium capitalize text-[var(--glass-text-primary)]">
        {value}
      </span>
    </div>
  );
}
