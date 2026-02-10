"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  travelDocumentsSchema,
  type TravelDocumentsValues,
} from "@/lib/validations/onboarding";
import { StepWrapper } from "./step-wrapper";
import { GlassButton, GlassInput, GlassCard } from "@/components/ui/glass";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";

interface StepTravelDocumentsProps {
  defaultValues: Partial<TravelDocumentsValues>;
  onNext: (data: TravelDocumentsValues) => void;
  onSkip?: () => void;
  onBack: () => void;
  isSaving: boolean;
  direction?: "forward" | "back";
}

export function StepTravelDocuments({
  defaultValues,
  onNext,
  onSkip,
  onBack,
  isSaving,
  direction = "forward",
}: StepTravelDocumentsProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TravelDocumentsValues>({
    resolver: zodResolver(travelDocumentsSchema),
    defaultValues: {
      passport_number: defaultValues.passport_number ?? "",
      ktn: defaultValues.ktn ?? "",
      redress_number: defaultValues.redress_number ?? "",
    },
  });

  return (
    <StepWrapper
      title="Travel documents"
      subtitle="Required for booking flights. Your data is encrypted and secure."
      direction={direction}
    >
      <form onSubmit={handleSubmit(onNext)} className="space-y-4">
        {/* Security trust banner */}
        <GlassCard tier="subtle" hover={false} padding="sm">
          <div className="flex items-center gap-2 text-sm text-[var(--glass-accent-green)]">
            <Shield className="h-4 w-4 shrink-0" />
            <span>
              Your passport data is encrypted with AES-256 and stored in a
              secure vault.
            </span>
          </div>
        </GlassCard>

        <div className="space-y-2">
          <Label htmlFor="passport_number" className="text-[var(--glass-text-secondary)]">
            Passport number *
          </Label>
          <GlassInput
            id="passport_number"
            placeholder="AB1234567"
            error={!!errors.passport_number}
            className="py-3 text-base uppercase placeholder:normal-case"
            {...register("passport_number", {
              onChange: (e) => {
                e.target.value = e.target.value.toUpperCase();
              },
            })}
          />
          {errors.passport_number && (
            <p className="text-xs text-[var(--glass-accent-red)]">
              {errors.passport_number.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ktn" className="text-[var(--glass-text-secondary)]">
              Known Traveller Number (KTN)
            </Label>
            <GlassInput
              id="ktn"
              placeholder="Optional"
              error={!!errors.ktn}
              className="py-3 text-base uppercase placeholder:normal-case"
              {...register("ktn", {
                onChange: (e) => {
                  e.target.value = e.target.value.toUpperCase();
                },
              })}
            />
            {errors.ktn && (
              <p className="text-xs text-[var(--glass-accent-red)]">{errors.ktn.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="redress_number" className="text-[var(--glass-text-secondary)]">
              Redress number
            </Label>
            <GlassInput
              id="redress_number"
              placeholder="Optional"
              error={!!errors.redress_number}
              className="py-3 text-base uppercase placeholder:normal-case"
              {...register("redress_number", {
                onChange: (e) => {
                  e.target.value = e.target.value.toUpperCase();
                },
              })}
            />
            {errors.redress_number && (
              <p className="text-xs text-[var(--glass-accent-red)]">
                {errors.redress_number.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <GlassButton type="button" variant="ghost" onClick={onBack} size="lg">
            Back
          </GlassButton>
          <div className="flex items-center gap-2">
            {onSkip && (
              <GlassButton type="button" variant="ghost" onClick={onSkip} size="lg">
                I&apos;ll add this later
              </GlassButton>
            )}
            <GlassButton type="submit" disabled={isSaving} size="lg">
              {isSaving ? "Saving..." : "Continue"}
            </GlassButton>
          </div>
        </div>
      </form>
    </StepWrapper>
  );
}
