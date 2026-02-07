"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  travelDocumentsSchema,
  type TravelDocumentsValues,
} from "@/lib/validations/onboarding";
import { StepWrapper } from "./step-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";

interface StepTravelDocumentsProps {
  defaultValues: Partial<TravelDocumentsValues>;
  onNext: (data: TravelDocumentsValues) => void;
  onBack: () => void;
  isSaving: boolean;
}

export function StepTravelDocuments({
  defaultValues,
  onNext,
  onBack,
  isSaving,
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
    >
      <form onSubmit={handleSubmit(onNext)} className="space-y-4">
        {/* Security trust banner */}
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-400">
          <Shield className="h-4 w-4 shrink-0" />
          <span>
            Your passport data is encrypted with AES-256 and stored in a
            secure vault.
          </span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="passport_number" className="text-white/80">
            Passport number *
          </Label>
          <Input
            id="passport_number"
            placeholder="AB1234567"
            className="border-white/10 bg-white/5 text-white uppercase placeholder:text-white/30 placeholder:normal-case"
            {...register("passport_number", {
              onChange: (e) => {
                e.target.value = e.target.value.toUpperCase();
              },
            })}
          />
          {errors.passport_number && (
            <p className="text-xs text-red-400">
              {errors.passport_number.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ktn" className="text-white/80">
              Known Traveller Number (KTN)
            </Label>
            <Input
              id="ktn"
              placeholder="Optional"
              className="border-white/10 bg-white/5 text-white uppercase placeholder:text-white/30 placeholder:normal-case"
              {...register("ktn", {
                onChange: (e) => {
                  e.target.value = e.target.value.toUpperCase();
                },
              })}
            />
            {errors.ktn && (
              <p className="text-xs text-red-400">{errors.ktn.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="redress_number" className="text-white/80">
              Redress number
            </Label>
            <Input
              id="redress_number"
              placeholder="Optional"
              className="border-white/10 bg-white/5 text-white uppercase placeholder:text-white/30 placeholder:normal-case"
              {...register("redress_number", {
                onChange: (e) => {
                  e.target.value = e.target.value.toUpperCase();
                },
              })}
            />
            {errors.redress_number && (
              <p className="text-xs text-red-400">
                {errors.redress_number.message}
              </p>
            )}
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
