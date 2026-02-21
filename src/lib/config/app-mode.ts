/** Application mode: "sandbox" for test data, "live" for real bookings */
export type AppMode = "sandbox" | "live";

export function getAppMode(): AppMode {
  const mode = process.env.NEXT_PUBLIC_APP_MODE;
  if (mode === "live") return "live";
  return "sandbox"; // default to sandbox for safety
}

export function isSandbox(): boolean {
  return getAppMode() === "sandbox";
}

export function isLiveMode(): boolean {
  return getAppMode() === "live";
}

/**
 * Returns the correct Duffel API token based on app mode.
 * Live mode uses DUFFEL_LIVE_TOKEN, sandbox uses DUFFEL_API_TOKEN.
 */
export function getDuffelToken(): string {
  const mode = getAppMode();
  if (mode === "live") {
    const token = process.env.DUFFEL_LIVE_TOKEN;
    if (!token) throw new Error("DUFFEL_LIVE_TOKEN must be set in live mode");
    return token;
  }
  const token = process.env.DUFFEL_API_TOKEN;
  if (!token) throw new Error("DUFFEL_API_TOKEN must be set");
  return token;
}

/**
 * Returns the correct Razorpay key ID based on app mode.
 * Live mode: RAZORPAY_LIVE_KEY_ID (falls back to RAZORPAY_KEY_ID)
 * Sandbox: RAZORPAY_KEY_ID
 */
export function getRazorpayKeyId(): string {
  const mode = getAppMode();
  if (mode === "live") {
    const key = process.env.RAZORPAY_LIVE_KEY_ID ?? process.env.RAZORPAY_KEY_ID;
    if (!key) throw new Error("RAZORPAY_LIVE_KEY_ID or RAZORPAY_KEY_ID must be set in live mode");
    return key;
  }
  const key = process.env.RAZORPAY_KEY_ID;
  if (!key) throw new Error("RAZORPAY_KEY_ID must be set");
  return key;
}

/**
 * Returns the correct Razorpay key secret based on app mode.
 * Live mode: RAZORPAY_LIVE_KEY_SECRET (falls back to RAZORPAY_KEY_SECRET)
 * Sandbox: RAZORPAY_KEY_SECRET
 */
export function getRazorpayKeySecret(): string {
  const mode = getAppMode();
  if (mode === "live") {
    const secret = process.env.RAZORPAY_LIVE_KEY_SECRET ?? process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error("RAZORPAY_LIVE_KEY_SECRET or RAZORPAY_KEY_SECRET must be set in live mode");
    return secret;
  }
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error("RAZORPAY_KEY_SECRET must be set");
  return secret;
}

/**
 * Returns the client-side Razorpay key ID based on app mode.
 * Used by the frontend RazorpayPayment component.
 */
export function getPublicRazorpayKeyId(): string {
  const mode = getAppMode();
  if (mode === "live") {
    return process.env.NEXT_PUBLIC_RAZORPAY_LIVE_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";
  }
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";
}

/**
 * Returns a summary of the current live/sandbox configuration.
 * Used by admin dashboards to verify config before going live.
 */
export function getLiveModeStatus(): {
  mode: AppMode;
  duffelConfigured: boolean;
  razorpayConfigured: boolean;
  stripeConfigured: boolean;
} {
  const mode = getAppMode();
  return {
    mode,
    duffelConfigured: mode === "live"
      ? !!process.env.DUFFEL_LIVE_TOKEN
      : !!process.env.DUFFEL_API_TOKEN,
    razorpayConfigured: mode === "live"
      ? !!(process.env.RAZORPAY_LIVE_KEY_ID ?? process.env.RAZORPAY_KEY_ID)
        && !!(process.env.RAZORPAY_LIVE_KEY_SECRET ?? process.env.RAZORPAY_KEY_SECRET)
      : !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET,
    stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
  };
}

