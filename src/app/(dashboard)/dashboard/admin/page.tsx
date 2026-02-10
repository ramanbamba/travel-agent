"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plane,
  AlertTriangle,
  TrendingUp,
  Calendar,
  CalendarDays,
  CalendarRange,
  Settings,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils/format-india";

interface AdminStats {
  recentBookings: {
    id: string;
    pnr: string;
    status: string;
    total_price_cents: number;
    currency: string;
    cabin_class: string;
    data_source: string;
    booked_at: string;
    supplier_name: string | null;
    our_revenue_cents: number | null;
    flight_segments: {
      departure_airport: string;
      arrival_airport: string;
      airline_code: string;
      flight_number: string;
    }[];
  }[];
  todayCount: number;
  weekCount: number;
  monthCount: number;
  totalBookings: number;
  totalRevenueCents: number;
  totalOurRevenueCents: number;
  avgBookingCents: number;
  currency: string;
  incidents: {
    id: string;
    incident_type: string;
    amount: number;
    currency: string;
    error_message: string;
    resolved: boolean;
    created_at: string;
  }[];
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--glass-radius-card)] p-4",
        "bg-[var(--glass-subtle)]",
        "backdrop-blur-[24px] [backdrop-filter:blur(24px)_saturate(1.8)] [-webkit-backdrop-filter:blur(24px)_saturate(1.8)]",
        "border border-[var(--glass-border)]"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full",
            accent
              ? "bg-[var(--glass-accent-blue-light)]"
              : "bg-[var(--glass-subtle)]"
          )}
        >
          <Icon
            className={cn(
              "h-4.5 w-4.5",
              accent
                ? "text-[var(--glass-accent-blue)]"
                : "text-[var(--glass-text-secondary)]"
            )}
          />
        </div>
        <div>
          <p className="text-2xl font-bold text-[var(--glass-text-primary)]">
            {value}
          </p>
          <p className="text-xs text-[var(--glass-text-tertiary)]">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.status === 403) {
          router.replace("/dashboard");
          return;
        }
        if (!res.ok) throw new Error("Failed to load stats");
        const json = await res.json();
        setStats(json.data);
      } catch (err) {
        console.error("Admin stats error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--glass-text-tertiary)]" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-[var(--glass-text-tertiary)]">
          Failed to load admin data.
        </p>
      </div>
    );
  }

  const c = stats.currency;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--glass-text-primary)]">
          Admin Dashboard
        </h1>
        <Link
          href="/dashboard/admin/pricing"
          className={cn(
            "flex items-center gap-1.5 rounded-[var(--glass-radius-button)] px-3 py-1.5",
            "text-xs font-medium text-[var(--glass-accent-blue)]",
            "border border-[var(--glass-border)]",
            "bg-[var(--glass-subtle)]",
            "transition-all duration-200 hover:bg-[var(--glass-standard)]"
          )}
        >
          <Settings className="h-3.5 w-3.5" />
          Pricing Rules
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Today"
          value={String(stats.todayCount)}
          icon={Calendar}
        />
        <StatCard
          label="This Week"
          value={String(stats.weekCount)}
          icon={CalendarDays}
        />
        <StatCard
          label="This Month"
          value={String(stats.monthCount)}
          icon={CalendarRange}
        />
        <StatCard
          label="Total Bookings"
          value={String(stats.totalBookings)}
          icon={Plane}
          accent
        />
      </div>

      {/* Revenue */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard
          label="Total Revenue"
          value={formatPrice(stats.totalRevenueCents / 100, c)}
          icon={TrendingUp}
          accent
        />
        <StatCard
          label="Our Revenue (markup + fees)"
          value={formatPrice(stats.totalOurRevenueCents / 100, c)}
          icon={TrendingUp}
        />
        <StatCard
          label="Avg per Booking"
          value={formatPrice(stats.avgBookingCents / 100, c)}
          icon={TrendingUp}
        />
      </div>

      {/* Recent bookings */}
      <div
        className={cn(
          "rounded-[var(--glass-radius-card)]",
          "bg-[var(--glass-subtle)]",
          "backdrop-blur-[24px] [backdrop-filter:blur(24px)_saturate(1.8)] [-webkit-backdrop-filter:blur(24px)_saturate(1.8)]",
          "border border-[var(--glass-border)]",
          "overflow-hidden"
        )}
      >
        <div className="border-b border-[var(--glass-border)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--glass-text-primary)]">
            Recent Bookings
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--glass-border)] text-left text-xs text-[var(--glass-text-tertiary)]">
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Route</th>
                <th className="px-4 py-2 font-medium">Airline</th>
                <th className="px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentBookings.map((bk) => {
                const seg = bk.flight_segments?.[0];
                return (
                  <tr
                    key={bk.id}
                    className="border-b border-[var(--glass-border)] last:border-0"
                  >
                    <td className="whitespace-nowrap px-4 py-2.5 text-[var(--glass-text-secondary)]">
                      {bk.booked_at
                        ? new Date(bk.booked_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-medium text-[var(--glass-text-primary)]">
                      {seg
                        ? `${seg.departure_airport} → ${seg.arrival_airport}`
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-[var(--glass-text-secondary)]">
                      {seg
                        ? `${seg.airline_code} ${seg.flight_number}`
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-[var(--glass-text-primary)]">
                      {formatPrice(
                        (bk.total_price_cents ?? 0) / 100,
                        bk.currency
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                          bk.status === "confirmed"
                            ? "bg-[var(--glass-accent-green-light)] text-[var(--glass-accent-green)]"
                            : bk.status === "cancelled"
                              ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                        )}
                      >
                        {bk.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-[var(--glass-text-tertiary)]">
                      {bk.supplier_name ?? bk.data_source}
                    </td>
                  </tr>
                );
              })}
              {stats.recentBookings.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-[var(--glass-text-tertiary)]"
                  >
                    No bookings yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incidents */}
      <div
        className={cn(
          "rounded-[var(--glass-radius-card)]",
          "bg-[var(--glass-subtle)]",
          "backdrop-blur-[24px] [backdrop-filter:blur(24px)_saturate(1.8)] [-webkit-backdrop-filter:blur(24px)_saturate(1.8)]",
          "border border-[var(--glass-border)]",
          "overflow-hidden"
        )}
      >
        <div className="flex items-center gap-2 border-b border-[var(--glass-border)] px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-[var(--glass-text-primary)]">
            Recent Incidents
          </h2>
        </div>
        <div className="divide-y divide-[var(--glass-border)]">
          {stats.incidents.map((inc) => (
            <div key={inc.id} className="flex items-center gap-3 px-4 py-3">
              {inc.resolved ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--glass-accent-green)]" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0 text-red-500" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--glass-text-primary)]">
                  {inc.incident_type.replace(/_/g, " ")}
                </p>
                <p className="truncate text-xs text-[var(--glass-text-tertiary)]">
                  {inc.error_message}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium text-[var(--glass-text-primary)]">
                  {formatPrice(inc.amount, inc.currency)}
                </p>
                <p className="text-xs text-[var(--glass-text-tertiary)]">
                  {new Date(inc.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </div>
            </div>
          ))}
          {stats.incidents.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-[var(--glass-text-tertiary)]">
              No incidents
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
