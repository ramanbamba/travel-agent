"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Plane,
  Users,
  Shield,
  BarChart3,
  Receipt,
  Settings,
  Menu,
  X,
  LogOut,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { label: "Overview", href: "/dashboard/corp", icon: LayoutDashboard },
  { label: "Bookings", href: "/dashboard/corp/bookings", icon: Plane },
  { label: "Employees", href: "/dashboard/corp/employees", icon: Users },
  { label: "Policy", href: "/dashboard/corp/policy", icon: Shield },
  { label: "Analytics", href: "/dashboard/corp/analytics", icon: BarChart3 },
  { label: "GST & Invoices", href: "/dashboard/corp/gst", icon: Receipt },
  { label: "Settings", href: "/dashboard/corp/settings", icon: Settings },
];

interface SidebarNavProps {
  orgName: string;
  userName: string;
  userRole: string;
}

export function SidebarNav({ orgName, userName, userRole }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold text-[#0F1B2D]">SkySwift</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
            <Bell className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo + close */}
        <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4">
          <Link href="/dashboard/corp" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
              <Plane className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-[#0F1B2D]">SkySwift</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 md:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Org info */}
        <div className="border-b border-gray-200 px-4 py-3">
          <p className="text-sm font-semibold text-[#0F1B2D] truncate">{orgName}</p>
          <p className="text-xs text-gray-500 truncate">{userName}</p>
          <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 capitalize">
            {userRole.replace(/_/g, " ")}
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Corporate dashboard">
          <div className="flex flex-col gap-0.5">
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard/corp"
                  ? pathname === "/dashboard/corp"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom */}
        <div className="border-t border-gray-200 px-3 py-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
