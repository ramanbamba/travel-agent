"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loyaltyProgramsSchema,
  type LoyaltyProgramsValues,
} from "@/lib/validations/onboarding";
import { airlines, type AirlineData } from "@/lib/data/airlines";
import { StepWrapper } from "./step-wrapper";
import { GlassButton, GlassInput, GlassCard } from "@/components/ui/glass";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepLoyaltyProgramsProps {
  defaultValues: LoyaltyProgramsValues;
  onNext: (data: LoyaltyProgramsValues) => void;
  onBack: () => void;
  isSaving: boolean;
  direction?: "forward" | "back";
}

export function StepLoyaltyPrograms({
  defaultValues,
  onNext,
  onBack,
  isSaving,
  direction = "forward",
}: StepLoyaltyProgramsProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoyaltyProgramsValues>({
    resolver: zodResolver(loyaltyProgramsSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "loyalty_programs",
  });

  const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);

  const selectAirline = (index: number, airline: AirlineData) => {
    setValue(`loyalty_programs.${index}.airline_code`, airline.code, {
      shouldValidate: true,
    });
    setValue(`loyalty_programs.${index}.airline_name`, airline.name, {
      shouldValidate: true,
    });
    setValue(`loyalty_programs.${index}.program_name`, airline.programName, {
      shouldValidate: true,
    });
    setValue(`loyalty_programs.${index}.tier`, "");
    setOpenPopoverIndex(null);
  };

  const getSelectedAirline = (index: number): AirlineData | undefined => {
    const code = watch(`loyalty_programs.${index}.airline_code`);
    return airlines.find((a) => a.code === code);
  };

  return (
    <StepWrapper
      title="Loyalty programs"
      subtitle="Add your frequent flyer memberships so we can credit your miles."
      direction={direction}
    >
      <form onSubmit={handleSubmit(onNext)} className="space-y-4">
        {fields.map((field, index) => {
          const selectedAirline = getSelectedAirline(index);
          const airlineName = watch(`loyalty_programs.${index}.airline_name`);

          return (
            <GlassCard
              key={field.id}
              tier="subtle"
              padding="md"
              hover={false}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--glass-text-secondary)]">
                    Program {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-[var(--glass-text-tertiary)] transition-colors hover:text-[var(--glass-accent-red)]"
                    aria-label={`Remove program ${index + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Airline selector */}
                <div className="space-y-2">
                  <Label className="text-xs text-[var(--glass-text-tertiary)]">Airline</Label>
                  <input
                    type="hidden"
                    {...register(`loyalty_programs.${index}.airline_code`)}
                  />
                  <input
                    type="hidden"
                    {...register(`loyalty_programs.${index}.airline_name`)}
                  />
                  <input
                    type="hidden"
                    {...register(`loyalty_programs.${index}.program_name`)}
                  />
                  <Popover
                    open={openPopoverIndex === index}
                    onOpenChange={(open) =>
                      setOpenPopoverIndex(open ? index : null)
                    }
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        role="combobox"
                        aria-expanded={openPopoverIndex === index}
                        aria-controls={`airline-list-${index}`}
                        className={cn(
                          "flex w-full items-center justify-between rounded-[var(--glass-radius-input)] border border-[var(--glass-border)] bg-[var(--glass-subtle)] px-3 py-3 text-base transition-colors",
                          "hover:bg-[var(--glass-standard)]",
                          airlineName
                            ? "text-[var(--glass-text-primary)]"
                            : "text-[var(--glass-text-tertiary)]"
                        )}
                      >
                        {airlineName || "Search for an airline..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search airlines..." />
                        <CommandList>
                          <CommandEmpty>No airline found.</CommandEmpty>
                          <CommandGroup>
                            {airlines.map((airline) => (
                              <CommandItem
                                key={airline.code}
                                value={`${airline.name} ${airline.code}`}
                                onSelect={() => selectAirline(index, airline)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedAirline?.code === airline.code
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <span className="mr-2 font-mono text-xs text-[var(--glass-text-tertiary)]">
                                  {airline.code}
                                </span>
                                {airline.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.loyalty_programs?.[index]?.airline_code && (
                    <p className="text-xs text-[var(--glass-accent-red)]">
                      {errors.loyalty_programs[index]?.airline_code?.message}
                    </p>
                  )}
                </div>

                {/* Member number + tier */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-[var(--glass-text-tertiary)]">
                      Member number
                    </Label>
                    <GlassInput
                      placeholder="e.g. 12345678"
                      error={!!errors.loyalty_programs?.[index]?.member_number}
                      className="py-3 text-base"
                      {...register(`loyalty_programs.${index}.member_number`)}
                    />
                    {errors.loyalty_programs?.[index]?.member_number && (
                      <p className="text-xs text-[var(--glass-accent-red)]">
                        {errors.loyalty_programs[index]?.member_number?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-[var(--glass-text-tertiary)]">Tier</Label>
                    <Select
                      value={watch(`loyalty_programs.${index}.tier`) ?? ""}
                      onValueChange={(val) =>
                        setValue(`loyalty_programs.${index}.tier`, val, {
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger className="h-auto rounded-[var(--glass-radius-input)] border-[var(--glass-border)] bg-[var(--glass-subtle)] py-3 text-base text-[var(--glass-text-primary)]">
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent>
                        {(selectedAirline?.tiers ?? []).map((tier) => (
                          <SelectItem key={tier} value={tier}>
                            {tier}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}

        <GlassButton
          type="button"
          variant="secondary"
          size="lg"
          className="w-full border-dashed"
          onClick={() =>
            append({
              airline_code: "",
              airline_name: "",
              program_name: "",
              member_number: "",
              tier: "",
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add loyalty program
        </GlassButton>

        <div className="flex justify-between pt-4">
          <GlassButton type="button" variant="ghost" onClick={onBack} size="lg">
            Back
          </GlassButton>
          <div className="flex gap-2">
            {fields.length === 0 && (
              <GlassButton
                type="button"
                variant="ghost"
                onClick={() => onNext({ loyalty_programs: [] })}
                size="lg"
              >
                Skip for now
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
