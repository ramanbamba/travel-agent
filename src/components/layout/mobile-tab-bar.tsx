"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Plane, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Book", href: "/dashboard", icon: MessageSquare },
  { label: "Trips", href: "/dashboard/bookings", icon: Plane },
  { label: "Profile", href: "/dashboard/profile", icon: User },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[var(--glass-z-nav)]",
        "md:hidden",
        // Glass surface
        "bg-[var(--glass-elevated)]",
        "backdrop-blur-[24px] [backdrop-filter:blur(24px)_saturate(1.8)] [-webkit-backdrop-filter:blur(24px)_saturate(1.8)]",
        "border-t border-[var(--glass-border)]",
        // Safe area
        "pb-[env(safe-area-inset-bottom)]"
      )}
      aria-label="Main navigation"
    >
      <div className="flex h-12 items-stretch">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5",
                "transition-all duration-200 ease-spring",
                "active:scale-90",
                isActive
                  ? "text-[var(--glass-accent-blue)]"
                  : "text-[var(--glass-text-tertiary)]"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Active indicator pill */}
              {isActive && (
                <span
                  className={cn(
                    "absolute -top-px left-1/2 -translate-x-1/2",
                    "h-0.5 w-5",
                    "rounded-full",
                    "bg-[var(--glass-accent-blue)]",
                    "animate-pill-in"
                  )}
                />
              )}
              <tab.icon
                className={cn(
                  "h-[18px] w-[18px]",
                  "transition-transform duration-200 ease-spring",
                  isActive && "scale-110"
                )}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span className="text-[10px] font-medium leading-none">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
