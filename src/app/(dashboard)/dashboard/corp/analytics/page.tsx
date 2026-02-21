"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Loader2,
} from "lucide-react";
import { PageHeader, EmptyState } from "@/components/corporate-dashboard";
import dynamic from "next/dynamic";
const AnalyticsCharts = dynamic(() => import("./analytics-charts").then(m => m.AnalyticsCharts), { ssr: false });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnalyticsData = any;

function formatINR(amount: number): string {
  if (amount >= 10000000) return `\u20B9${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `\u20B9${(amount / 100000).toFixed(1)}L`;
  return `\u20B9${Math.round(amount).toLocaleString("en-IN")}`;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/corp/analytics");
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        console.error("Analytics load error:", err);
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

  if (!data || data.totalBookings === 0) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader title="Analytics" description="Travel insights and trends" />
        <EmptyState
          icon={BarChart3}
          title="No analytics data yet"
          message="Analytics will appear after your team's first bookings."
          hint="Share the WhatsApp bot with your team to start tracking spend, compliance, and travel patterns."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Analytics" description="Travel insights and trends" />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-500">Total Bookings</p>
          <p className="mt-1 text-2xl font-bold text-[#0F1B2D]">{data.totalBookings}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-500">Total Spend</p>
          <p className="mt-1 text-2xl font-bold text-[#0F1B2D]">{formatINR(data.totalSpend)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-500">Avg Advance Booking</p>
          <p className="mt-1 text-2xl font-bold text-[#0F1B2D]">{data.avgAdvanceDays} days</p>
          {data.avgAdvanceDays < 7 && (
            <p className="mt-1 text-xs text-yellow-600">
              Booking 7+ days ahead could save ~15%
            </p>
          )}
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-500">GST Recovery Rate</p>
          <p className="mt-1 text-2xl font-bold text-[#0F1B2D]">{data.gstRecoveryRate}%</p>
        </div>
      </div>

      {/* Charts */}
      <AnalyticsCharts
        monthlySpend={data.monthlySpend}
        spendByDepartment={data.spendByDepartment}
        topRoutes={data.topRoutes}
        channelCounts={data.channelCounts}
        complianceTrend={data.complianceTrend}
      />

      {/* Top Travelers Table */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-[#0F1B2D]">Top Travelers</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Name</th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Department</th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Bookings</th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Total Spend</th>
              </tr>
            </thead>
            <tbody>
              {data.topTravelers.map((t: AnalyticsData, i: number) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-[#0F1B2D]">
                    {t.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">{t.department}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{t.bookings}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-[#0F1B2D]">
                    {formatINR(t.totalSpend)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
