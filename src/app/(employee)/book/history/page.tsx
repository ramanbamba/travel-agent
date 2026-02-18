"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plane,
  Loader2,
  ChevronDown,
  Download,
  Calendar,
} from "lucide-react";
import { StatusBadge, EmptyState } from "@/components/corporate-dashboard";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Booking = any;

function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export default function BookingHistoryPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    try {
      const params = new URLSearchParams({ scope: "mine" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/corp/employee/bookings?${params}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setBookings(json.data ?? []);
    } catch (err) {
      console.error("Load bookings error:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Categorize bookings
  const now = new Date();
  const upcoming = bookings.filter(
    (b: Booking) =>
      b.departure_date &&
      new Date(b.departure_date) >= now &&
      !["cancelled", "rejected"].includes(b.status)
  );
  const past = bookings.filter(
    (b: Booking) =>
      !b.departure_date ||
      new Date(b.departure_date) < now ||
      ["cancelled", "rejected"].includes(b.status)
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl overflow-y-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#0F1B2D]">My Trips</h1>
        <p className="text-sm text-gray-500">{bookings.length} total bookings</p>
      </div>

      {/* Filter */}
      <div className="mb-4 flex gap-2">
        {["", "booked", "pending_approval", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === s
                ? "bg-blue-50 text-blue-600 border border-blue-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s === "" ? "All" : s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          icon={Plane}
          message="No trips yet. Book your first flight!"
          cta={{ label: "Book a Flight", onClick: () => (window.location.href = "/book") }}
        />
      ) : (
        <div className="space-y-6">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Upcoming
              </h2>
              <div className="space-y-2">
                {upcoming.map((b: Booking) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    expanded={expandedId === b.id}
                    onToggle={() =>
                      setExpandedId((prev) => (prev === b.id ? null : b.id))
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Past & Cancelled
              </h2>
              <div className="space-y-2">
                {past.map((b: Booking) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    expanded={expandedId === b.id}
                    onToggle={() =>
                      setExpandedId((prev) => (prev === b.id ? null : b.id))
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BookingCard({
  booking,
  expanded,
  onToggle,
}: {
  booking: Booking;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
            <Plane className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0F1B2D]">
              {booking.origin} → {booking.destination}
            </p>
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              {booking.departure_date
                ? new Date(booking.departure_date).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })
                : "—"}
              {booking.airline_name && ` · ${booking.airline_name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold text-[#0F1B2D]">
              {formatINR(booking.total_amount ?? 0)}
            </p>
            <StatusBadge status={booking.status} />
          </div>
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">PNR</span>
              <p className="font-mono font-semibold text-[#0F1B2D]">
                {booking.pnr ?? "Pending"}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Cabin</span>
              <p className="font-medium text-[#0F1B2D] capitalize">
                {(booking.cabin_class ?? "economy").replace(/_/g, " ")}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Channel</span>
              <p className="font-medium text-[#0F1B2D] capitalize">
                {(booking.booking_channel ?? "web").replace(/_/g, " ")}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Policy</span>
              <p className="font-medium">
                {booking.policy_compliant ? "✅ Compliant" : "⚠️ Non-Compliant"}
              </p>
            </div>
          </div>

          {booking.purpose && (
            <div className="text-sm">
              <span className="text-gray-500">Purpose</span>
              <p className="font-medium text-[#0F1B2D]">{booking.purpose}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Download className="h-3 w-3" />
              E-Ticket
            </button>
            <button className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Download className="h-3 w-3" />
              GST Invoice
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
