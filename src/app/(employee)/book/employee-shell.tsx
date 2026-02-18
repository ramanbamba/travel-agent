"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plane, History, Heart, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Book", href: "/book", icon: Plane },
  { label: "My Trips", href: "/book/history", icon: History },
  { label: "Preferences", href: "/book/preferences", icon: Heart },
];

interface EmployeeShellProps {
  userName: string;
  orgName: string;
  memberId: string;
  orgId: string;
  children: React.ReactNode;
}

export function EmployeeShell({
  userName,
  orgName,
  children,
}: EmployeeShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-[100dvh] flex-col bg-gray-50">
      {/* Top nav */}
      <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Link href="/book" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
              <Plane className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-[#0F1B2D]">SkySwift</span>
            <span className="hidden text-xs text-gray-400 sm:inline">|</span>
            <span className="hidden text-xs text-gray-500 sm:inline">{orgName}</span>
          </Link>

          <nav className="flex items-center gap-1" aria-label="Employee navigation">
            {navItems.map((item) => {
              const isActive =
                item.href === "/book"
                  ? pathname === "/book"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
              {userName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <span className="text-sm font-medium text-[#0F1B2D]">{userName}</span>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-1 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            title="Back to dashboard"
          >
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
