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
 */
export function getRazorpayKeyId(): string {
  const key = process.env.RAZORPAY_KEY_ID;
  if (!key) throw new Error("RAZORPAY_KEY_ID must be set");
  return key;
}

/**
 * Returns the correct Razorpay key secret based on app mode.
 */
export function getRazorpayKeySecret(): string {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error("RAZORPAY_KEY_SECRET must be set");
  return secret;
}

// Log mode on module load (server-side only)
if (typeof window === "undefined") {
  console.log(`[SkySwift] Running in ${getAppMode()} mode`);
}
