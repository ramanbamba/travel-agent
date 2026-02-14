import { redirect } from "next/navigation";
import { cookies } from "next/headers";

interface ReferralPageProps {
  params: Promise<{ code: string }>;
}

/**
 * Referral landing page: /r/XXXXXX
 * Stores the referral code in a cookie and redirects to signup.
 * The signup flow reads this cookie to apply the referral.
 */
export default async function ReferralPage({ params }: ReferralPageProps) {
  const { code } = await params;
  const normalizedCode = code.toUpperCase().trim();

  if (normalizedCode.length === 6) {
    const cookieStore = await cookies();
    cookieStore.set("referral_code", normalizedCode, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
  }

  redirect(`/signup?ref=${normalizedCode}`);
}
