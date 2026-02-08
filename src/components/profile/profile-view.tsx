"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/hooks/use-toast";
import { ProfileSection } from "./profile-section";
import { SeatSelector } from "@/components/onboarding/seat-selector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, User } from "lucide-react";
import {
  personalInfoSchema,
  travelDocumentsSchema,
  loyaltyProgramEntrySchema,
  preferencesSchema,
  type PersonalInfoValues,
  type TravelDocumentsValues,
  type LoyaltyProgramEntry,
  type PreferencesValues,
} from "@/lib/validations/onboarding";
import type { UserProfile, LoyaltyProgram } from "@/types";

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
          <div className="h-5 w-32 animate-pulse rounded bg-white/5" />
          <div className="mt-4 space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-white/5" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FieldDisplay({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm">{value || "—"}</p>
    </div>
  );
}

const GENDER_LABELS: Record<string, string> = { M: "Male", F: "Female", X: "Other" };
const MEAL_LABELS: Record<string, string> = {
  standard: "Standard",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  halal: "Halal",
  kosher: "Kosher",
  gluten_free: "Gluten Free",
  no_preference: "No Preference",
};
const SEAT_LABELS: Record<string, string> = {
  window: "Window",
  middle: "Middle",
  aisle: "Aisle",
  no_preference: "No Preference",
};

export function ProfileView() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loyaltyPrograms, setLoyaltyPrograms] = useState<LoyaltyProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const json = await res.json();
        setProfile(json.data?.profile ?? null);
        setLoyaltyPrograms(json.data?.loyalty_programs ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Personal Info form
  const personalForm = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
  });

  // Travel Documents form
  const docsForm = useForm<TravelDocumentsValues>({
    resolver: zodResolver(travelDocumentsSchema),
  });

  // Preferences form
  const prefsForm = useForm<PreferencesValues>({
    resolver: zodResolver(preferencesSchema),
  });

  // Loyalty programs local state for editing
  const [editLoyalty, setEditLoyalty] = useState<LoyaltyProgramEntry[]>([]);

  function startEdit(section: string) {
    setEditingSection(section);
    if (section === "personal" && profile) {
      personalForm.reset({
        first_name: profile.first_name,
        middle_name: profile.middle_name ?? "",
        last_name: profile.last_name,
        date_of_birth: profile.date_of_birth ?? "",
        gender: (profile.gender as "M" | "F" | "X") ?? "M",
      });
    } else if (section === "documents" && profile) {
      docsForm.reset({
        passport_number: profile.passport_vault_id ?? "",
        ktn: profile.ktn_vault_id ?? "",
        redress_number: profile.redress_number ?? "",
      });
    } else if (section === "preferences" && profile) {
      prefsForm.reset({
        seat_preference: profile.seat_preference,
        meal_preference: profile.meal_preference,
      });
    } else if (section === "loyalty") {
      setEditLoyalty(
        loyaltyPrograms.map((lp) => ({
          airline_code: lp.airline_code,
          airline_name: lp.airline_name,
          program_name: lp.program_name,
          member_number: lp.member_number,
          tier: lp.tier ?? "",
        }))
      );
    }
  }

  async function saveSection(section: string) {
    setSaving(true);
    try {
      if (section === "personal") {
        const valid = await personalForm.trigger();
        if (!valid) { setSaving(false); return; }
        const values = personalForm.getValues();
        const res = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: values.first_name,
            middle_name: values.middle_name || null,
            last_name: values.last_name,
            date_of_birth: values.date_of_birth,
            gender: values.gender,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          setProfile(json.data);
          toast({ title: "Profile updated", description: "Personal info saved." });
        }
      } else if (section === "documents") {
        const valid = await docsForm.trigger();
        if (!valid) { setSaving(false); return; }
        const values = docsForm.getValues();
        const res = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            passport_vault_id: values.passport_number,
            ktn_vault_id: values.ktn || null,
            redress_number: values.redress_number || null,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          setProfile(json.data);
          toast({ title: "Profile updated", description: "Travel documents saved." });
        }
      } else if (section === "preferences") {
        const valid = await prefsForm.trigger();
        if (!valid) { setSaving(false); return; }
        const values = prefsForm.getValues();
        const res = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            seat_preference: values.seat_preference,
            meal_preference: values.meal_preference,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          setProfile(json.data);
          toast({ title: "Profile updated", description: "Preferences saved." });
        }
      } else if (section === "loyalty") {
        // Validate each entry
        for (const entry of editLoyalty) {
          const result = loyaltyProgramEntrySchema.safeParse(entry);
          if (!result.success) {
            toast({ title: "Validation error", description: result.error.issues[0]?.message });
            setSaving(false);
            return;
          }
        }
        const res = await fetch("/api/profile/loyalty", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ loyalty_programs: editLoyalty }),
        });
        if (res.ok) {
          const json = await res.json();
          setLoyaltyPrograms(json.data ?? []);
          toast({ title: "Profile updated", description: "Loyalty programs saved." });
        }
      }
      setEditingSection(null);
    } catch {
      toast({ title: "Error", description: "Failed to save. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <ProfileSkeleton />;

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
          <User className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 font-medium">No profile found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete onboarding to set up your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Personal Info */}
      <ProfileSection
        title="Personal Information"
        editing={editingSection === "personal"}
        saving={saving}
        onEdit={() => startEdit("personal")}
        onCancel={() => setEditingSection(null)}
        onSave={() => saveSection("personal")}
      >
        {editingSection === "personal" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" {...personalForm.register("first_name")} className="mt-1" />
              {personalForm.formState.errors.first_name && (
                <p className="mt-1 text-xs text-red-400">{personalForm.formState.errors.first_name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="middle_name">Middle Name</Label>
              <Input id="middle_name" {...personalForm.register("middle_name")} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" {...personalForm.register("last_name")} className="mt-1" />
              {personalForm.formState.errors.last_name && (
                <p className="mt-1 text-xs text-red-400">{personalForm.formState.errors.last_name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input id="date_of_birth" type="date" {...personalForm.register("date_of_birth")} className="mt-1" />
              {personalForm.formState.errors.date_of_birth && (
                <p className="mt-1 text-xs text-red-400">{personalForm.formState.errors.date_of_birth.message}</p>
              )}
            </div>
            <div>
              <Label>Gender</Label>
              <Select
                value={personalForm.watch("gender")}
                onValueChange={(v) => personalForm.setValue("gender", v as "M" | "F" | "X")}
              >
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                  <SelectItem value="X">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldDisplay label="First Name" value={profile.first_name} />
            <FieldDisplay label="Middle Name" value={profile.middle_name} />
            <FieldDisplay label="Last Name" value={profile.last_name} />
            <FieldDisplay label="Date of Birth" value={profile.date_of_birth} />
            <FieldDisplay label="Gender" value={GENDER_LABELS[profile.gender ?? ""] ?? profile.gender} />
          </div>
        )}
      </ProfileSection>

      {/* Travel Documents */}
      <ProfileSection
        title="Travel Documents"
        editing={editingSection === "documents"}
        saving={saving}
        onEdit={() => startEdit("documents")}
        onCancel={() => setEditingSection(null)}
        onSave={() => saveSection("documents")}
      >
        {editingSection === "documents" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="passport_number">Passport Number</Label>
              <Input id="passport_number" {...docsForm.register("passport_number")} className="mt-1" />
              {docsForm.formState.errors.passport_number && (
                <p className="mt-1 text-xs text-red-400">{docsForm.formState.errors.passport_number.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="ktn">Known Traveler Number</Label>
              <Input id="ktn" {...docsForm.register("ktn")} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="redress_number">Redress Number</Label>
              <Input id="redress_number" {...docsForm.register("redress_number")} className="mt-1" />
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldDisplay label="Passport Number" value={profile.passport_vault_id ? "••••" + profile.passport_vault_id.slice(-4) : null} />
            <FieldDisplay label="Known Traveler Number" value={profile.ktn_vault_id} />
            <FieldDisplay label="Redress Number" value={profile.redress_number} />
          </div>
        )}
      </ProfileSection>

      {/* Loyalty Programs */}
      <ProfileSection
        title="Loyalty Programs"
        editing={editingSection === "loyalty"}
        saving={saving}
        onEdit={() => startEdit("loyalty")}
        onCancel={() => setEditingSection(null)}
        onSave={() => saveSection("loyalty")}
      >
        {editingSection === "loyalty" ? (
          <div className="space-y-4">
            {editLoyalty.map((entry, idx) => (
              <div key={idx} className="grid gap-3 rounded-lg border border-white/10 p-3 sm:grid-cols-3">
                <div>
                  <Label>Airline Code</Label>
                  <Input
                    value={entry.airline_code}
                    onChange={(e) => {
                      const updated = [...editLoyalty];
                      updated[idx] = { ...entry, airline_code: e.target.value.toUpperCase() };
                      setEditLoyalty(updated);
                    }}
                    className="mt-1"
                    placeholder="BA"
                    maxLength={3}
                  />
                </div>
                <div>
                  <Label>Airline Name</Label>
                  <Input
                    value={entry.airline_name}
                    onChange={(e) => {
                      const updated = [...editLoyalty];
                      updated[idx] = { ...entry, airline_name: e.target.value };
                      setEditLoyalty(updated);
                    }}
                    className="mt-1"
                    placeholder="British Airways"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label>Member Number</Label>
                    <Input
                      value={entry.member_number}
                      onChange={(e) => {
                        const updated = [...editLoyalty];
                        updated[idx] = { ...entry, member_number: e.target.value };
                        setEditLoyalty(updated);
                      }}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditLoyalty(editLoyalty.filter((_, i) => i !== idx))}
                    className="shrink-0 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setEditLoyalty([
                  ...editLoyalty,
                  { airline_code: "", airline_name: "", program_name: "Frequent Flyer", member_number: "", tier: "" },
                ])
              }
              className="gap-1 border-white/10"
            >
              <Plus className="h-3 w-3" />
              Add Program
            </Button>
          </div>
        ) : loyaltyPrograms.length > 0 ? (
          <div className="space-y-3">
            {loyaltyPrograms.map((lp) => (
              <div key={lp.id} className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-2">
                <div>
                  <p className="text-sm font-medium">{lp.airline_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {lp.member_number}
                    {lp.tier && ` · ${lp.tier}`}
                  </p>
                </div>
                <span className="font-mono text-xs text-muted-foreground">{lp.airline_code}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No loyalty programs added.</p>
        )}
      </ProfileSection>

      {/* Preferences */}
      <ProfileSection
        title="Preferences"
        editing={editingSection === "preferences"}
        saving={saving}
        onEdit={() => startEdit("preferences")}
        onCancel={() => setEditingSection(null)}
        onSave={() => saveSection("preferences")}
      >
        {editingSection === "preferences" ? (
          <div className="space-y-6">
            <div>
              <Label>Seat Preference</Label>
              <div className="mt-2">
                <SeatSelector
                  value={prefsForm.watch("seat_preference")}
                  onChange={(v) => prefsForm.setValue("seat_preference", v)}
                />
              </div>
            </div>
            <div>
              <Label>Meal Preference</Label>
              <Select
                value={prefsForm.watch("meal_preference")}
                onValueChange={(v) => prefsForm.setValue("meal_preference", v as PreferencesValues["meal_preference"])}
              >
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(MEAL_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldDisplay label="Seat Preference" value={SEAT_LABELS[profile.seat_preference]} />
            <FieldDisplay label="Meal Preference" value={MEAL_LABELS[profile.meal_preference]} />
          </div>
        )}
      </ProfileSection>
    </div>
  );
}
