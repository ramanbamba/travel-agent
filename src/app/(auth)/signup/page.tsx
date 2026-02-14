"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref")?.toUpperCase().trim() ?? null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [referrerName, setReferrerName] = useState<string | null>(null);

  // Validate referral code on mount
  useEffect(() => {
    if (!refCode) return;
    async function validate() {
      try {
        const res = await fetch(`/api/referrals/validate?code=${refCode}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data?.valid) {
            setReferrerName(json.data.referrerName ?? null);
          }
        }
      } catch {
        // Non-critical
      }
    }
    validate();
  }, [refCode]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // If email confirmation is disabled, a session is returned immediately
    if (data.session && data.user) {
      // Apply referral if present
      if (refCode) {
        try {
          await fetch("/api/referrals/apply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ referralCode: refCode }),
          });
        } catch {
          // Non-critical
        }
      }
      router.push("/dashboard/onboarding");
      return;
    }

    // No session means email confirmation is required
    // Store referral code in cookie for the auth callback to pick up
    if (refCode) {
      document.cookie = `referral_code=${refCode};path=/;max-age=${60 * 60 * 24 * 30};samesite=lax`;
    }
    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="animate-fade-in rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl shadow-black/20 backdrop-blur-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgb(52 211 153)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;ve sent a confirmation link to{" "}
            <span className="text-foreground">{email}</span>. Click the link to
            activate your account.
          </p>
          <Link href="/login">
            <Button variant="ghost" className="mt-6">
              Back to sign in
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl shadow-black/20 backdrop-blur-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Get started with Skyswift in seconds
        </p>
      </div>

      {/* Referral badge */}
      {refCode && (
        <div className="mb-5 flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(52 211 153)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26z" />
          </svg>
          <span className="text-sm text-emerald-400">
            {referrerName
              ? `${referrerName} invited you — zero service fees on your first booking!`
              : "You've been referred — zero service fees on your first booking!"}
          </span>
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border-white/10 bg-white/[0.03] placeholder:text-muted-foreground/50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="border-white/10 bg-white/[0.03] placeholder:text-muted-foreground/50"
          />
          <p className="text-xs text-muted-foreground/60">
            Must be at least 6 characters
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
