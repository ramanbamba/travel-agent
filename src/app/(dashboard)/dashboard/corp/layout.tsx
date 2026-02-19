export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CorpDashboardShell } from "./corp-dashboard-shell";

export default async function CorpDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Load org membership — Phase 4 tables aren't typed, use any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: member } = await db
    .from("org_members")
    .select("id, org_id, role, full_name, organizations(name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .single();

  if (!member) {
    // Not part of any org — redirect to booking dashboard
    redirect("/dashboard");
  }

  const orgName = member.organizations?.name ?? "Organization";
  const allowedRoles = ["admin", "travel_manager", "approver"];
  const hasAccess = allowedRoles.includes(member.role);

  if (!hasAccess) {
    redirect("/dashboard");
  }

  return (
    <CorpDashboardShell
      orgName={orgName}
      userName={member.full_name ?? user.email ?? "User"}
      userRole={member.role}
      orgId={member.org_id}
      memberId={member.id}
    >
      {children}
    </CorpDashboardShell>
  );
}
