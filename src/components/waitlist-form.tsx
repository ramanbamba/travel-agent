"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    const existing = JSON.parse(localStorage.getItem("waitlist") || "[]");
    if (!existing.includes(email)) {
      existing.push(email);
      localStorage.setItem("waitlist", JSON.stringify(existing));
    }

    router.push("/signup");
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
