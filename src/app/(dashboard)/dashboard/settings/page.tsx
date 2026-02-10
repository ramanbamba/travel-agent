"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronRight,
  CreditCard,
  Mail,
  MessageSquare,
  Smartphone,
  User,
  Heart,
  Award,
  Palette,
} from "lucide-react";
import { GlassCard, GlassPill } from "@/components/ui/glass";
import { cn } from "@/lib/utils";

interface ProfileData {
  first_name?: string;
  last_name?: string;
  email?: string;
}

function ProfileHeader({ profile }: { profile: ProfileData | null }) {
  const initials = profile
    ? [profile.first_name, profile.last_name]
        .filter(Boolean)
        .map((n) => n![0])
        .join("")
        .toUpperCase()
    : "?";

  const name = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(" ")
    : "Loading...";

  return (
    <Link href="/dashboard/profile">
      <GlassCard tier="subtle" hover padding="md">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--glass-accent-blue)] to-[var(--glass-accent-blue)]/60 text-lg font-bold text-white">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-[var(--glass-text-primary)] truncate">
              {name}
            </p>
            {profile?.email && (
              <p className="text-sm text-[var(--glass-text-secondary)] truncate">
                {profile.email}
              </p>
            )}
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--glass-text-tertiary)]" />
        </div>
      </GlassCard>
    </Link>
  );
}

interface SettingsRowProps {
  icon: React.ElementType;
  label: string;
  value?: string;
  href?: string;
  badge?: { text: string; variant: "green" | "default" };
  last?: boolean;
}

function SettingsRow({ icon: Icon, label, value, href, badge, last }: SettingsRowProps) {
  const content = (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3.5 transition-colors",
        href && "hover:bg-[var(--glass-standard)]/30 cursor-pointer",
        !last && "border-b border-[var(--glass-border)]/50"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-[var(--glass-text-tertiary)]" />
        <span className="text-sm text-[var(--glass-text-primary)]">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <GlassPill variant={badge.variant} size="sm">
            {badge.text}
          </GlassPill>
        )}
        {value && (
          <span className="text-sm text-[var(--glass-text-tertiary)]">{value}</span>
        )}
        {href && (
          <ChevronRight className="h-4 w-4 text-[var(--glass-text-tertiary)]" />
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function SettingsGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 px-1 text-xs font-medium uppercase tracking-wider text-[var(--glass-text-tertiary)]">
        {title}
      </p>
      <GlassCard tier="subtle" hover={false} padding="none" className="overflow-hidden">
        {children}
      </GlassCard>
    </div>
  );
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) return;
        const json = await res.json();
        const p = json.data?.profile;
        const email = json.data?.email;
        if (p) {
          setProfile({
            first_name: p.first_name,
            last_name: p.last_name,
            email,
          });
        }
      } catch {
        // Fail silently — not critical
      }
    }
    fetchProfile();
  }, []);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--glass-text-primary)] sm:text-4xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[var(--glass-text-secondary)]">
          Manage your account and preferences.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile card */}
        <ProfileHeader profile={profile} />

        {/* Account group */}
        <SettingsGroup title="Account">
          <SettingsRow
            icon={User}
            label="Personal Info"
            href="/dashboard/profile"
          />
          <SettingsRow
            icon={Award}
            label="Loyalty Programs"
            href="/dashboard/profile"
          />
          <SettingsRow
            icon={Heart}
            label="Travel Preferences"
            href="/dashboard/profile"
            last
          />
        </SettingsGroup>

        {/* Payment group */}
        <SettingsGroup title="Payment">
          <SettingsRow
            icon={CreditCard}
            label="Payment Methods"
            href="/dashboard/settings/payment"
            last
          />
        </SettingsGroup>

        {/* Notifications group */}
        <SettingsGroup title="Notifications">
          <SettingsRow
            icon={Mail}
            label="Email Notifications"
            badge={{ text: "Active", variant: "green" }}
          />
          <SettingsRow
            icon={MessageSquare}
            label="SMS Alerts"
            badge={{ text: "Coming soon", variant: "default" }}
          />
          <SettingsRow
            icon={Smartphone}
            label="Push Notifications"
            badge={{ text: "Coming soon", variant: "default" }}
            last
          />
        </SettingsGroup>

        {/* App group */}
        <SettingsGroup title="App">
          <SettingsRow
            icon={Palette}
            label="Appearance"
            value="System"
          />
          <SettingsRow
            icon={Bell}
            label="Notification Sound"
            value="Default"
            last
          />
        </SettingsGroup>
      </div>
    </div>
  );
}
