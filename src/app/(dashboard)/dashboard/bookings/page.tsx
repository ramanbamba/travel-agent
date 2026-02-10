"use client";

import { BookingsList } from "@/components/bookings/bookings-list";

export default function BookingsPage() {
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--glass-text-primary)] sm:text-4xl">
          Your Trips
        </h1>
        <p className="mt-1 text-sm text-[var(--glass-text-secondary)]">
          View and manage your flight bookings.
        </p>
      </div>
      <BookingsList />
    </div>
  );
}
