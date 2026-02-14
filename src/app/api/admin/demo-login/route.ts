import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

const DEMO_EMAILS = new Set([
  "demo-new@skyswift.app",
  "demo-learning@skyswift.app",
  process.env.DEMO_USER_EMAIL ?? "demo@skyswift.app",
]);

const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD ?? "demo123456";

/**
 * POST /api/admin/demo-login
 * Signs out current user and signs in as the specified demo user.
 * Admin-only: requires current user to be in ADMIN_EMAILS.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Unauthorized", message: "Not logged in" },
      { status: 401 }
    );
  }

  // Admin check
  if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(user.email ?? "")) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Forbidden", message: "Not authorized" },
      { status: 403 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Bad request", message: "Invalid JSON" },
      { status: 400 }
    );
  }

  const { email } = body as { email: string };

  if (!email || !DEMO_EMAILS.has(email)) {
    return NextResponse.json<ApiResponse>(
      { data: null, error: "Bad request", message: "Invalid demo user email" },
      { status: 400 }
    );
  }

  // Sign out current session
  await supabase.auth.signOut();

  // Sign in as demo user
  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email,
      password: DEMO_PASSWORD,
    });

  if (signInError || !signInData.session) {
    return NextResponse.json<ApiResponse>(
      {
        data: null,
        error: "Auth error",
        message: `Failed to sign in as ${email}: ${signInError?.message ?? "No session"}`,
      },
      { status: 500 }
    );
  }

  return NextResponse.json<ApiResponse>({
    data: {
      email,
      userId: signInData.user.id,
      message: `Signed in as ${email}`,
    },
    error: null,
    message: "Demo login successful",
  });
}
