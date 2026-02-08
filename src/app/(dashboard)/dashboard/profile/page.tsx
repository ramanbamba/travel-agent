"use client";

import { ProfileView } from "@/components/profile/profile-view";

export default function ProfilePage() {
  return (
    <div className="animate-in fade-in duration-300 p-6">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your personal information, travel documents, and preferences.
      </p>
      <div className="mt-6 max-w-2xl">
        <ProfileView />
      </div>
    </div>
  );
}
