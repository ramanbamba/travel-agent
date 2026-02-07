import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import type { UserProfile, LoyaltyProgram } from "@/types";

export default async function OnboardingPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch existing profile (may not exist yet for brand-new users)
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // If onboarding already completed, go to dashboard
  if (profile?.onboarding_completed) {
    redirect("/dashboard");
  }

  // Fetch existing loyalty programs (for resume flow)
  const { data: loyaltyPrograms } = await supabase
    .from("loyalty_programs")
    .select("*")
    .eq("user_id", user.id);

  return (
    <OnboardingWizard
      initialProfile={(profile as UserProfile) ?? null}
      initialLoyaltyPrograms={(loyaltyPrograms as LoyaltyProgram[]) ?? []}
    />
  );
}
