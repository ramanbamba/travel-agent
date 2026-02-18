import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { GradientMesh } from "@/components/layout/gradient-mesh";

export default async function DashboardLayout({
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

  // Check if current route needs custom layout (no AppShell)
  const headerList = await headers();
  const pathname = headerList.get("x-next-pathname") ?? "";
  const isOnboarding = pathname.includes("/onboarding");
  const isCorp = pathname.includes("/dashboard/corp");

  // Onboarding and corporate dashboard have their own layouts
  if (isOnboarding || isCorp) {
    return <>{children}</>;
  }

  return (
    <>
      <GradientMesh />
      <AppShell email={user.email ?? ""}>{children}</AppShell>
    </>
  );
}
