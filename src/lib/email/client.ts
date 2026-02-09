import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

// For dev/testing with Resend free tier, use the sandbox sender.
// Replace with your verified domain sender in production.
export const FROM_EMAIL = "Travel Agent <onboarding@resend.dev>";
