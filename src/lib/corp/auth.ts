import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = any;

/**
 * Authenticate a corp API request and return the member's org context.
 * Uses Supabase auth cookies to identify the user, then loads their org membership.
 * Returns org_id from session — never from client input.
 *
 * Also returns a service-role DB client for cross-table admin queries.
 */
export async function requireCorpAuth(options?: { roles?: string[] }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 }),
      member: null as DbRow,
      db: null as DbRow,
    };
  }

  const db = supabase as DbRow;
  const { data: member } = await db
    .from("org_members")
    .select("id, org_id, role, seniority_level, full_name, department")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .single();

  if (!member) {
    return {
      error: NextResponse.json({ data: null, error: "No active membership" }, { status: 403 }),
      member: null as DbRow,
      db: null as DbRow,
    };
  }

  // Role check if specified
  if (options?.roles && !options.roles.includes(member.role)) {
    return {
      error: NextResponse.json({ data: null, error: "Insufficient role" }, { status: 403 }),
      member: null as DbRow,
      db: null as DbRow,
    };
  }

  // Service role client for admin queries (bypasses RLS)
  const serviceDb = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  ) as DbRow;

  return { error: null, member, db: serviceDb };
}
