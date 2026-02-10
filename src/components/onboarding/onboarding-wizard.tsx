"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ProgressIndicator } from "./progress-indicator";
import { StepPersonalInfo } from "./step-personal-info";
import { StepTravelDocuments } from "./step-travel-documents";
import { StepLoyaltyPrograms } from "./step-loyalty-programs";
import { StepPreferences } from "./step-preferences";
import { StepSummary } from "./step-summary";
import type {
  PersonalInfoValues,
  TravelDocumentsValues,
  LoyaltyProgramsValues,
  PreferencesValues,
} from "@/lib/validations/onboarding";
import type { UserProfile, LoyaltyProgram } from "@/types";

interface OnboardingWizardProps {
  initialProfile: UserProfile | null;
  initialLoyaltyPrograms: LoyaltyProgram[];
}

type Direction = "forward" | "back";

function determineStartStep(
  profile: UserProfile | null,
  loyaltyPrograms: LoyaltyProgram[]
): number {
  if (!profile) return 0;

  // Step 0: personal info
  if (!profile.first_name || !profile.last_name || !profile.date_of_birth || !profile.gender) {
    return 0;
  }
  // Step 1: travel docs
  if (!profile.passport_vault_id) {
    return 1;
  }
  // Step 2: loyalty programs — always allow re-entry (skip-able step)
  // Step 3: preferences — check if defaults were changed
  if (
    profile.seat_preference === "no_preference" &&
    profile.meal_preference === "no_preference" &&
    loyaltyPrograms.length === 0
  ) {
    return 2;
  }

  // If they have preferences set, go to review
  return 4;
}

export function OnboardingWizard({
  initialProfile,
  initialLoyaltyPrograms,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(() =>
    determineStartStep(initialProfile, initialLoyaltyPrograms)
  );
  const [direction, setDirection] = useState<Direction>("forward");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const stepKeyRef = useRef(0);

  // Aggregated form data across steps
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoValues>({
    first_name: initialProfile?.first_name ?? "",
    middle_name: initialProfile?.middle_name ?? "",
    last_name: initialProfile?.last_name ?? "",
    date_of_birth: initialProfile?.date_of_birth ?? "",
    gender: (initialProfile?.gender as "M" | "F" | "X") ?? undefined!,
  });

  const [travelDocuments, setTravelDocuments] = useState<TravelDocumentsValues>({
    passport_number: initialProfile?.passport_vault_id ?? "",
    ktn: initialProfile?.ktn_vault_id ?? "",
    redress_number: initialProfile?.redress_number ?? "",
  });

  const [loyaltyPrograms, setLoyaltyPrograms] = useState<LoyaltyProgramsValues>({
    loyalty_programs: initialLoyaltyPrograms.map((lp) => ({
      airline_code: lp.airline_code,
      airline_name: lp.airline_name,
      program_name: lp.program_name,
      member_number: lp.member_number,
      tier: lp.tier ?? "",
    })),
  });

  const [preferences, setPreferences] = useState<PreferencesValues>({
    seat_preference: initialProfile?.seat_preference ?? "no_preference",
    meal_preference: initialProfile?.meal_preference ?? "no_preference",
    special_assistance: [],
  });

  const goForward = useCallback((step: number) => {
    setDirection("forward");
    stepKeyRef.current += 1;
    setCurrentStep(step);
  }, []);

  const goBack = useCallback((step: number) => {
    setDirection("back");
    stepKeyRef.current += 1;
    setCurrentStep(step);
  }, []);

  const saveProfile = useCallback(
    async (fields: Record<string, unknown>) => {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to save profile");
      }
      return res.json();
    },
    []
  );

  const saveLoyaltyPrograms = useCallback(
    async (programs: LoyaltyProgramsValues["loyalty_programs"]) => {
      const res = await fetch("/api/profile/loyalty", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loyalty_programs: programs }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to save loyalty programs");
      }
      return res.json();
    },
    []
  );

  const handlePersonalInfo = async (data: PersonalInfoValues) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await saveProfile({
        first_name: data.first_name,
        middle_name: data.middle_name || null,
        last_name: data.last_name,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
      });

      setPersonalInfo(data);
      goForward(1);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save profile";
      console.error("[Onboarding] Error saving personal info:", err);
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTravelDocuments = async (data: TravelDocumentsValues) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await saveProfile({
        passport_vault_id: data.passport_number,
        ktn_vault_id: data.ktn || null,
        redress_number: data.redress_number || null,
      });

      setTravelDocuments(data);
      goForward(2);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save travel documents";
      console.error("[Onboarding] Error saving travel docs:", err);
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoyaltyPrograms = async (data: LoyaltyProgramsValues) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await saveLoyaltyPrograms(data.loyalty_programs);

      setLoyaltyPrograms(data);
      goForward(3);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save loyalty programs";
      console.error("[Onboarding] Error saving loyalty programs:", err);
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferences = async (data: PreferencesValues) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await saveProfile({
        seat_preference: data.seat_preference,
        meal_preference: data.meal_preference,
      });

      setPreferences(data);
      goForward(4);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save preferences";
      console.error("[Onboarding] Error saving preferences:", err);
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await saveProfile({ onboarding_completed: true });

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to complete onboarding";
      console.error("[Onboarding] Error completing onboarding:", err);
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] bg-[var(--glass-bg-page)]">
      <ProgressIndicator currentStep={currentStep} />

      {saveError && (
        <div className="fixed left-1/2 top-4 z-50 w-full max-w-md -translate-x-1/2 rounded-[var(--glass-radius-card)] border border-[var(--glass-accent-red)]/20 bg-[var(--glass-accent-red-light)] px-4 py-3 text-sm text-[var(--glass-accent-red)] shadow-[var(--glass-shadow-md)]">
          <p className="font-medium">Failed to save</p>
          <p className="mt-1 opacity-80">{saveError}</p>
        </div>
      )}

      <div key={stepKeyRef.current}>
        {currentStep === 0 && (
          <StepPersonalInfo
            defaultValues={personalInfo}
            onNext={handlePersonalInfo}
            isSaving={isSaving}
            direction={direction}
          />
        )}
        {currentStep === 1 && (
          <StepTravelDocuments
            defaultValues={travelDocuments}
            onNext={handleTravelDocuments}
            onBack={() => goBack(0)}
            isSaving={isSaving}
            direction={direction}
          />
        )}
        {currentStep === 2 && (
          <StepLoyaltyPrograms
            defaultValues={loyaltyPrograms}
            onNext={handleLoyaltyPrograms}
            onBack={() => goBack(1)}
            isSaving={isSaving}
            direction={direction}
          />
        )}
        {currentStep === 3 && (
          <StepPreferences
            defaultValues={preferences}
            onNext={handlePreferences}
            onBack={() => goBack(2)}
            isSaving={isSaving}
            direction={direction}
          />
        )}
        {currentStep === 4 && (
          <StepSummary
            personalInfo={personalInfo}
            travelDocuments={travelDocuments}
            loyaltyPrograms={loyaltyPrograms}
            preferences={preferences}
            onComplete={handleComplete}
            onBack={() => goBack(3)}
            isSaving={isSaving}
            direction={direction}
          />
        )}
      </div>
    </div>
  );
}
