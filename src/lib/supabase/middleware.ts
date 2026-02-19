import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Forward pathname to server components via header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-next-pathname", request.nextUrl.pathname);

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Skip auth refresh for routes that don't need user sessions
  if (
    request.nextUrl.pathname.startsWith("/api/webhooks") ||
    request.nextUrl.pathname.startsWith("/api/demo")
  ) {
    return supabaseResponse;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protect dashboard routes — redirect to login if not authenticated
  if (!user && pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Protect /book routes — redirect to login if not authenticated
  if (!user && pathname.startsWith("/book")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (
    user &&
    (pathname === "/login" || pathname === "/signup") &&
    !request.nextUrl.searchParams.has("invite")
  ) {
    // Check org membership — route by role
    const { data: membership } = await supabase
      .from("org_members")
      .select("id, role, org_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    const url = request.nextUrl.clone();
    if (membership) {
      const adminRoles = ["admin", "travel_manager", "approver"];
      url.pathname = adminRoles.includes(membership.role) ? "/dashboard/corp" : "/book";
    } else {
      url.pathname = "/dashboard";
    }
    return NextResponse.redirect(url);
  }

  // For authenticated users on dashboard routes:
  // Check org membership (skip for onboarding, corp, and API routes)
  if (
    user &&
    pathname.startsWith("/dashboard") &&
    pathname !== "/dashboard/onboarding" &&
    !pathname.startsWith("/dashboard/corp")
  ) {
    // Check if user has an org membership
    const { data: membership } = await supabase
      .from("org_members")
      .select("id, role, org_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    // Org members on /dashboard should go to their appropriate view
    if (membership && pathname === "/dashboard") {
      const url = request.nextUrl.clone();
      const adminRoles = ["admin", "travel_manager", "approver"];
      url.pathname = adminRoles.includes(membership.role) ? "/dashboard/corp" : "/book";
      return NextResponse.redirect(url);
    }

    // Non-org users without completed profile → onboarding
    if (!membership) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (!profile || !profile.onboarding_completed) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard/onboarding";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
