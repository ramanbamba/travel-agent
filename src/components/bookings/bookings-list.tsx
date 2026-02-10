"use client";

import { useEffect, useState, useMemo } from "react";
import { Plane } from "lucide-react";
import Link from "next/link";
import { BookingCard } from "./booking-card";
import { GlassCard, GlassButton } from "@/components/ui/glass";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { BookingWithSegments } from "@/types";

type Tab = "upcoming" | "past" | "cancelled";

function BookingSkeleton() {
  return (
    <GlassCard tier="subtle" hover={false} padding="md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-[var(--glass-subtle)]" />
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded-lg bg-[var(--glass-subtle)]" />
            <div className="h-3 w-48 animate-pulse rounded-lg bg-[var(--glass-subtle)]" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 animate-pulse rounded-full bg-[var(--glass-subtle)]" />
        </div>
      </div>
    </GlassCard>
  );
}

function SegmentedControl({
  value,
  onChange,
  counts,
}: {
  value: Tab;
  onChange: (tab: Tab) => void;
  counts: Record<Tab, number>;
}) {
  const tabs: { key: Tab; label: string }[] = [
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <div
      className="inline-flex rounded-[var(--glass-radius-pill)] border border-[var(--glass-border)] bg-[var(--glass-subtle)] p-1"
      role="tablist"
      aria-label="Filter bookings"
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={value === tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            "relative rounded-[var(--glass-radius-pill)] px-4 py-1.5 text-sm font-medium transition-all duration-200 ease-spring",
            value === tab.key
              ? "bg-[var(--glass-elevated)] text-[var(--glass-text-primary)] shadow-[var(--glass-shadow-sm)]"
              : "text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-secondary)]"
          )}
        >
          {tab.label}
          {counts[tab.key] > 0 && (
            <span className="ml-1.5 text-xs opacity-60">
              {counts[tab.key]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function BookingsList() {
  const [bookings, setBookings] = useState<BookingWithSegments[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passengerName, setPassengerName] = useState<string>("");
  const [passengerEmail, setPassengerEmail] = useState<string>("");
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");

  useEffect(() => {
    async function fetchData() {
      try {
        const [bookingsRes, profileRes] = await Promise.all([
          fetch("/api/bookings"),
          fetch("/api/profile"),
        ]);

        if (!bookingsRes.ok) {
          setError("Failed to load bookings");
          return;
        }
        const bookingsJson = await bookingsRes.json();
        if (bookingsJson.error) {
          setError(bookingsJson.message ?? "Failed to load bookings");
          return;
        }
        setBookings(bookingsJson.data ?? []);

        if (profileRes.ok) {
          const profileJson = await profileRes.json();
          const profile = profileJson.data?.profile;
          if (profile) {
            const name = [profile.first_name, profile.middle_name, profile.last_name]
              .filter(Boolean)
              .join(" ");
            setPassengerName(name);
          }
          const email = profileJson.data?.email;
          if (email) {
            setPassengerEmail(email);
          }
        }
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const { upcoming, past, cancelled, counts } = useMemo(() => {
    const now = new Date();
    const up: BookingWithSegments[] = [];
    const pa: BookingWithSegments[] = [];
    const ca: BookingWithSegments[] = [];

    for (const b of bookings) {
      if (b.status === "cancelled") {
        ca.push(b);
      } else {
        const firstSeg = b.flight_segments[0];
        const depTime = firstSeg ? new Date(firstSeg.departure_time) : null;
        if (depTime && depTime > now) {
          up.push(b);
        } else {
          pa.push(b);
        }
      }
    }

    return {
      upcoming: up,
      past: pa,
      cancelled: ca,
      counts: {
        upcoming: up.length,
        past: pa.length,
        cancelled: ca.length,
      } as Record<Tab, number>,
    };
  }, [bookings]);

  const filtered = activeTab === "upcoming" ? upcoming : activeTab === "past" ? past : cancelled;

  async function handleCancel(bookingId: string) {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
      });
      const json = await res.json();

      if (!res.ok) {
        toast({
          title: "Cancel failed",
          description: json.message ?? "Could not cancel booking",
          variant: "destructive",
        });
        return;
      }

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                status: "cancelled",
                cancelled_at: new Date().toISOString(),
                payment_status: json.data?.payment_status ?? b.payment_status,
              }
            : b
        )
      );

      toast({
        title: "Booking cancelled",
        description: json.data?.payment_status === "refunded"
          ? "Your booking has been cancelled and a refund has been issued."
          : "Your booking has been cancelled.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <BookingSkeleton />
        <BookingSkeleton />
        <BookingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-[var(--glass-accent-red)]">{error}</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <GlassCard tier="subtle" hover={false} padding="lg" className="max-w-xs">
          <div className="flex flex-col items-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--glass-accent-blue-light)]">
              <Plane className="h-8 w-8 text-[var(--glass-accent-blue)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--glass-text-primary)]">
              No trips yet
            </h3>
            <p className="mt-1 text-sm text-[var(--glass-text-secondary)]">
              Your booked flights will appear here.
            </p>
            <Link href="/dashboard" className="mt-4">
              <GlassButton variant="primary" size="md">
                Book your first flight
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ml-1"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </GlassButton>
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <SegmentedControl
          value={activeTab}
          onChange={setActiveTab}
          counts={counts}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-[var(--glass-text-tertiary)]">
            No {activeTab} trips.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              passengerName={passengerName}
              passengerEmail={passengerEmail}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
