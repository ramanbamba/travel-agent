import { z } from "zod";

export const personalInfoSchema = z.object({
  first_name: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name is too long"),
  middle_name: z.string().max(100, "Middle name is too long").optional().or(z.literal("")),
  last_name: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name is too long"),
  date_of_birth: z
    .string()
    .min(1, "Date of birth is required")
    .refine(
      (val) => {
        const dob = new Date(val);
        const now = new Date();
        const age = now.getFullYear() - dob.getFullYear();
        const monthDiff = now.getMonth() - dob.getMonth();
        const dayDiff = now.getDate() - dob.getDate();
        const actualAge =
          monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
        return actualAge >= 18;
      },
      { message: "You must be at least 18 years old" }
    ),
  gender: z.enum(["M", "F", "X"], { message: "Please select a gender" }),
  phone: z.string().max(30, "Phone number is too long").optional().or(z.literal("")),
});

export const travelDocumentsSchema = z.object({
  passport_number: z
    .string()
    .min(1, "Passport number is required")
    .min(5, "Passport number must be at least 5 characters")
    .max(20, "Passport number is too long")
    .regex(
      /^[A-Z0-9]+$/,
      "Passport number must be uppercase letters and numbers only"
    ),
  ktn: z
    .string()
    .max(20, "KTN is too long")
    .regex(/^[A-Z0-9]*$/, "KTN must be uppercase letters and numbers only")
    .optional()
    .or(z.literal("")),
  redress_number: z
    .string()
    .max(20, "Redress number is too long")
    .regex(
      /^[A-Z0-9]*$/,
      "Redress number must be uppercase letters and numbers only"
    )
    .optional()
    .or(z.literal("")),
});

export const loyaltyProgramEntrySchema = z.object({
  airline_code: z.string().min(2, "Airline code is required").max(3),
  airline_name: z.string().min(1, "Airline name is required"),
  program_name: z.string().min(1, "Program name is required"),
  member_number: z.string().min(1, "Member number is required"),
  tier: z.string().optional().or(z.literal("")),
});

export const loyaltyProgramsSchema = z.object({
  loyalty_programs: z.array(loyaltyProgramEntrySchema),
});

export const preferencesSchema = z.object({
  seat_preference: z.enum(
    ["window", "middle", "aisle", "no_preference"],
    { message: "Please select a seat preference" }
  ),
  meal_preference: z.enum(
    [
      "standard",
      "vegetarian",
      "vegan",
      "halal",
      "kosher",
      "gluten_free",
      "no_preference",
    ],
    { message: "Please select a meal preference" }
  ),
  preferred_cabin: z.enum(["economy", "premium_economy", "business", "first"], { message: "Please select a cabin" }).optional(),
  home_airport: z.string().max(4, "IATA code is at most 4 characters").optional().or(z.literal("")),
  special_assistance: z.array(z.string()).optional(),
});

export type PersonalInfoValues = z.infer<typeof personalInfoSchema>;
export type TravelDocumentsValues = z.infer<typeof travelDocumentsSchema>;
export type LoyaltyProgramEntry = z.infer<typeof loyaltyProgramEntrySchema>;
export type LoyaltyProgramsValues = z.infer<typeof loyaltyProgramsSchema>;
export type PreferencesValues = z.infer<typeof preferencesSchema>;
