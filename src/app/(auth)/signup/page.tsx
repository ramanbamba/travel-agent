"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
    if (data.session) {
      router.push("/dashboard/onboarding");
      return;
    }

    // No session means email confirmation is required
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
