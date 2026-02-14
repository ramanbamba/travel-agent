import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { recordReferralSignup } from "@/lib/referrals";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // ignore — handled by middleware
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Process referral code if present
      const referralCode = cookieStore.get("referral_code")?.value;
      if (referralCode) {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            await recordReferralSignup(supabase, referralCode, user.id);
          }
        } catch (err) {
          console.error("[auth callback] Referral processing failed:", err);
        }
        // Clear the referral cookie
        cookieStore.set("referral_code", "", { maxAge: 0, path: "/" });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // OAuth error — redirect to login with error
  return NextResponse.redirect(`${origin}/login`);
}
