"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plane, MessageCircle, LayoutDashboard, Lock, Loader2, ArrowRight, Monitor, Shield } from "lucide-react";

export default function DemoLandingPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [unlocked, setUnlocked] = useState(() => {
    if (typeof window !== "undefined") {
      return !!sessionStorage.getItem("demo_token");
    }
    return false;
  });
  const router = useRouter();

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;

    setVerifying(true);
    setError("");

    try {
      const res = await fetch("/api/demo/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      const json = await res.json();
      if (json.data?.token) {
        sessionStorage.setItem("demo_token", json.data.token);
        setUnlocked(true);
      } else {
        setError("Invalid password. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30">
              <Plane className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">SkySwift</h1>
            <p className="mt-1 text-sm text-blue-200/70">Corporate Travel Platform Demo</p>
          </div>

          {/* Password Form */}
          <form onSubmit={handleUnlock} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2 text-sm text-blue-200/80">
              <Lock className="h-4 w-4" />
              Enter the demo password to continue
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className="mb-3 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/30 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            {error && <p className="mb-3 text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={verifying || !password.trim()}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enter Demo"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
      <div className="mx-auto max-w-4xl py-12 md:py-20">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30">
            <Plane className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white md:text-4xl">
            SkySwift Demo
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-base text-blue-200/70">
            47 clicks → 1 message. See how SkySwift transforms corporate travel
            booking with AI-powered WhatsApp automation.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="mb-12 flex justify-center gap-8 md:gap-16">
          {[
            { label: "Booking Time", value: "30 sec", sub: "vs 18 min" },
            { label: "Policy Compliance", value: "98%", sub: "auto-enforced" },
            { label: "GST Recovery", value: "100%", sub: "automated ITC" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-white md:text-3xl">{stat.value}</p>
              <p className="text-xs text-blue-200/50">{stat.sub}</p>
              <p className="mt-1 text-xs font-medium text-blue-300/70">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Demo Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <DemoCard
            icon={<MessageCircle className="h-6 w-6" />}
            title="WhatsApp Demo"
            description="Experience the booking flow as Anita Sharma (IC employee) — search, select, policy check, and book in chat."
            accent="green"
            tag="Start here"
            onClick={() => router.push("/demo/whatsapp")}
          />
          <DemoCard
            icon={<Monitor className="h-6 w-6" />}
            title="Cross-Platform Demo"
            description="See SkySwift on WhatsApp, Slack, and Microsoft Teams — same AI, three platforms. Includes auto-play."
            accent="purple"
            tag="New"
            onClick={() => router.push("/demo/channels")}
          />
          <DemoCard
            icon={<LayoutDashboard className="h-6 w-6" />}
            title="Admin Dashboard"
            description="See Priya Singh's travel manager command center — 60 bookings, policy config, analytics, GST compliance."
            accent="blue"
            onClick={() => router.push("/dashboard/corp")}
          />
          <DemoCard
            icon={<Shield className="h-6 w-6" />}
            title="Policy in Action"
            description="Watch policy enforcement live — try booking business class and see the approval flow in action."
            accent="green"
            onClick={() => router.push("/demo/whatsapp")}
          />
        </div>

        {/* Architecture Note */}
        <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h3 className="mb-3 text-sm font-semibold text-white">How it works</h3>
          <div className="grid gap-4 text-sm text-blue-200/60 md:grid-cols-4">
            <div>
              <p className="mb-1 font-medium text-blue-300">1. Employee messages</p>
              <p>WhatsApp or web chat — natural language, no training needed</p>
            </div>
            <div>
              <p className="mb-1 font-medium text-blue-300">2. AI parses intent</p>
              <p>Gemini extracts route, dates, cabin — asks clarifying questions</p>
            </div>
            <div>
              <p className="mb-1 font-medium text-blue-300">3. Policy check</p>
              <p>Real-time evaluation against company rules, auto-flag violations</p>
            </div>
            <div>
              <p className="mb-1 font-medium text-blue-300">4. Book or approve</p>
              <p>Compliant → instant PNR. Out-of-policy → manager approval flow</p>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-blue-200/30">
          SkySwift — Zero-Friction Corporate Travel
        </p>
      </div>
    </div>
  );
}

function DemoCard({
  icon,
  title,
  description,
  accent,
  tag,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: "green" | "blue" | "purple";
  tag?: string;
  onClick: () => void;
}) {
  const colors = {
    green: "from-green-500/20 to-green-600/5 border-green-500/20 hover:border-green-400/40",
    blue: "from-blue-500/20 to-blue-600/5 border-blue-500/20 hover:border-blue-400/40",
    purple: "from-purple-500/20 to-purple-600/5 border-purple-500/20 hover:border-purple-400/40",
  };
  const iconColors = {
    green: "text-green-400",
    blue: "text-blue-400",
    purple: "text-purple-400",
  };

  return (
    <button
      onClick={onClick}
      className={`group relative rounded-2xl border bg-gradient-to-b p-6 text-left transition-all hover:scale-[1.02] ${colors[accent]}`}
    >
      {tag && (
        <span className="absolute -top-2.5 right-4 rounded-full bg-green-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          {tag}
        </span>
      )}
      <div className={`mb-3 ${iconColors[accent]}`}>{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="mb-4 text-sm text-blue-200/60">{description}</p>
      <div className={`flex items-center gap-1 text-sm font-medium ${iconColors[accent]}`}>
        Launch <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </button>
  );
}
