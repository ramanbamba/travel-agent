"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plane,
  IndianRupee,
  CheckCircle2,
  Clock,
  Loader2,
  Shield,
  Save,
} from "lucide-react";
import { PageHeader } from "@/components/corporate-dashboard";
import { toast } from "@/hooks/use-toast";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PolicyData = any;

const CABIN_CLASSES = ["economy", "premium_economy", "business", "first"];
const SENIORITY_LEVELS = [
  "individual_contributor",
  "manager",
  "senior_manager",
  "director",
  "vp",
  "c_suite",
];
const AIRLINES = [
  { code: "6E", name: "IndiGo" },
  { code: "AI", name: "Air India" },
  { code: "UK", name: "Vistara" },
  { code: "SG", name: "SpiceJet" },
  { code: "G8", name: "Go First" },
  { code: "QP", name: "Akasa Air" },
  { code: "I5", name: "AirAsia India" },
  { code: "S5", name: "Star Air" },
];

interface FlightRules {
  domestic_cabin_class: {
    default: string;
    overrides: Array<{ seniority: string[]; allowed: string[] }>;
  };
  max_flight_price: { domestic: number | null; international: number | null };
  advance_booking_days: { minimum: number; recommended: number };
  preferred_airlines: string[];
  blocked_airlines: string[];
  allow_refundable_only: boolean;
  max_stops: number | null;
}

interface SpendLimits {
  per_trip: number | null;
  per_month: number | null;
  overrides: Array<{ seniority: string[]; per_trip?: number; per_month?: number }>;
}

interface ApprovalRules {
  auto_approve_under: number;
  require_approval_over: number;
  out_of_policy_handling: "soft" | "hard";
  approval_timeout_hours: number;
  auto_escalate: boolean;
}

interface BookingRules {
  min_advance_days: number;
  recommended_advance_days: number;
  show_early_booking_message: boolean;
}

const defaultFlightRules: FlightRules = {
  domestic_cabin_class: { default: "economy", overrides: [] },
  max_flight_price: { domestic: null, international: null },
  advance_booking_days: { minimum: 0, recommended: 7 },
  preferred_airlines: [],
  blocked_airlines: [],
  allow_refundable_only: false,
  max_stops: null,
};

const defaultSpendLimits: SpendLimits = {
  per_trip: null,
  per_month: null,
  overrides: [],
};

const defaultApprovalRules: ApprovalRules = {
  auto_approve_under: 5000,
  require_approval_over: 25000,
  out_of_policy_handling: "soft",
  approval_timeout_hours: 24,
  auto_escalate: false,
};

const defaultBookingRules: BookingRules = {
  min_advance_days: 0,
  recommended_advance_days: 7,
  show_early_booking_message: true,
};

export default function PolicyPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flightRules, setFlightRules] = useState<FlightRules>(defaultFlightRules);
  const [spendLimits, setSpendLimits] = useState<SpendLimits>(defaultSpendLimits);
  const [approvalRules, setApprovalRules] = useState<ApprovalRules>(defaultApprovalRules);
  const [bookingRules, setBookingRules] = useState<BookingRules>(defaultBookingRules);
  const [policyMode, setPolicyMode] = useState<"soft" | "hard">("soft");

  const loadPolicy = useCallback(async () => {
    try {
      const res = await fetch("/api/corp/policy?org_id=current");
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      const p: PolicyData = json.data;
      if (p) {
        setFlightRules({ ...defaultFlightRules, ...p.flight_rules });
        setSpendLimits({ ...defaultSpendLimits, ...p.spend_limits });
        setApprovalRules({ ...defaultApprovalRules, ...p.approval_rules });
        setBookingRules({ ...defaultBookingRules, ...p.booking_rules });
        setPolicyMode(p.policy_mode ?? "soft");
      }
    } catch (err) {
      console.error("Load policy error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPolicy();
  }, [loadPolicy]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/corp/policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: "current",
          flight_rules: flightRules,
          spend_limits: spendLimits,
          approval_rules: approvalRules,
          booking_rules: bookingRules,
          policy_mode: policyMode,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast({ title: "Policy updated", description: "Travel policy has been saved." });
    } catch {
      toast({ title: "Error", description: "Failed to save policy", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  // Policy preview text
  const preview = buildPolicyPreview(flightRules, spendLimits, approvalRules);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Travel Policy"
        description="Configure rules for your organization's travel bookings"
        actions={
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Policy
          </button>
        }
      />

      {/* Policy Preview */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-2">
          <Shield className="mt-0.5 h-4 w-4 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-800">Policy Preview</p>
            <p className="mt-1 text-sm text-blue-700">{preview}</p>
          </div>
        </div>
      </div>

      {/* Enforcement Mode */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-[#0F1B2D] mb-3">Enforcement Mode</h3>
        <div className="flex gap-3">
          <button
            onClick={() => setPolicyMode("soft")}
            className={`flex-1 rounded-lg border p-3 text-left transition-colors ${
              policyMode === "soft"
                ? "border-blue-300 bg-blue-50"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <p className="text-sm font-medium text-[#0F1B2D]">Soft</p>
            <p className="text-xs text-gray-500">Warn employees but allow out-of-policy bookings</p>
          </button>
          <button
            onClick={() => setPolicyMode("hard")}
            className={`flex-1 rounded-lg border p-3 text-left transition-colors ${
              policyMode === "hard"
                ? "border-red-300 bg-red-50"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <p className="text-sm font-medium text-[#0F1B2D]">Hard</p>
            <p className="text-xs text-gray-500">Block out-of-policy bookings completely</p>
          </button>
        </div>
      </div>

      {/* Flight Rules */}
      <PolicyCard title="Flight Rules" icon={Plane}>
        <div className="space-y-4">
          <FormField label="Default Cabin Class">
            <select
              value={flightRules.domestic_cabin_class.default}
              onChange={(e) =>
                setFlightRules({
                  ...flightRules,
                  domestic_cabin_class: {
                    ...flightRules.domestic_cabin_class,
                    default: e.target.value,
                  },
                })
              }
              className="input-field capitalize"
            >
              {CABIN_CLASSES.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </FormField>

          {/* Cabin overrides by seniority */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700">
              Cabin Class Overrides by Seniority
            </label>
            {flightRules.domestic_cabin_class.overrides.map((ov, idx) => (
              <div key={idx} className="mb-2 flex items-center gap-2 rounded-lg border border-gray-200 p-2">
                <select
                  multiple
                  value={ov.seniority}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (o) => o.value);
                    const overrides = [...flightRules.domestic_cabin_class.overrides];
                    overrides[idx] = { ...ov, seniority: selected };
                    setFlightRules({
                      ...flightRules,
                      domestic_cabin_class: { ...flightRules.domestic_cabin_class, overrides },
                    });
                  }}
                  className="h-20 flex-1 rounded border border-gray-200 text-xs capitalize"
                >
                  {SENIORITY_LEVELS.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
                <select
                  multiple
                  value={ov.allowed}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (o) => o.value);
                    const overrides = [...flightRules.domestic_cabin_class.overrides];
                    overrides[idx] = { ...ov, allowed: selected };
                    setFlightRules({
                      ...flightRules,
                      domestic_cabin_class: { ...flightRules.domestic_cabin_class, overrides },
                    });
                  }}
                  className="h-20 flex-1 rounded border border-gray-200 text-xs capitalize"
                >
                  {CABIN_CLASSES.map((c) => (
                    <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const overrides = flightRules.domestic_cabin_class.overrides.filter(
                      (_, i) => i !== idx
                    );
                    setFlightRules({
                      ...flightRules,
                      domestic_cabin_class: { ...flightRules.domestic_cabin_class, overrides },
                    });
                  }}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const overrides = [
                  ...flightRules.domestic_cabin_class.overrides,
                  { seniority: ["director"], allowed: ["economy", "premium_economy", "business"] },
                ];
                setFlightRules({
                  ...flightRules,
                  domestic_cabin_class: { ...flightRules.domestic_cabin_class, overrides },
                });
              }}
              className="text-xs text-blue-600 hover:underline"
            >
              + Add override
            </button>
          </div>

          {/* Airlines */}
          <FormField label="Preferred Airlines">
            <div className="flex flex-wrap gap-2">
              {AIRLINES.map((a) => (
                <ChipToggle
                  key={a.code}
                  label={a.name}
                  active={flightRules.preferred_airlines.includes(a.code)}
                  onClick={() => {
                    const current = flightRules.preferred_airlines;
                    setFlightRules({
                      ...flightRules,
                      preferred_airlines: current.includes(a.code)
                        ? current.filter((c) => c !== a.code)
                        : [...current, a.code],
                    });
                  }}
                />
              ))}
            </div>
          </FormField>

          <FormField label="Blocked Airlines">
            <div className="flex flex-wrap gap-2">
              {AIRLINES.map((a) => (
                <ChipToggle
                  key={a.code}
                  label={a.name}
                  active={flightRules.blocked_airlines.includes(a.code)}
                  variant="red"
                  onClick={() => {
                    const current = flightRules.blocked_airlines;
                    setFlightRules({
                      ...flightRules,
                      blocked_airlines: current.includes(a.code)
                        ? current.filter((c) => c !== a.code)
                        : [...current, a.code],
                    });
                  }}
                />
              ))}
            </div>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Max Price (Domestic ₹)">
              <input
                type="number"
                value={flightRules.max_flight_price.domestic ?? ""}
                onChange={(e) =>
                  setFlightRules({
                    ...flightRules,
                    max_flight_price: {
                      ...flightRules.max_flight_price,
                      domestic: e.target.value ? Number(e.target.value) : null,
                    },
                  })
                }
                placeholder="No limit"
                className="input-field"
              />
            </FormField>
            <FormField label="Max Price (International ₹)">
              <input
                type="number"
                value={flightRules.max_flight_price.international ?? ""}
                onChange={(e) =>
                  setFlightRules({
                    ...flightRules,
                    max_flight_price: {
                      ...flightRules.max_flight_price,
                      international: e.target.value ? Number(e.target.value) : null,
                    },
                  })
                }
                placeholder="No limit"
                className="input-field"
              />
            </FormField>
          </div>

          <FormField label="Maximum Stops">
            <select
              value={flightRules.max_stops ?? "any"}
              onChange={(e) =>
                setFlightRules({
                  ...flightRules,
                  max_stops: e.target.value === "any" ? null : Number(e.target.value),
                })
              }
              className="input-field"
            >
              <option value="0">Direct only</option>
              <option value="1">1 stop</option>
              <option value="any">Any</option>
            </select>
          </FormField>

          <Toggle
            label="Allow refundable fares only"
            checked={flightRules.allow_refundable_only}
            onChange={(v) => setFlightRules({ ...flightRules, allow_refundable_only: v })}
          />
        </div>
      </PolicyCard>

      {/* Spend Limits */}
      <PolicyCard title="Spend Limits" icon={IndianRupee}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Per-Trip Limit (₹)">
              <input
                type="number"
                value={spendLimits.per_trip ?? ""}
                onChange={(e) =>
                  setSpendLimits({
                    ...spendLimits,
                    per_trip: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="No limit"
                className="input-field"
              />
            </FormField>
            <FormField label="Per-Month Limit per Employee (₹)">
              <input
                type="number"
                value={spendLimits.per_month ?? ""}
                onChange={(e) =>
                  setSpendLimits({
                    ...spendLimits,
                    per_month: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="No limit"
                className="input-field"
              />
            </FormField>
          </div>
        </div>
      </PolicyCard>

      {/* Approval Rules */}
      <PolicyCard title="Approval Rules" icon={CheckCircle2}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Auto-Approve Under (₹)">
              <input
                type="number"
                value={approvalRules.auto_approve_under}
                onChange={(e) =>
                  setApprovalRules({
                    ...approvalRules,
                    auto_approve_under: Number(e.target.value) || 0,
                  })
                }
                className="input-field"
              />
            </FormField>
            <FormField label="Require Approval Above (₹)">
              <input
                type="number"
                value={approvalRules.require_approval_over}
                onChange={(e) =>
                  setApprovalRules({
                    ...approvalRules,
                    require_approval_over: Number(e.target.value) || 0,
                  })
                }
                className="input-field"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Approval Timeout (hours)">
              <input
                type="number"
                value={approvalRules.approval_timeout_hours}
                onChange={(e) =>
                  setApprovalRules({
                    ...approvalRules,
                    approval_timeout_hours: Number(e.target.value) || 24,
                  })
                }
                className="input-field"
              />
            </FormField>
            <div className="pt-6">
              <Toggle
                label="Auto-escalate on timeout"
                checked={approvalRules.auto_escalate}
                onChange={(v) => setApprovalRules({ ...approvalRules, auto_escalate: v })}
              />
            </div>
          </div>
        </div>
      </PolicyCard>

      {/* Booking Rules */}
      <PolicyCard title="Booking Rules" icon={Clock}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Minimum Advance Booking (days)">
              <input
                type="number"
                value={bookingRules.min_advance_days}
                onChange={(e) =>
                  setBookingRules({
                    ...bookingRules,
                    min_advance_days: Number(e.target.value) || 0,
                  })
                }
                className="input-field"
              />
            </FormField>
            <FormField label="Recommended Advance Booking (days)">
              <input
                type="number"
                value={bookingRules.recommended_advance_days}
                onChange={(e) =>
                  setBookingRules({
                    ...bookingRules,
                    recommended_advance_days: Number(e.target.value) || 7,
                  })
                }
                className="input-field"
              />
            </FormField>
          </div>
          <Toggle
            label="Show early booking savings message"
            checked={bookingRules.show_early_booking_message}
            onChange={(v) => setBookingRules({ ...bookingRules, show_early_booking_message: v })}
          />
        </div>
      </PolicyCard>
    </div>
  );
}

// ── Helpers ──

function PolicyCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-3">
        <Icon className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-[#0F1B2D]">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition-colors ${
          checked ? "bg-blue-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </button>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

function ChipToggle({
  label,
  active,
  variant = "blue",
  onClick,
}: {
  label: string;
  active: boolean;
  variant?: "blue" | "red";
  onClick: () => void;
}) {
  const colors = active
    ? variant === "red"
      ? "border-red-300 bg-red-50 text-red-700"
      : "border-blue-300 bg-blue-50 text-blue-700"
    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50";

  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${colors}`}
    >
      {label}
    </button>
  );
}

function buildPolicyPreview(
  fr: FlightRules,
  sl: SpendLimits,
  ar: ApprovalRules
): string {
  const parts: string[] = [];

  const defaultCabin = fr.domestic_cabin_class.default.replace(/_/g, " ");
  parts.push(`Default cabin: ${defaultCabin}`);

  if (fr.max_flight_price.domestic) {
    parts.push(`domestic flights up to ₹${fr.max_flight_price.domestic.toLocaleString("en-IN")}`);
  }

  if (sl.per_trip) {
    parts.push(`per-trip limit ₹${sl.per_trip.toLocaleString("en-IN")}`);
  }

  if (ar.auto_approve_under > 0) {
    parts.push(`auto-approve under ₹${ar.auto_approve_under.toLocaleString("en-IN")}`);
  }

  if (ar.require_approval_over > 0 && ar.require_approval_over < Infinity) {
    parts.push(`approval required above ₹${ar.require_approval_over.toLocaleString("en-IN")}`);
  }

  if (fr.domestic_cabin_class.overrides.length > 0) {
    const ov = fr.domestic_cabin_class.overrides[0];
    const levels = ov.seniority.map((s) => s.replace(/_/g, " ")).join(", ");
    const cabins = ov.allowed.map((c) => c.replace(/_/g, " ")).join(", ");
    parts.push(`${levels} can book ${cabins}`);
  }

  return parts.join(". ") + ".";
}
