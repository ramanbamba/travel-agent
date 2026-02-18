import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmployeeShell } from "./employee-shell";

export default async function EmployeeBookLayout({
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

  // Load org membership
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
    redirect("/dashboard");
  }

  return (
    <EmployeeShell
      userName={member.full_name ?? user.email ?? "User"}
      orgName={member.organizations?.name ?? "Organization"}
      memberId={member.id}
      orgId={member.org_id}
    >
      {children}
    </EmployeeShell>
  );
}
