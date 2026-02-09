"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  personalInfoSchema,
  type PersonalInfoValues,
} from "@/lib/validations/onboarding";
import { StepWrapper } from "./step-wrapper";
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

interface StepPersonalInfoProps {
  defaultValues: Partial<PersonalInfoValues>;
  onNext: (data: PersonalInfoValues) => void;
  isSaving: boolean;
}

export function StepPersonalInfo({
  defaultValues,
  onNext,
  isSaving,
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
    >
      <form onSubmit={handleSubmit(onNext)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="first_name" className="text-white/80">
              First name *
            </Label>
            <Input
              id="first_name"
              placeholder="John"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
              {...register("first_name")}
            />
            {errors.first_name && (
              <p className="text-xs text-red-400">{errors.first_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="middle_name" className="text-white/80">
              Middle name
            </Label>
            <Input
              id="middle_name"
              placeholder="Michael"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
              {...register("middle_name")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name" className="text-white/80">
              Last name *
            </Label>
            <Input
              id="last_name"
              placeholder="Smith"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
              {...register("last_name")}
            />
            {errors.last_name && (
              <p className="text-xs text-red-400">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="date_of_birth" className="text-white/80">
              Date of birth *
            </Label>
            <Input
              id="date_of_birth"
              type="date"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
              {...register("date_of_birth")}
            />
            {errors.date_of_birth && (
              <p className="text-xs text-red-400">
                {errors.date_of_birth.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-white/80">Gender *</Label>
            <Select
              value={genderValue}
              onValueChange={(val) =>
                setValue("gender", val as "M" | "F" | "X", {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="border-white/10 bg-white/5 text-white">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Male</SelectItem>
                <SelectItem value="F">Female</SelectItem>
                <SelectItem value="X">Unspecified / Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && (
              <p className="text-xs text-red-400">{errors.gender.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSaving} className="min-w-[120px]">
            {isSaving ? "Saving..." : "Continue"}
          </Button>
        </div>
      </form>
    </StepWrapper>
  );
}
