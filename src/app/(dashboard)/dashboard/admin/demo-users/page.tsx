"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Plane,
  TrendingUp,
  Loader2,
  LogIn,
  Sparkles,
  BookOpen,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface DemoRoute {
  route: string;
  timesBooked: number;
  familiarityLevel: string;
  preferredAirline: string | null;
  avgPrice: number | null;
}

interface DemoUser {
  id: string;
  email: string;
  name: string;
  tier: "cold_start" | "learning" | "autopilot";
  tierLabel: string;
  bookingCount: number;
  routes: DemoRoute[];
  demoPrompts: string[];
}

// ── Tier visual config ───────────────────────────────────────────────────────

const TIER_CONFIG = {
  cold_start: {
    icon: Sparkles,
    label: "Act 1: Cold Start",
    description: "Fresh user, just onboarded. Shows discovery mode — 3-5 options with natural exploration.",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-200 dark:border-purple-800/40",
    ring: "ring-purple-500/20",
  },
  learning: {
    icon: BookOpen,
    label: "Act 2: Learning",
    description: "3 bookings in. AI starts recognizing patterns — top 3 with recommendation first.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800/40",
    ring: "ring-amber-500/20",
  },
  autopilot: {
    icon: Zap,
    label: "Act 3: Autopilot",
    description: "10+ bookings. AI knows everything — one confident recommendation. \"The usual\" works.",
    color: "text-[var(--glass-accent-blue)]",
    bg: "bg-[var(--glass-accent-blue-light)]",
    border: "border-[var(--glass-accent-blue)]/30",
    ring: "ring-[var(--glass-accent-blue)]/20",
  },
};

// ── Familiarity bar ──────────────────────────────────────────────────────────

function FamiliarityBar({ level }: { level: string }) {
  const segments = ["discovery", "learning", "autopilot"];
  const idx = segments.indexOf(level);
  return (
    <div className="flex items-center gap-1">
      {segments.map((s, i) => (
        <div
          key={s}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors duration-300",
            i <= idx
              ? level === "autopilot"
                ? "bg-[var(--glass-accent-blue)]"
                : level === "learning"
                  ? "bg-amber-500"
                  : "bg-purple-500"
              : "bg-[var(--glass-border)]"
          )}
        />
      ))}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function DemoUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/demo-users");
        if (res.status === 403) {
          router.replace("/dashboard");
          return;
        }
        if (!res.ok) throw new Error("Failed to load");
        const json = await res.json();
        setUsers(json.data.users ?? []);
        setCurrentUserEmail(json.data.currentUserEmail ?? "");
      } catch (err) {
        console.error("Demo users error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const handleSwitch = async (email: string) => {
    if (switching) return;
    setSwitching(email);
    try {
      const res = await fetch("/api/admin/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        // Redirect to dashboard as the new user
        window.location.href = "/dashboard";
      } else {
        const json = await res.json();
        alert(json.message ?? "Failed to switch user");
      }
    } catch {
      alert("Network error. Try again.");
    } finally {
      setSwitching(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--glass-text-tertiary)]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--glass-text-tertiary)] transition-colors hover:bg-[var(--glass-subtle)] hover:text-[var(--glass-text-primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[var(--glass-text-primary)]">
              Demo Users
            </h1>
            <p className="text-xs text-[var(--glass-text-tertiary)]">
              Three-act preference evolution for YC demo
            </p>
          </div>
        </div>
      </div>

      {/* Current user indicator */}
      {currentUserEmail && (
        <div className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2",
          "bg-[var(--glass-accent-green-light)] border border-[var(--glass-accent-green)]/20",
          "text-sm text-[var(--glass-accent-green)]"
        )}>
          <User className="h-3.5 w-3.5" />
          Currently logged in as: <span className="font-medium">{currentUserEmail}</span>
        </div>
      )}

      {/* User cards */}
      <div className="space-y-4">
        {users.map((user) => {
          const config = TIER_CONFIG[user.tier];
          const TierIcon = config.icon;
          const isCurrentUser = user.email === currentUserEmail;

          return (
            <div
              key={user.id}
              className={cn(
                "rounded-[var(--glass-radius-card)] overflow-hidden",
                "bg-[var(--glass-subtle)]",
                "backdrop-blur-[24px] [backdrop-filter:blur(24px)_saturate(1.8)] [-webkit-backdrop-filter:blur(24px)_saturate(1.8)]",
                "border",
                isCurrentUser ? `${config.border} ring-2 ${config.ring}` : "border-[var(--glass-border)]",
                "transition-all duration-200"
              )}
            >
              {/* Card header */}
              <div className={cn("flex items-start justify-between p-5")}>
                <div className="flex items-start gap-4">
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", config.bg)}>
                    <TierIcon className={cn("h-5 w-5", config.color)} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-[var(--glass-text-primary)]">
                        {user.name}
                      </h2>
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", config.bg, config.color)}>
                        {config.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-[var(--glass-text-tertiary)]">
                      {user.email}
                    </p>
                    <p className="mt-2 max-w-md text-sm text-[var(--glass-text-secondary)]">
                      {config.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleSwitch(user.email)}
                  disabled={isCurrentUser || !!switching}
                  className={cn(
                    "flex items-center gap-2 rounded-[var(--glass-radius-button)] px-4 py-2",
                    "text-sm font-medium",
                    "transition-all duration-200",
                    isCurrentUser
                      ? "bg-[var(--glass-accent-green-light)] text-[var(--glass-accent-green)] cursor-default"
                      : "bg-[var(--glass-accent-blue)] text-white hover:opacity-90 active:scale-95"
                  )}
                >
                  {switching === user.email ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : isCurrentUser ? (
                    <>Active</>
                  ) : (
                    <>
                      <LogIn className="h-3.5 w-3.5" />
                      Login as
                    </>
                  )}
                </button>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-6 border-t border-[var(--glass-border)] px-5 py-3">
                <div className="flex items-center gap-1.5 text-sm">
                  <Plane className="h-3.5 w-3.5 text-[var(--glass-text-tertiary)]" />
                  <span className="font-medium text-[var(--glass-text-primary)]">
                    {user.bookingCount}
                  </span>
                  <span className="text-[var(--glass-text-tertiary)]">bookings</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <TrendingUp className="h-3.5 w-3.5 text-[var(--glass-text-tertiary)]" />
                  <span className="font-medium text-[var(--glass-text-primary)]">
                    {user.routes.length}
                  </span>
                  <span className="text-[var(--glass-text-tertiary)]">
                    route{user.routes.length !== 1 ? "s" : ""} learned
                  </span>
                </div>
              </div>

              {/* Routes */}
              {user.routes.length > 0 && (
                <div className="border-t border-[var(--glass-border)] px-5 py-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--glass-text-tertiary)]">
                    Route Intelligence
                  </p>
                  <div className="space-y-2">
                    {user.routes.map((route) => (
                      <div key={route.route} className="flex items-center gap-3">
                        <span className="w-20 text-sm font-medium text-[var(--glass-text-primary)]">
                          {route.route}
                        </span>
                        <div className="w-24">
                          <FamiliarityBar level={route.familiarityLevel} />
                        </div>
                        <span className="text-xs text-[var(--glass-text-tertiary)]">
                          {route.familiarityLevel} · {route.timesBooked}x
                        </span>
                        {route.preferredAirline && (
                          <span className="text-xs text-[var(--glass-text-secondary)]">
                            → {route.preferredAirline}
                          </span>
                        )}
                        {route.avgPrice && (
                          <span className="text-xs text-[var(--glass-text-tertiary)]">
                            ~₹{Math.round(route.avgPrice).toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Demo prompts */}
              <div className="border-t border-[var(--glass-border)] px-5 py-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--glass-text-tertiary)]">
                  Try these prompts
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {user.demoPrompts.map((prompt) => (
                    <span
                      key={prompt}
                      className={cn(
                        "rounded-full px-3 py-1",
                        "bg-[var(--glass-standard)] border border-[var(--glass-border)]",
                        "text-xs text-[var(--glass-text-secondary)]"
                      )}
                    >
                      &ldquo;{prompt}&rdquo;
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {users.length === 0 && (
        <div className={cn(
          "rounded-[var(--glass-radius-card)] p-8 text-center",
          "bg-[var(--glass-subtle)] border border-[var(--glass-border)]"
        )}>
          <p className="text-sm text-[var(--glass-text-tertiary)]">
            No demo users found. Run <code className="rounded bg-[var(--glass-standard)] px-1.5 py-0.5 font-mono text-xs">npm run seed:demo</code> to create them.
          </p>
        </div>
      )}
    </div>
  );
}
