"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plane,
  Loader2,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { PageHeader, StatusBadge, EmptyState } from "@/components/corporate-dashboard";
import { exportBookingsCsv } from "@/lib/gst/export";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Booking = any;

const POLICY_ICON: Record<string, string> = {
  true: "\u2705",
  false: "\u26A0\uFE0F",
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [approvals, setApprovals] = useState<Record<string, Booking[]>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [complianceFilter, setComplianceFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<Booking | null>(null);
  const pageSize = 20;

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
      if (statusFilter) params.set("status", statusFilter);
      if (complianceFilter) params.set("policy_compliant", complianceFilter);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);

      const res = await fetch(`/api/corp/bookings?${params}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setBookings(json.data?.bookings ?? []);
      setApprovals(json.data?.approvals ?? {});
      setTotal(json.data?.total ?? 0);
    } catch (err) {
      console.error("Load bookings error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, complianceFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  function handleExportCsv() {
    const csv = exportBookingsCsv(
      bookings.map((b: Booking) => ({
        pnr: b.pnr,
        member_name: b.member_name,
        origin: b.origin,
        destination: b.destination,
        departure_date: b.departure_date,
        airline_name: b.airline_name,
        total_amount: b.total_amount,
        currency: b.currency ?? "INR",
        status: b.status,
        booking_channel: b.booking_channel ?? "web",
        policy_compliant: b.policy_compliant,
        created_at: b.created_at,
      }))
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bookings-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Bookings"
        description={`${total} total bookings`}
        actions={
          <button
            onClick={handleExportCsv}
            disabled={bookings.length === 0}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Filter className="h-3.5 w-3.5" />
          Filters:
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs focus:border-blue-300 focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="booked">Booked</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={complianceFilter}
          onChange={(e) => { setComplianceFilter(e.target.value); setPage(0); }}
          className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs focus:border-blue-300 focus:outline-none"
        >
          <option value="">All Compliance</option>
          <option value="true">Compliant</option>
          <option value="false">Non-Compliant</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
          className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs focus:border-blue-300 focus:outline-none"
          placeholder="From"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
          className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs focus:border-blue-300 focus:outline-none"
          placeholder="To"
        />
        {(statusFilter || complianceFilter || dateFrom || dateTo) && (
          <button
            onClick={() => { setStatusFilter(""); setComplianceFilter(""); setDateFrom(""); setDateTo(""); setPage(0); }}
            className="text-xs text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState icon={Plane} message="No bookings found matching your filters." />
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Date</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Traveler</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Route</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Airline</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Amount</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Status</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Policy</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Channel</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b: Booking) => (
                  <tr
                    key={b.id}
                    onClick={() => setSelected(b)}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {b.departure_date
                        ? new Date(b.departure_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-[#0F1B2D]">
                      {b.member_name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {b.origin} → {b.destination}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {b.airline_name ?? b.airline_code ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-[#0F1B2D]">
                      ₹{Math.round(b.total_amount ?? 0).toLocaleString("en-IN")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      {POLICY_ICON[String(b.policy_compliant ?? true)]}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 capitalize">
                        {(b.booking_channel ?? "web").replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
              <p className="text-xs text-gray-500">
                Page {page + 1} of {totalPages} ({total} bookings)
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Booking Detail Slide-over */}
      {selected && (
        <BookingDetail
          booking={selected}
          approvalHistory={approvals[selected.id] ?? []}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function BookingDetail({
  booking,
  approvalHistory,
  onClose,
}: {
  booking: Booking;
  approvalHistory: Booking[];
  onClose: () => void;
}) {
  const violations = booking.policy_violations ?? [];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-xl border-l border-gray-200 overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-[#0F1B2D]">Booking Details</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Flight Details */}
          <Section title="Flight">
            <InfoRow label="Route" value={`${booking.origin} → ${booking.destination}`} />
            <InfoRow label="Date" value={booking.departure_date} />
            <InfoRow label="Airline" value={booking.airline_name ?? booking.airline_code ?? "—"} />
            <InfoRow label="Cabin" value={booking.cabin_class ?? "economy"} />
            <InfoRow label="PNR" value={booking.pnr ?? "—"} />
            <InfoRow label="Channel" value={(booking.booking_channel ?? "web").replace(/_/g, " ")} />
          </Section>

          {/* Status */}
          <Section title="Status">
            <div className="flex items-center gap-2">
              <StatusBadge status={booking.status} />
              {booking.approval_status && (
                <StatusBadge status={booking.approval_status} />
              )}
            </div>
          </Section>

          {/* Payment */}
          <Section title="Payment">
            <InfoRow label="Amount" value={`₹${Math.round(booking.total_amount ?? 0).toLocaleString("en-IN")}`} />
            <InfoRow label="Currency" value={booking.currency ?? "INR"} />
            {booking.duffel_order_id && (
              <InfoRow label="Duffel Order" value={booking.duffel_order_id} />
            )}
          </Section>

          {/* Policy Compliance */}
          <Section title="Policy Compliance">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">
                {booking.policy_compliant ? "\u2705 Compliant" : "\u26A0\uFE0F Non-Compliant"}
              </span>
            </div>
            {violations.length > 0 && (
              <div className="space-y-1">
                {violations.map((v: Booking, i: number) => (
                  <div key={i} className="rounded bg-red-50 px-3 py-1.5 text-xs text-red-700">
                    {v.message ?? v.rule ?? String(v)}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Approval History */}
          {approvalHistory.length > 0 && (
            <Section title="Approval History">
              {approvalHistory.map((a: Booking) => (
                <div key={a.id} className="rounded border border-gray-200 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={a.status} />
                    <span className="text-xs text-gray-400">
                      {a.responded_at
                        ? new Date(a.responded_at).toLocaleDateString("en-IN")
                        : "Pending"}
                    </span>
                  </div>
                  {a.message && <p className="mt-1 text-xs text-gray-600">{a.message}</p>}
                  {a.response_message && (
                    <p className="mt-1 text-xs text-gray-500">Response: {a.response_message}</p>
                  )}
                </div>
              ))}
            </Section>
          )}

          {/* Purpose */}
          {(booking.purpose || booking.purpose_note) && (
            <Section title="Trip Purpose">
              {booking.purpose && <InfoRow label="Purpose" value={booking.purpose} />}
              {booking.purpose_note && <InfoRow label="Note" value={booking.purpose_note} />}
              {booking.project_code && <InfoRow label="Project" value={booking.project_code} />}
              {booking.cost_center && <InfoRow label="Cost Center" value={booking.cost_center} />}
            </Section>
          )}
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-[#0F1B2D] capitalize">{value}</span>
    </div>
  );
}
