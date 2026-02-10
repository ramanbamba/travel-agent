"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  personalInfoSchema,
  type PersonalInfoValues,
} from "@/lib/validations/onboarding";
import { StepWrapper } from "./step-wrapper";
import { GlassButton, GlassInput } from "@/components/ui/glass";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StepPersonalInfoProps {
  defaultValues: Partial<PersonalInfoValues>;
  onNext: (data: PersonalInfoValues) => void;
  isSaving: boolean;
  direction?: "forward" | "back";
}

export function StepPersonalInfo({
  defaultValues,
  onNext,
  isSaving,
  direction = "forward",
}: StepPersonalInfoProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      first_name: defaultValues.first_name ?? "",
      middle_name: defaultValues.middle_name ?? "",
      last_name: defaultValues.last_name ?? "",
      date_of_birth: defaultValues.date_of_birth ?? "",
      gender: defaultValues.gender,
    },
  });

  const genderValue = watch("gender");

  return (
    <StepWrapper
      title="Let's get to know you"
      subtitle="We'll use this information for your flight bookings."
      direction={direction}
    >
      <form onSubmit={handleSubmit(onNext)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="first_name" className="text-[var(--glass-text-secondary)]">
              First name *
            </Label>
            <GlassInput
              id="first_name"
              placeholder="John"
              error={!!errors.first_name}
              className="py-3 text-base"
              {...register("first_name")}
            />
            {errors.first_name && (
              <p className="text-xs text-[var(--glass-accent-red)]">{errors.first_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="middle_name" className="text-[var(--glass-text-secondary)]">
              Middle name
            </Label>
            <GlassInput
              id="middle_name"
              placeholder="Michael"
              className="py-3 text-base"
              {...register("middle_name")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name" className="text-[var(--glass-text-secondary)]">
              Last name *
            </Label>
            <GlassInput
              id="last_name"
              placeholder="Smith"
              error={!!errors.last_name}
              className="py-3 text-base"
              {...register("last_name")}
            />
            {errors.last_name && (
              <p className="text-xs text-[var(--glass-accent-red)]">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="date_of_birth" className="text-[var(--glass-text-secondary)]">
              Date of birth *
            </Label>
            <GlassInput
              id="date_of_birth"
              type="date"
              error={!!errors.date_of_birth}
              className="py-3 text-base"
              {...register("date_of_birth")}
            />
            {errors.date_of_birth && (
              <p className="text-xs text-[var(--glass-accent-red)]">
                {errors.date_of_birth.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-[var(--glass-text-secondary)]">Gender *</Label>
            <Select
              value={genderValue}
              onValueChange={(val) =>
                setValue("gender", val as "M" | "F" | "X", {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="h-auto rounded-[var(--glass-radius-input)] border-[var(--glass-border)] bg-[var(--glass-subtle)] py-3 text-base text-[var(--glass-text-primary)]">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Male</SelectItem>
                <SelectItem value="F">Female</SelectItem>
                <SelectItem value="X">Unspecified / Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && (
              <p className="text-xs text-[var(--glass-accent-red)]">{errors.gender.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <GlassButton type="submit" disabled={isSaving} size="lg">
            {isSaving ? "Saving..." : "Continue"}
          </GlassButton>
        </div>
      </form>
    </StepWrapper>
  );
}
