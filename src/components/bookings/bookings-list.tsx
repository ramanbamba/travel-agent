"use client";

import { useEffect, useState } from "react";
import { Plane } from "lucide-react";
import { BookingCard } from "./booking-card";
import type { BookingWithSegments } from "@/types";

function BookingSkeleton() {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 animate-pulse rounded-lg bg-white/5" />
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-white/5" />
            <div className="h-3 w-48 animate-pulse rounded bg-white/5" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 animate-pulse rounded-full bg-white/5" />
          <div className="h-4 w-12 animate-pulse rounded bg-white/5" />
        </div>
      </div>
    </div>
  );
}

export function BookingsList() {
  const [bookings, setBookings] = useState<BookingWithSegments[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBookings() {
      try {
        const res = await fetch("/api/bookings");
        if (!res.ok) {
          setError("Failed to load bookings");
          return;
        }
        const json = await res.json();
        if (json.error) {
          setError(json.message ?? "Failed to load bookings");
          return;
        }
        setBookings(json.data ?? []);
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchBookings();
  }, []);

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
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
          <Plane className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 font-medium">No bookings yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Book your first flight from the chat to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <BookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  );
}
