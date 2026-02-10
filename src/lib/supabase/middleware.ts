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

  // Skip auth refresh for webhook routes (no user session)
  if (request.nextUrl.pathname.startsWith("/api/webhooks")) {
    return supabaseResponse;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect dashboard routes — redirect to login if not authenticated
  if (
    !user &&
    request.nextUrl.pathname.startsWith("/dashboard")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (
    user &&
    (request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/signup")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Onboarding gate: redirect to onboarding if profile is incomplete
  if (
    user &&
    request.nextUrl.pathname.startsWith("/dashboard") &&
    request.nextUrl.pathname !== "/dashboard/onboarding"
  ) {
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

  return supabaseResponse;
}
