"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Plane, User, Settings } from "lucide-react";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MobileTabBar } from "./mobile-tab-bar";
import { GlassNavbar } from "@/components/ui/glass";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Book a Flight", href: "/dashboard", icon: MessageSquare },
  { label: "My Bookings", href: "/dashboard/bookings", icon: Plane },
  { label: "Profile", href: "/dashboard/profile", icon: User },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface AppShellProps {
  email: string;
  children: React.ReactNode;
}

export function AppShell({ email, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-[100dvh] flex-col">
      {/* Top navbar */}
      <GlassNavbar>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5"
            aria-label="Skyswift home"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--glass-accent-blue)] shadow-[0_1px_3px_rgba(0,113,227,0.3)]">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
              </svg>
            </div>
            <span className="text-[17px] font-semibold tracking-tight text-[var(--glass-text-primary)]">
              Skyswift
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu email={email} />
        </div>
      </GlassNavbar>

      <div className="flex flex-1 overflow-hidden">
        {/* Glass sidebar — hidden on mobile */}
        <nav
          className={cn(
            "hidden w-56 shrink-0 md:flex md:flex-col",
            "border-r border-[var(--glass-border)]",
            "bg-[var(--glass-subtle)]",
            "backdrop-blur-[24px] [backdrop-filter:blur(24px)_saturate(1.8)] [-webkit-backdrop-filter:blur(24px)_saturate(1.8)]",
            "p-3"
          )}
          aria-label="Main navigation"
        >
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-[var(--glass-radius-button)] px-3 py-2 text-[13px] font-medium",
                    "transition-all duration-200 ease-expo-out",
                    isActive
                      ? [
                          "bg-[var(--glass-accent-blue-light)]",
                          "text-[var(--glass-accent-blue)]",
                          "shadow-[var(--glass-shadow-sm)]",
                        ]
                      : [
                          "text-[var(--glass-text-secondary)]",
                          "hover:bg-[var(--glass-subtle)]",
                          "hover:text-[var(--glass-text-primary)]",
                        ]
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon
                    className="h-4 w-4"
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Main content */}
        <main
          className="flex-1 overflow-y-auto pb-16 md:pb-0"
          id="main-content"
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <MobileTabBar />
    </div>
  );
}
