"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  preferencesSchema,
  type PreferencesValues,
} from "@/lib/validations/onboarding";
import { StepWrapper } from "./step-wrapper";
import { GlassButton } from "@/components/ui/glass";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SeatSelector } from "./seat-selector";
import { cn } from "@/lib/utils";

const MEAL_OPTIONS = [
  { value: "no_preference", label: "Any" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "halal", label: "Halal" },
  { value: "standard", label: "Standard" },
  { value: "gluten_free", label: "Gluten free" },
] as const;

const HOME_AIRPORTS = [
  { code: "BLR", label: "Bengaluru" },
  { code: "DEL", label: "Delhi" },
  { code: "BOM", label: "Mumbai" },
  { code: "HYD", label: "Hyderabad" },
  { code: "MAA", label: "Chennai" },
  { code: "CCU", label: "Kolkata" },
] as const;

const CABIN_OPTIONS = [
  { value: "economy", label: "Economy" },
  { value: "premium_economy", label: "Premium" },
  { value: "business", label: "Business" },
  { value: "first", label: "First" },
] as const;

const ASSISTANCE_OPTIONS = [
  { id: "wheelchair", label: "Wheelchair assistance" },
  { id: "visual", label: "Visual impairment assistance" },
  { id: "hearing", label: "Hearing impairment assistance" },
  { id: "mobility", label: "Mobility assistance" },
] as const;

interface StepPreferencesProps {
  defaultValues: Partial<PreferencesValues>;
  onNext: (data: PreferencesValues) => void;
  onBack: () => void;
  isSaving: boolean;
  direction?: "forward" | "back";
}

export function StepPreferences({
  defaultValues,
  onNext,
  onBack,
  isSaving,
  direction = "forward",
}: StepPreferencesProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PreferencesValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      seat_preference: defaultValues.seat_preference ?? "no_preference",
      meal_preference: defaultValues.meal_preference ?? "no_preference",
      home_airport: defaultValues.home_airport ?? "",
      preferred_cabin: defaultValues.preferred_cabin,
      special_assistance: defaultValues.special_assistance ?? [],
    },
  });

  const seatValue = watch("seat_preference");
  const mealValue = watch("meal_preference");
  const homeAirport = watch("home_airport");
  const cabinValue = watch("preferred_cabin");
  const assistanceValues = watch("special_assistance") ?? [];

  // Auto-advance after seat selection if meal is already selected
  useEffect(() => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
    }

    if (
      seatValue &&
      seatValue !== "no_preference" &&
      mealValue &&
      mealValue !== "no_preference"
    ) {
      autoAdvanceRef.current = setTimeout(() => {
        formRef.current?.requestSubmit();
      }, 500);
    }

    return () => {
      if (autoAdvanceRef.current) {
        clearTimeout(autoAdvanceRef.current);
      }
    };
  }, [seatValue, mealValue]);

  const toggleAssistance = (id: string) => {
    const current = assistanceValues;
    const updated = current.includes(id)
      ? current.filter((v) => v !== id)
      : [...current, id];
    setValue("special_assistance", updated);
  };

  return (
    <StepWrapper
      title="Your travel preferences"
      subtitle="We'll apply these defaults to every booking. You can always change them later."
      direction={direction}
    >
      <form ref={formRef} onSubmit={handleSubmit(onNext)} className="space-y-6">
        {/* Home airport */}
        <div className="space-y-3">
          <Label className="text-[var(--glass-text-secondary)]">Home airport</Label>
          <div className="flex flex-wrap gap-2">
            {HOME_AIRPORTS.map((apt) => (
              <button
                key={apt.code}
                type="button"
                onClick={() => setValue("home_airport", apt.code, { shouldValidate: true })}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-200 active:scale-95",
                  homeAirport === apt.code
                    ? "border-[var(--glass-accent-blue)] bg-[var(--glass-accent-blue-light)] text-[var(--glass-accent-blue)]"
                    : "border-[var(--glass-border)] bg-[var(--glass-subtle)] text-[var(--glass-text-secondary)] hover:border-[var(--glass-accent-blue)]/50"
                )}
              >
                <span className="font-semibold">{apt.code}</span>
                <span className="ml-1 text-[11px] opacity-70">{apt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Seat preference */}
        <div className="space-y-3">
          <Label className="text-[var(--glass-text-secondary)]">Seat preference</Label>
          <SeatSelector
            value={seatValue}
            onChange={(val) =>
              setValue("seat_preference", val, { shouldValidate: true })
            }
          />
          {errors.seat_preference && (
            <p className="text-xs text-[var(--glass-accent-red)]">
              {errors.seat_preference.message}
            </p>
          )}
        </div>

        {/* Cabin class */}
        <div className="space-y-3">
          <Label className="text-[var(--glass-text-secondary)]">Preferred cabin</Label>
          <div className="flex flex-wrap gap-2">
            {CABIN_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  setValue("preferred_cabin", opt.value as PreferencesValues["preferred_cabin"], { shouldValidate: true })
                }
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95",
                  cabinValue === opt.value
                    ? "border-[var(--glass-accent-blue)] bg-[var(--glass-accent-blue-light)] text-[var(--glass-accent-blue)]"
                    : "border-[var(--glass-border)] bg-[var(--glass-subtle)] text-[var(--glass-text-secondary)] hover:border-[var(--glass-accent-blue)]/50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Meal preference — pills */}
        <div className="space-y-3">
          <Label className="text-[var(--glass-text-secondary)]">Meal preference</Label>
          <div className="flex flex-wrap gap-2">
            {MEAL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  setValue("meal_preference", opt.value as PreferencesValues["meal_preference"], { shouldValidate: true })
                }
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95",
                  mealValue === opt.value
                    ? "border-[var(--glass-accent-blue)] bg-[var(--glass-accent-blue-light)] text-[var(--glass-accent-blue)]"
                    : "border-[var(--glass-border)] bg-[var(--glass-subtle)] text-[var(--glass-text-secondary)] hover:border-[var(--glass-accent-blue)]/50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {errors.meal_preference && (
            <p className="text-xs text-[var(--glass-accent-red)]">
              {errors.meal_preference.message}
            </p>
          )}
        </div>

        {/* Special assistance */}
        <div className="space-y-3">
          <Label className="text-[var(--glass-text-secondary)]">Special assistance</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ASSISTANCE_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                className="flex cursor-pointer items-center gap-3 rounded-[var(--glass-radius-input)] border border-[var(--glass-border)] bg-[var(--glass-subtle)] px-3 py-2.5 transition-colors hover:bg-[var(--glass-standard)]"
              >
                <Checkbox
                  checked={assistanceValues.includes(opt.id)}
                  onCheckedChange={() => toggleAssistance(opt.id)}
                />
                <span className="text-sm text-[var(--glass-text-secondary)]">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <GlassButton type="button" variant="ghost" onClick={onBack} size="lg">
            Back
          </GlassButton>
          <GlassButton type="submit" disabled={isSaving} size="lg">
            {isSaving ? "Saving..." : "Continue"}
          </GlassButton>
        </div>
      </form>
    </StepWrapper>
  );
}
