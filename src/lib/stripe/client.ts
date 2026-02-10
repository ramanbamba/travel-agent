import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripeServer(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(key);
  }
  return _stripe;
}

/** @deprecated Use getStripeServer() instead */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripeServer() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
