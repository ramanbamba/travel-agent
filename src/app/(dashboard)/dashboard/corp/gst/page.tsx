"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Receipt,
  Download,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import { PageHeader, StatCard, EmptyState } from "@/components/corporate-dashboard";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GstData = any;

function formatINR(amount: number): string {
  if (amount >= 10000000) return `\u20B9${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `\u20B9${(amount / 100000).toFixed(1)}L`;
  return `\u20B9${Math.round(amount).toLocaleString("en-IN")}`;
}

function getCurrentQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${q}`;
}

export default function GstPage() {
  const [data, setData] = useState<GstData | null>(null);
  const [loading, setLoading] = useState(true);
  const [quarter, setQuarter] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ org_id: "current" });
      if (quarter) params.set("quarter", quarter);
      const res = await fetch(`/api/corp/gst?${params}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setData(json.data);
    } catch (err) {
      console.error("GST load error:", err);
    } finally {
      setLoading(false);
    }
  }, [quarter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleExport(format: "tally" | "zoho") {
    const params = new URLSearchParams({ org_id: "current", format });
    if (quarter) params.set("quarter", quarter);
    window.open(`/api/corp/gst?${params}`, "_blank");
  }

  // Generate quarter options (last 8 quarters)
  const quarterOptions: string[] = [];
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i * 3, 1);
    const q = Math.ceil((d.getMonth() + 1) / 3);
    const key = `${d.getFullYear()}-Q${q}`;
    if (!quarterOptions.includes(key)) quarterOptions.push(key);
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data) {
    return <EmptyState icon={Receipt} message="Failed to load GST data" />;
  }

  const { invoices, kpi } = data;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="GST & Invoices"
        description="Track input tax credits and download invoices"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => handleExport("tally")}
              disabled={invoices.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Tally CSV
            </button>
            <button
              onClick={() => handleExport("zoho")}
              disabled={invoices.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Zoho CSV
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total GST Paid"
          value={formatINR(kpi.totalGst)}
          icon={Receipt}
        />
        <StatCard
          label="ITC Eligible"
          value={formatINR(kpi.itcEligible)}
          icon={FileSpreadsheet}
        />
        <StatCard
          label="ITC Claimed"
          value={formatINR(kpi.itcClaimed)}
          icon={FileSpreadsheet}
        />
        <StatCard
          label="ITC Unclaimed"
          value={formatINR(kpi.itcUnclaimed)}
          icon={FileSpreadsheet}
          className={kpi.itcUnclaimed > 0 ? "border-yellow-300 bg-yellow-50" : ""}
        />
      </div>

      {/* Quarter Filter */}
      <div className="flex items-center gap-3">
        <select
          value={quarter}
          onChange={(e) => setQuarter(e.target.value)}
          className="h-8 rounded-lg border border-gray-200 bg-white px-3 text-xs focus:border-blue-300 focus:outline-none"
        >
          <option value="">All Time</option>
          {quarterOptions.map((q) => (
            <option key={q} value={q}>
              {q} {q === getCurrentQuarter() ? "(Current)" : ""}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-500">{invoices.length} invoices</span>
      </div>

      {/* Invoice Table */}
      {invoices.length === 0 ? (
        <EmptyState icon={Receipt} message="No GST invoices yet. Invoices are auto-generated when bookings are made." />
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Date</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Vendor</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Base Amt</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">CGST</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">SGST</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">IGST</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Total GST</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Total</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">ITC</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">SAC</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: GstData) => (
                  <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {new Date(inv.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {inv.vendor_name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {formatINR(inv.base_amount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {inv.cgst_amount > 0 ? formatINR(inv.cgst_amount) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {inv.sgst_amount > 0 ? formatINR(inv.sgst_amount) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {inv.igst_amount > 0 ? formatINR(inv.igst_amount) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-[#0F1B2D]">
                      {formatINR(inv.total_gst)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-[#0F1B2D]">
                      {formatINR(inv.total_amount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        inv.itc_eligible
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {inv.itc_eligible ? "Eligible" : "N/A"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                      {inv.sac_code}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
