"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  preferencesSchema,
  type PreferencesValues,
} from "@/lib/validations/onboarding";
import { StepWrapper } from "./step-wrapper";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SeatSelector } from "./seat-selector";

const MEAL_OPTIONS = [
  { value: "no_preference", label: "No preference" },
  { value: "standard", label: "Standard" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
  { value: "gluten_free", label: "Gluten free" },
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
}

export function StepPreferences({
  defaultValues,
  onNext,
  onBack,
  isSaving,
}: StepPreferencesProps) {
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
      special_assistance: defaultValues.special_assistance ?? [],
    },
  });

  const seatValue = watch("seat_preference");
  const mealValue = watch("meal_preference");
  const assistanceValues = watch("special_assistance") ?? [];

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
    >
      <form onSubmit={handleSubmit(onNext)} className="space-y-6">
        {/* Seat preference */}
        <div className="space-y-3">
          <Label className="text-white/80">Seat preference</Label>
          <SeatSelector
            value={seatValue}
            onChange={(val) =>
              setValue("seat_preference", val, { shouldValidate: true })
            }
          />
          {errors.seat_preference && (
            <p className="text-xs text-red-400">
              {errors.seat_preference.message}
            </p>
          )}
        </div>

        {/* Meal preference */}
        <div className="space-y-2">
          <Label className="text-white/80">Meal preference</Label>
          <Select
            value={mealValue}
            onValueChange={(val) =>
              setValue(
                "meal_preference",
                val as PreferencesValues["meal_preference"],
                { shouldValidate: true }
              )
            }
          >
            <SelectTrigger className="border-white/10 bg-white/5 text-white">
              <SelectValue placeholder="Select meal preference" />
            </SelectTrigger>
            <SelectContent>
              {MEAL_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.meal_preference && (
            <p className="text-xs text-red-400">
              {errors.meal_preference.message}
            </p>
          )}
        </div>

        {/* Special assistance */}
        <div className="space-y-3">
          <Label className="text-white/80">Special assistance</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ASSISTANCE_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-3 rounded-lg border border-white/10 px-3 py-2.5 cursor-pointer hover:border-white/20 transition-colors"
              >
                <Checkbox
                  checked={assistanceValues.includes(opt.id)}
                  onCheckedChange={() => toggleAssistance(opt.id)}
                />
                <span className="text-sm text-white/70">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="text-white/60 hover:text-white"
          >
            Back
          </Button>
          <Button type="submit" disabled={isSaving} className="min-w-[120px]">
            {isSaving ? "Saving..." : "Continue"}
          </Button>
        </div>
      </form>
    </StepWrapper>
  );
}
