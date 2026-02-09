"use client";

import { useEffect, useState } from "react";
import { Plane } from "lucide-react";
import { BookingCard } from "./booking-card";
import { toast } from "@/hooks/use-toast";
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
  const [passengerName, setPassengerName] = useState<string>("");
  const [passengerEmail, setPassengerEmail] = useState<string>("");

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
          // Get email from auth user if available
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

      // Update local state
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
          Start by telling me where you want to fly!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          passengerName={passengerName}
          passengerEmail={passengerEmail}
          onCancel={handleCancel}
        />
      ))}
    </div>
  );
}
