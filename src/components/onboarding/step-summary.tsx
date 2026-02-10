"use client";

import { GlassButton, GlassCard } from "@/components/ui/glass";
import { Plane } from "lucide-react";
import type {
  PersonalInfoValues,
  TravelDocumentsValues,
  LoyaltyProgramsValues,
  PreferencesValues,
} from "@/lib/validations/onboarding";
import { cn } from "@/lib/utils";

interface StepSummaryProps {
  personalInfo: PersonalInfoValues;
  travelDocuments: TravelDocumentsValues;
  loyaltyPrograms: LoyaltyProgramsValues;
  preferences: PreferencesValues;
  onComplete: () => void;
  onBack: () => void;
  isSaving: boolean;
  direction?: "forward" | "back";
}

function maskPassport(value: string): string {
  if (value.length <= 3) return value;
  return value.slice(0, 2) + "*".repeat(value.length - 3) + value.slice(-1);
}

function formatGender(value: string): string {
  switch (value) {
    case "M": return "Male";
    case "F": return "Female";
    case "X": return "Unspecified / Other";
    default: return value;
  }
}

function formatSeat(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatMeal(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-sm text-[var(--glass-text-tertiary)]">{label}</span>
      <span className="text-sm font-medium text-[var(--glass-text-primary)]">{value}</span>
    </div>
  );
}

// CSS confetti particles
const CONFETTI_COLORS = [
  "var(--glass-accent-blue)",
  "var(--glass-accent-green)",
  "var(--glass-accent-amber)",
  "var(--glass-accent-red)",
  "var(--glass-accent-orange)",
];

function ConfettiParticle({ index }: { index: number }) {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const left = 10 + (index * 17) % 80;
  const delay = (index * 0.15) % 1;
  const duration = 1.5 + (index % 3) * 0.5;

  return (
    <div
      className="absolute top-0 h-2 w-2 rounded-full animate-confetti"
      style={{
        left: `${left}%`,
        backgroundColor: color,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    />
  );
}

export function StepSummary({
  personalInfo,
  travelDocuments,
  loyaltyPrograms,
  preferences,
  onComplete,
  onBack,
  isSaving,
  direction = "forward",
}: StepSummaryProps) {
  const fullName = [
    personalInfo.first_name,
    personalInfo.middle_name,
    personalInfo.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cn(
        "flex min-h-[100dvh] flex-col items-center justify-center px-4 py-20",
        direction === "forward"
          ? "animate-step-slide-left"
          : "animate-step-slide-right"
      )}
    >
      <div className="w-full max-w-lg">
        {/* Celebration header */}
        <div className="relative mb-8 text-center">
          {/* Confetti */}
          <div className="pointer-events-none absolute inset-x-0 -top-8 h-40 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <ConfettiParticle key={i} index={i} />
            ))}
          </div>

          {/* Animated checkmark */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--glass-accent-green)]">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-draw-check"
              pathLength="1"
            >
              <polyline points="20 6 9 17 4 12" pathLength="1" />
            </svg>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-[var(--glass-text-primary)] sm:text-4xl">
            You&apos;re all set!
          </h2>
          <p className="mt-2 text-base text-[var(--glass-text-secondary)]">
            Review your details below. You can update these anytime in settings.
          </p>
        </div>

        {/* Review cards */}
        <div className="space-y-4">
          {/* Personal Info */}
          <GlassCard tier="subtle" padding="md" hover={false}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--glass-text-tertiary)]">
              Personal Information
            </h3>
            <div className="divide-y divide-[var(--glass-border-subtle)]">
              <SummaryRow label="Name" value={fullName} />
              <SummaryRow label="Date of birth" value={personalInfo.date_of_birth} />
              <SummaryRow label="Gender" value={formatGender(personalInfo.gender)} />
            </div>
          </GlassCard>

          {/* Travel Documents */}
          <GlassCard tier="subtle" padding="md" hover={false}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--glass-text-tertiary)]">
              Travel Documents
            </h3>
            <div className="divide-y divide-[var(--glass-border-subtle)]">
              <SummaryRow
                label="Passport"
                value={maskPassport(travelDocuments.passport_number)}
              />
              {travelDocuments.ktn && (
                <SummaryRow label="KTN" value={travelDocuments.ktn} />
              )}
              {travelDocuments.redress_number && (
                <SummaryRow
                  label="Redress"
                  value={travelDocuments.redress_number}
                />
              )}
            </div>
          </GlassCard>

          {/* Loyalty Programs */}
          {loyaltyPrograms.loyalty_programs.length > 0 && (
            <GlassCard tier="subtle" padding="md" hover={false}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--glass-text-tertiary)]">
                Loyalty Programs
              </h3>
              <div className="divide-y divide-[var(--glass-border-subtle)]">
                {loyaltyPrograms.loyalty_programs.map((lp, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-[var(--glass-text-tertiary)]">
                      {lp.airline_name} — {lp.program_name}
                    </span>
                    <span className="text-sm font-medium text-[var(--glass-text-primary)]">
                      {lp.member_number}
                      {lp.tier ? ` (${lp.tier})` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Preferences */}
          <GlassCard tier="subtle" padding="md" hover={false}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--glass-text-tertiary)]">
              Preferences
            </h3>
            <div className="divide-y divide-[var(--glass-border-subtle)]">
              {preferences.home_airport && (
                <SummaryRow label="Home airport" value={preferences.home_airport} />
              )}
              <SummaryRow label="Seat" value={formatSeat(preferences.seat_preference)} />
              {preferences.preferred_cabin && (
                <SummaryRow label="Cabin" value={formatSeat(preferences.preferred_cabin)} />
              )}
              <SummaryRow label="Meal" value={formatMeal(preferences.meal_preference)} />
              {preferences.special_assistance && preferences.special_assistance.length > 0 && (
                <SummaryRow
                  label="Assistance"
                  value={preferences.special_assistance
                    .map((a) => a.charAt(0).toUpperCase() + a.slice(1))
                    .join(", ")}
                />
              )}
            </div>
          </GlassCard>
        </div>

        {/* Action buttons */}
        <div className="mt-8 flex justify-between">
          <GlassButton type="button" variant="ghost" onClick={onBack} size="lg">
            Back
          </GlassButton>
          <GlassButton
            onClick={onComplete}
            disabled={isSaving}
            size="lg"
            className="min-w-[220px] active:scale-[0.97]"
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <Plane className="mr-2 h-4 w-4" />
                Start booking flights
              </>
            )}
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
