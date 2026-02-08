"use client";

import Link from "next/link";
import { UserMenu } from "@/components/user-menu";
import { SidebarNav } from "./sidebar-nav";
import { MobileNav } from "./mobile-nav";

interface DashboardShellProps {
  email: string;
  children: React.ReactNode;
}

export function DashboardShell({ email, children }: DashboardShellProps) {
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/5 px-4">
        <div className="flex items-center gap-3">
          <MobileNav />
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="black"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Skyswift
            </span>
          </Link>
        </div>
        <UserMenu email={email} />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — hidden on mobile */}
        <aside className="hidden w-56 shrink-0 border-r border-white/5 p-4 md:block">
          <SidebarNav />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
