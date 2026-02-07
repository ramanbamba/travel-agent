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
}

export function StepLoyaltyPrograms({
  defaultValues,
  onNext,
  onBack,
  isSaving,
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
    >
      <form onSubmit={handleSubmit(onNext)} className="space-y-4">
        {fields.map((field, index) => {
          const selectedAirline = getSelectedAirline(index);
          const airlineName = watch(`loyalty_programs.${index}.airline_name`);

          return (
            <div
              key={field.id}
              className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white/80">
                  Program {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-white/40 hover:text-red-400 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Airline selector */}
              <div className="space-y-2">
                <Label className="text-white/60 text-xs">Airline</Label>
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
                    <Button
                      variant="outline"
                      role="combobox"
                      type="button"
                      className={cn(
                        "w-full justify-between border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white",
                        !airlineName && "text-white/30"
                      )}
                    >
                      {airlineName || "Search for an airline..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
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
                              <span className="font-mono text-xs mr-2 text-muted-foreground">
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
                  <p className="text-xs text-red-400">
                    {errors.loyalty_programs[index]?.airline_code?.message}
                  </p>
                )}
              </div>

              {/* Member number + tier */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs">
                    Member number
                  </Label>
                  <Input
                    placeholder="e.g. 12345678"
                    className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
                    {...register(`loyalty_programs.${index}.member_number`)}
                  />
                  {errors.loyalty_programs?.[index]?.member_number && (
                    <p className="text-xs text-red-400">
                      {errors.loyalty_programs[index]?.member_number?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-white/60 text-xs">Tier</Label>
                  <Select
                    value={watch(`loyalty_programs.${index}.tier`) ?? ""}
                    onValueChange={(val) =>
                      setValue(`loyalty_programs.${index}.tier`, val, {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger className="border-white/10 bg-white/5 text-white">
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
          );
        })}

        <Button
          type="button"
          variant="outline"
          className="w-full border-dashed border-white/20 text-white/60 hover:border-white/40 hover:text-white hover:bg-white/5"
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
        </Button>

        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="text-white/60 hover:text-white"
          >
            Back
          </Button>
          <div className="flex gap-2">
            {fields.length === 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => onNext({ loyalty_programs: [] })}
                className="text-white/60 hover:text-white"
              >
                Skip for now
              </Button>
            )}
            <Button type="submit" disabled={isSaving} className="min-w-[120px]">
              {isSaving ? "Saving..." : "Continue"}
            </Button>
          </div>
        </div>
      </form>
    </StepWrapper>
  );
}
