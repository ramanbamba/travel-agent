import Razorpay from "razorpay";
import crypto from "crypto";
import { getRazorpayKeyId, getRazorpayKeySecret, getAppMode } from "@/lib/config/app-mode";

let instance: Razorpay | null = null;
let instanceMode: string | null = null;

/**
 * Lazy-init Razorpay SDK singleton.
 * Re-creates client if app mode changes (sandbox ↔ live).
 */
function getRazorpay(): Razorpay {
  const mode = getAppMode();
  if (!instance || instanceMode !== mode) {
    instance = new Razorpay({
      key_id: getRazorpayKeyId(),
      key_secret: getRazorpayKeySecret(),
    });
    instanceMode = mode;
  }
  return instance;
}

/**
 * Create a Razorpay order for payment collection.
 * Amount is in the smallest currency unit (paise for INR).
 */
export async function createOrder(
  amountPaise: number,
  currency: string,
  bookingReference: string
): Promise<{
  id: string;
  amount: number;
  currency: string;
  status: string;
}> {
  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: currency.toUpperCase(),
    receipt: bookingReference,
    notes: {
      booking_reference: bookingReference,
    },
  });
  return {
    id: order.id,
    amount: order.amount as number,
    currency: order.currency,
    status: order.status,
  };
}

/**
 * Verify Razorpay payment signature.
 * Returns true if the signature is valid (payment is authentic).
 */
export function verifyPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", getRazorpayKeySecret())
    .update(body)
    .digest("hex");
  return expectedSignature === razorpaySignature;
}

/**
 * Refund a Razorpay payment (full refund).
 */
export async function refundPayment(
  paymentId: string,
  amountPaise?: number
): Promise<{ id: string; status: string }> {
  const razorpay = getRazorpay();
  const refund = await razorpay.payments.refund(paymentId, {
    ...(amountPaise ? { amount: amountPaise } : {}),
  });
  return {
    id: refund.id,
    status: refund.status ?? "processed",
  };
}

/**
 * Fetch payment details.
 */
export async function getPayment(paymentId: string) {
  const razorpay = getRazorpay();
  return razorpay.payments.fetch(paymentId);
}
