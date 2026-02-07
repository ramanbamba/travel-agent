"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    const existing = JSON.parse(localStorage.getItem("waitlist") || "[]");
    if (!existing.includes(email)) {
      existing.push(email);
      localStorage.setItem("waitlist", JSON.stringify(existing));
    }

    setSubmitted(true);
    setEmail("");
  }

  if (submitted) {
    return (
      <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center justify-center gap-2 text-emerald-400">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span className="font-medium">You&apos;re on the list</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ll reach out when your spot opens up.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
      <Input
        type="email"
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="h-12 flex-1 border-white/10 bg-white/5 text-base placeholder:text-muted-foreground/50 focus-visible:ring-white/20"
      />
      <Button type="submit" size="lg" className="h-12 px-8 text-base">
        Join Waitlist
      </Button>
    </form>
  );
}
