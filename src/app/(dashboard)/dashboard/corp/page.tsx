"use client";

import { useEffect, useState } from "react";
import {
  Plane,
  IndianRupee,
  ShieldCheck,
  Receipt,
  Clock,
  AlertTriangle,
  Loader2,
  Inbox,
} from "lucide-react";
import { StatCard, PageHeader, StatusBadge, EmptyState } from "@/components/corporate-dashboard";
import dynamic from "next/dynamic";
const OverviewCharts = dynamic(() => import("./overview-charts").then(m => m.OverviewCharts), { ssr: false });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StatsData = any;

function formatINR(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${Math.round(amount).toLocaleString("en-IN")}`;
  return `₹${amount}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function CorpOverviewPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/corp/stats");
        if (!res.ok) throw new Error("Failed to load");
        const json = await res.json();
        setStats(json.data);
      } catch (err) {
        console.error("Corp stats error:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <EmptyState
        icon={Inbox}
        message={error ?? "No data available"}
      />
    );
  }

  const { kpi, recentBookings, pendingApprovals, flaggedBookings, channelCounts, topRoutes, monthlySpend } = stats;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Overview"
        description="Your organization's travel at a glance"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Bookings this month"
          value={String(kpi.totalBookingsThisMonth)}
          icon={Plane}
          trend={{ value: kpi.bookingsTrend, label: "vs last month" }}
        />
        <StatCard
          label="Spend this month"
          value={formatINR(kpi.spendThisMonth)}
          icon={IndianRupee}
          trend={{ value: kpi.spendTrend, label: "vs last month" }}
        />
        <StatCard
          label="Policy compliance"
          value={`${kpi.complianceRate}%`}
          icon={ShieldCheck}
        />
        <StatCard
          label="GST ITC recovered"
          value={formatINR(kpi.itcRecovered)}
          icon={Receipt}
        />
      </div>

      {/* Charts */}
      <OverviewCharts
        monthlySpend={monthlySpend}
        channelCounts={channelCounts}
        topRoutes={topRoutes}
      />

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50">
          <div className="flex items-center gap-2 border-b border-yellow-200 px-4 py-3">
            <Clock className="h-4 w-4 text-yellow-600" />
            <h2 className="text-sm font-semibold text-yellow-800">
              Pending Approvals ({pendingApprovals.length})
            </h2>
          </div>
          <div className="divide-y divide-yellow-100">
            {pendingApprovals.map((approval: StatsData) => (
              <div key={approval.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{approval.message}</p>
                  <p className="text-xs text-gray-500">{timeAgo(approval.created_at)}</p>
                </div>
                <StatusBadge status="pending_approval" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flagged Bookings */}
      {flaggedBookings.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50">
          <div className="flex items-center gap-2 border-b border-red-200 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <h2 className="text-sm font-semibold text-red-800">
              Out-of-Policy Bookings ({flaggedBookings.length})
            </h2>
          </div>
          <div className="divide-y divide-red-100">
            {flaggedBookings.map((b: StatsData) => (
              <div key={b.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {b.origin} → {b.destination}
                  </p>
                  <p className="text-xs text-gray-500">
                    {b.member_name} · {b.departure_date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatINR(b.total_amount)}</p>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-[#0F1B2D]">Recent Bookings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Employee</th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Route</th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Date</th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Amount</th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Channel</th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b: StatsData) => (
                <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-[#0F1B2D]">
                    {b.member_name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {b.origin} → {b.destination}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {b.departure_date
                      ? new Date(b.departure_date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })
                      : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-[#0F1B2D]">
                    {formatINR(b.total_amount)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 capitalize">
                      {(b.booking_channel ?? "web").replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                </tr>
              ))}
              {recentBookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    No bookings yet. Share the WhatsApp bot with your team to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
