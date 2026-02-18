"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Types ──

interface CompanyDetails {
  companyName: string;
  workEmail: string;
  phone: string;
  industry: string;
  employeeCount: string;
}

interface AdminProfile {
  fullName: string;
  designation: string;
  password: string;
}

interface TravelBasics {
  gstin: string;
  primaryRoutes: string[];
  monthlyVolume: string;
}

type SignupStep = 1 | 2 | 3 | 4;

// ── Constants ──

const INDUSTRIES = [
  { value: "it_services", label: "IT Services & SaaS" },
  { value: "bfsi", label: "Banking, Finance & Insurance" },
  { value: "consulting", label: "Consulting" },
  { value: "pharma", label: "Pharma & Healthcare" },
  { value: "startup", label: "Startup" },
  { value: "other", label: "Other" },
];

const EMPLOYEE_COUNTS = [
  { value: "1-50", label: "1-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "501-2000", label: "501-2000 employees" },
  { value: "2000+", label: "2000+ employees" },
];

const POPULAR_ROUTES = [
  "BLR-DEL",
  "BOM-DEL",
  "BLR-BOM",
  "DEL-HYD",
  "BLR-HYD",
  "BOM-BLR",
  "DEL-BLR",
  "BLR-CCU",
  "DEL-BOM",
  "HYD-DEL",
  "BOM-HYD",
  "DEL-CCU",
];

const MONTHLY_VOLUMES = [
  { value: "1-10", label: "1-10 bookings" },
  { value: "11-50", label: "11-50 bookings" },
  { value: "51-200", label: "51-200 bookings" },
  { value: "200+", label: "200+ bookings" },
];

export default function SignupPage() {
  return (
    <Suspense>
      <CompanySignupWizard />
    </Suspense>
  );
}

function CompanySignupWizard() {
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [company, setCompany] = useState<CompanyDetails>({
    companyName: "",
    workEmail: "",
    phone: "",
    industry: "",
    employeeCount: "",
  });

  const [admin, setAdmin] = useState<AdminProfile>({
    fullName: "",
    designation: "",
    password: "",
  });

  const [travel, setTravel] = useState<TravelBasics>({
    gstin: "",
    primaryRoutes: [],
    monthlyVolume: "",
  });

  function handleNext() {
    setError(null);
    if (step === 1) {
      if (!company.companyName || !company.workEmail || !company.industry || !company.employeeCount) {
        setError("Please fill in all required fields");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(company.workEmail)) {
        setError("Please enter a valid email address");
        return;
      }
    }
    if (step === 2) {
      if (!admin.fullName || !admin.designation || !admin.password) {
        setError("Please fill in all required fields");
        return;
      }
      if (admin.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 4) as SignupStep);
  }

  function handleBack() {
    setError(null);
    setStep((s) => Math.max(s - 1, 1) as SignupStep);
  }

  function toggleRoute(route: string) {
    setTravel((prev) => ({
      ...prev,
      primaryRoutes: prev.primaryRoutes.includes(route)
        ? prev.primaryRoutes.filter((r) => r !== route)
        : [...prev.primaryRoutes, route],
    }));
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      // 1. Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: company.workEmail,
        password: admin.password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      const userId = authData.user?.id;
      if (!userId) {
        setError("Account created — please check your email to confirm, then log in.");
        setLoading(false);
        return;
      }

      // 2. Create organization via API (uses service role to bypass RLS)
      const res = await fetch("/api/org/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          admin: { ...admin, userId },
          travel,
        }),
      });

      const result = await res.json();
      if (!res.ok || result.error) {
        setError(result.error || "Failed to create organization");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-lg">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  s <= step
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                }`}
              >
                {s < step ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  s
                )}
              </div>
              {s < 4 && (
                <div
                  className={`mx-2 h-0.5 w-12 sm:w-20 transition-colors ${
                    s < step ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
          <span>Company</span>
          <span>Admin</span>
          <span>Travel</span>
          <span>Confirm</span>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        {/* Step 1: Company Details */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Company Details
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Tell us about your company to set up your travel account.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  placeholder="Acme Technologies"
                  value={company.companyName}
                  onChange={(e) =>
                    setCompany((p) => ({ ...p, companyName: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workEmail">Work Email *</Label>
                <Input
                  id="workEmail"
                  type="email"
                  placeholder="you@company.com"
                  value={company.workEmail}
                  onChange={(e) =>
                    setCompany((p) => ({ ...p, workEmail: e.target.value }))
                  }
                  required
                />
                <p className="text-xs text-gray-400">
                  This becomes your admin login. Your email domain will be used to identify your company.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={company.phone}
                  onChange={(e) =>
                    setCompany((p) => ({ ...p, phone: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Industry *</Label>
                <Select
                  value={company.industry}
                  onValueChange={(v) =>
                    setCompany((p) => ({ ...p, industry: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((i) => (
                      <SelectItem key={i.value} value={i.value}>
                        {i.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Number of Employees *</Label>
                <Select
                  value={company.employeeCount}
                  onValueChange={(v) =>
                    setCompany((p) => ({ ...p, employeeCount: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_COUNTS.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Admin Profile */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Your Profile
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                You&apos;ll be the admin for your company&apos;s travel account.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Priya Sharma"
                  value={admin.fullName}
                  onChange={(e) =>
                    setAdmin((p) => ({ ...p, fullName: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="designation">Designation *</Label>
                <Input
                  id="designation"
                  placeholder="Head of Operations"
                  value={admin.designation}
                  onChange={(e) =>
                    setAdmin((p) => ({ ...p, designation: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={admin.password}
                  onChange={(e) =>
                    setAdmin((p) => ({ ...p, password: e.target.value }))
                  }
                  required
                  minLength={6}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Travel Basics */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Travel Basics
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Help us set up your travel policy defaults.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gstin">
                  GSTIN
                  <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>
                </Label>
                <Input
                  id="gstin"
                  placeholder="29AABCT1234F1ZP"
                  value={travel.gstin}
                  onChange={(e) =>
                    setTravel((p) => ({
                      ...p,
                      gstin: e.target.value.toUpperCase(),
                    }))
                  }
                  maxLength={15}
                />
                <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  Add your GSTIN to unlock 12-18% GST savings via ITC recovery
                </div>
              </div>
              <div className="space-y-2">
                <Label>Primary Travel Routes</Label>
                <p className="text-xs text-gray-400">
                  Select the routes your team flies most. This helps optimize results.
                </p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_ROUTES.map((route) => (
                    <button
                      key={route}
                      type="button"
                      onClick={() => toggleRoute(route)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        travel.primaryRoutes.includes(route)
                          ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-500"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600"
                      }`}
                    >
                      {route}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Monthly Travel Volume</Label>
                <Select
                  value={travel.monthlyVolume}
                  onValueChange={(v) =>
                    setTravel((p) => ({ ...p, monthlyVolume: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Estimated bookings per month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHLY_VOLUMES.map((v) => (
                      <SelectItem key={v.value} value={v.value}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Ready to Launch
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Review your details and start your free pilot.
              </p>
            </div>

            <div className="space-y-3">
              <SummaryRow label="Company" value={company.companyName} />
              <SummaryRow label="Admin" value={`${admin.fullName} (${admin.designation})`} />
              <SummaryRow label="Email" value={company.workEmail} />
              <SummaryRow
                label="Industry"
                value={INDUSTRIES.find((i) => i.value === company.industry)?.label || company.industry}
              />
              <SummaryRow
                label="Size"
                value={EMPLOYEE_COUNTS.find((e) => e.value === company.employeeCount)?.label || company.employeeCount}
              />
              {travel.gstin && (
                <SummaryRow label="GSTIN" value={travel.gstin} />
              )}
              {travel.primaryRoutes.length > 0 && (
                <SummaryRow
                  label="Top Routes"
                  value={travel.primaryRoutes.join(", ")}
                />
              )}
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Free Pilot Plan
              </p>
              <ul className="mt-2 space-y-1 text-xs text-blue-700 dark:text-blue-400">
                <li>20 bookings per month</li>
                <li>WhatsApp booking bot</li>
                <li>Basic travel policy</li>
                <li>GST invoice capture</li>
              </ul>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          {step > 1 ? (
            <Button variant="ghost" onClick={handleBack} disabled={loading}>
              Back
            </Button>
          ) : (
            <div />
          )}
          {step < 4 ? (
            <Button onClick={handleNext}>Continue</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Setting up..." : "Start Free Pilot"}
            </Button>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">
          Sign in
        </Link>
      </p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 dark:border-gray-800">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {value}
      </span>
    </div>
  );
}
