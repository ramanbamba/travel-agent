"use client";

import { SidebarNav } from "@/components/corporate-dashboard/sidebar-nav";
import { TopBar } from "@/components/corporate-dashboard/top-bar";

interface CorpDashboardShellProps {
  orgName: string;
  userName: string;
  userRole: string;
  orgId: string;
  memberId: string;
  children: React.ReactNode;
}

export function CorpDashboardShell({
  orgName,
  userName,
  userRole,
  children,
}: CorpDashboardShellProps) {
  return (
    <div className="flex h-[100dvh] bg-gray-50">
      <SidebarNav orgName={orgName} userName={userName} userRole={userRole} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          userName={userName}
          userRole={userRole}
          orgName={orgName}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
