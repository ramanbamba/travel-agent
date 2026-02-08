"use client";

import { BookingsList } from "@/components/bookings/bookings-list";

export default function BookingsPage() {
  return (
    <div className="animate-in fade-in duration-300 p-6">
      <h1 className="text-2xl font-semibold">My Bookings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        View and manage your flight bookings.
      </p>
      <div className="mt-6">
        <BookingsList />
      </div>
    </div>
  );
}
