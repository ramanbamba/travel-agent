"use client";

import { StepWrapper } from "./step-wrapper";
import { Button } from "@/components/ui/button";
import type { PersonalInfoValues, TravelDocumentsValues, LoyaltyProgramsValues, PreferencesValues } from "@/lib/validations/onboarding";
import { Check, Plane } from "lucide-react";

interface StepSummaryProps {
  personalInfo: PersonalInfoValues;
  travelDocuments: TravelDocumentsValues;
  loyaltyPrograms: LoyaltyProgramsValues;
  preferences: PreferencesValues;
  onComplete: () => void;
  onBack: () => void;
  isSaving: boolean;
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
      <span className="text-sm text-white/50">{label}</span>
      <span className="text-sm text-white font-medium">{value}</span>
    </div>
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
}: StepSummaryProps) {
  const fullName = [
    personalInfo.first_name,
    personalInfo.middle_name,
    personalInfo.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <StepWrapper
      title="You're all set!"
      subtitle="Review your details below. You can update these anytime in settings."
    >
      <div className="space-y-5">
        {/* Personal Info */}
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
            Personal Information
          </h3>
          <div className="divide-y divide-white/5">
            <SummaryRow label="Name" value={fullName} />
            <SummaryRow label="Date of birth" value={personalInfo.date_of_birth} />
            <SummaryRow label="Gender" value={formatGender(personalInfo.gender)} />
          </div>
        </div>

        {/* Travel Documents */}
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
            Travel Documents
          </h3>
          <div className="divide-y divide-white/5">
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
        </div>

        {/* Loyalty Programs */}
        {loyaltyPrograms.loyalty_programs.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
              Loyalty Programs
            </h3>
            <div className="divide-y divide-white/5">
              {loyaltyPrograms.loyalty_programs.map((lp, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-white/50">
                    {lp.airline_name} — {lp.program_name}
                  </span>
                  <span className="text-sm text-white font-medium">
                    {lp.member_number}
                    {lp.tier ? ` (${lp.tier})` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preferences */}
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
            Preferences
          </h3>
          <div className="divide-y divide-white/5">
            <SummaryRow label="Seat" value={formatSeat(preferences.seat_preference)} />
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
        </div>

        {/* Success banner */}
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500">
            <Check className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-400">
              Profile complete
            </p>
            <p className="text-xs text-emerald-400/60">
              You&apos;re ready to start booking flights with a single command.
            </p>
          </div>
        </div>

        <div className="flex justify-between pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="text-white/60 hover:text-white"
          >
            Back
          </Button>
          <Button
            onClick={onComplete}
            disabled={isSaving}
            className="min-w-[200px] bg-emerald-600 hover:bg-emerald-700"
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <Plane className="mr-2 h-4 w-4" />
                Start booking flights
              </>
            )}
          </Button>
        </div>
      </div>
    </StepWrapper>
  );
}
