"use client";

import { FlaskConical, Radio } from "lucide-react";

export function SandboxBanner() {
  const mode = process.env.NEXT_PUBLIC_APP_MODE;

  if (mode === "live") {
    return (
      <div className="flex items-center justify-center gap-2 bg-[var(--glass-accent-green)]/90 px-3 py-1.5 text-center text-xs font-medium text-white backdrop-blur-sm">
        <Radio className="h-3.5 w-3.5" />
        <span>Live Mode — Real bookings & payments</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 bg-amber-500/90 px-3 py-1.5 text-center text-xs font-medium text-white backdrop-blur-sm">
      <FlaskConical className="h-3.5 w-3.5" />
      <span>Sandbox Mode — No real bookings</span>
    </div>
  );
}
