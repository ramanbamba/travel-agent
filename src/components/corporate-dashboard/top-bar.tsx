"use client";

import { Bell, Search } from "lucide-react";

interface TopBarProps {
  userName: string;
  userRole: string;
  orgName: string;
  pendingApprovals?: number;
}

export function TopBar({ userName, userRole, orgName, pendingApprovals = 0 }: TopBarProps) {
  return (
    <header className="hidden h-14 items-center justify-between border-b border-gray-200 bg-white px-6 md:flex">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search bookings, employees..."
            className="h-9 w-64 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-300"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs text-gray-400">{orgName}</span>
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors">
          <Bell className="h-4.5 w-4.5" />
          {pendingApprovals > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {pendingApprovals > 9 ? "9+" : pendingApprovals}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            {userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-[#0F1B2D]">{userName}</p>
            <p className="text-[10px] capitalize text-gray-500">{userRole.replace(/_/g, " ")}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
