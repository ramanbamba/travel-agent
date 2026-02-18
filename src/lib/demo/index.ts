/**
 * Demo Mode Utilities
 *
 * DEMO_MODE=true enables:
 * - /demo landing page accessible
 * - /demo/whatsapp simulator available
 * - Flight searches return Indian-market mock data
 * - Bookings skip Duffel/Razorpay
 */

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

export function getDemoPassword(): string {
  return process.env.DEMO_PASSWORD || "skyswift2025";
}
