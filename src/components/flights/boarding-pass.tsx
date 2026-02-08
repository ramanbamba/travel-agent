"use client";

import { Plane, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import type { BookingConfirmation } from "@/types/flights";

interface BoardingPassProps {
  confirmation: BookingConfirmation;
  trigger: React.ReactNode;
}

function MockBarcode() {
  // Simple barcode-like SVG
  const bars = [];
  for (let i = 0; i < 40; i++) {
    const w = Math.random() > 0.5 ? 2 : 1;
    bars.push(
      <rect key={i} x={i * 3} y="0" width={w} height="40" fill="white" />
    );
  }
  return (
    <svg width="120" height="40" viewBox="0 0 120 40" className="opacity-60">
      {bars}
    </svg>
  );
}

export function BoardingPass({ confirmation, trigger }: BoardingPassProps) {
  const segment = confirmation.flight.segments[0];
  const departureDate = new Date(segment.departure.time);

  function handleAppleWallet() {
    toast({
      title: "Coming soon",
      description:
        "Apple Wallet integration requires airline API access. Stay tuned!",
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md border-white/10 bg-background p-0 sm:rounded-2xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-center">Boarding Pass</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          {/* Boarding pass card */}
          <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02]">
            {/* Top: Airline + flight */}
            <div className="flex items-center justify-between border-b border-dashed border-white/10 px-5 py-3">
              <div className="flex items-center gap-2">
                <Plane className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {segment.airline} {segment.flightNumber}
                </span>
              </div>
              <span className="text-xs text-muted-foreground uppercase">
                {segment.cabin}
              </span>
            </div>

            {/* Route */}
            <div className="flex items-center justify-between px-5 py-5">
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {segment.departure.airportCode}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {departureDate.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex flex-1 items-center justify-center px-4">
                <div className="h-px flex-1 bg-white/10" />
                <Plane className="mx-2 h-4 w-4 text-muted-foreground" />
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {segment.arrival.airportCode}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(segment.arrival.time).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-3 gap-px border-t border-white/10 bg-white/5">
              <div className="bg-background px-4 py-3">
                <p className="text-[10px] uppercase text-muted-foreground">
                  Date
                </p>
                <p className="mt-0.5 text-sm font-medium">
                  {departureDate.toLocaleDateString("en-US", {
                    day: "2-digit",
                    month: "short",
                  })}
                </p>
              </div>
              <div className="bg-background px-4 py-3">
                <p className="text-[10px] uppercase text-muted-foreground">
                  Gate
                </p>
                <p className="mt-0.5 text-sm font-medium">B42</p>
              </div>
              <div className="bg-background px-4 py-3">
                <p className="text-[10px] uppercase text-muted-foreground">
                  Seat
                </p>
                <p className="mt-0.5 text-sm font-medium">14A</p>
              </div>
            </div>

            {/* Passenger + PNR */}
            <div className="border-t border-dashed border-white/10 px-5 py-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">
                    Passenger
                  </p>
                  <p className="mt-0.5 text-sm font-medium">
                    {confirmation.passenger.firstName}{" "}
                    {confirmation.passenger.lastName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase text-muted-foreground">
                    Confirmation
                  </p>
                  <p className="mt-0.5 font-mono text-sm font-bold tracking-wider">
                    {confirmation.confirmationCode}
                  </p>
                </div>
              </div>
            </div>

            {/* Barcode */}
            <div className="flex items-center justify-center border-t border-white/10 bg-white/[0.03] py-4">
              <MockBarcode />
            </div>
          </div>

          {/* Apple Wallet button */}
          <Button
            variant="outline"
            className="mt-4 w-full gap-2 border-white/10"
            onClick={handleAppleWallet}
          >
            <Smartphone className="h-4 w-4" />
            Add to Apple Wallet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
