"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils/format-india";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open(): void;
  on(event: string, handler: (response: { error: { description: string } }) => void): void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayPaymentProps {
  amount: number;
  currency: string;
  description: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  onSuccess: (response: RazorpayResponse) => void;
  onFailure: (error: string) => void;
  disabled?: boolean;
  confirmed?: boolean;
}

let scriptLoaded = false;
let scriptLoading = false;

function loadRazorpayScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  if (scriptLoading) {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (scriptLoaded) {
          clearInterval(check);
          resolve();
        }
      }, 100);
    });
  }

  scriptLoading = true;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      resolve();
    };
    script.onerror = () => {
      scriptLoading = false;
      reject(new Error("Failed to load Razorpay checkout"));
    };
    document.body.appendChild(script);
  });
}

export function RazorpayPayment({
  amount,
  currency,
  description,
  userName,
  userEmail,
  userPhone,
  onSuccess,
  onFailure,
  disabled = false,
  confirmed = false,
}: RazorpayPaymentProps) {
  const [paying, setPaying] = useState(false);

  const handlePay = useCallback(async () => {
    if (!confirmed) return;
    setPaying(true);

    try {
      // Step 1: Create Razorpay order
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, currency, bookingReference: `bk-${Date.now()}` }),
      });

      const orderJson = await orderRes.json();
      if (!orderRes.ok || orderJson.error) {
        throw new Error(orderJson.message || "Failed to create payment order");
      }

      const { orderId, keyId, amount: orderAmount, currency: orderCurrency } = orderJson.data;

      // Step 2: Load Razorpay script
      await loadRazorpayScript();

      // Step 3: Open Razorpay checkout
      const options: RazorpayOptions = {
        key: keyId,
        amount: orderAmount,
        currency: orderCurrency,
        name: "SkySwift",
        description,
        order_id: orderId,
        prefill: {
          name: userName,
          email: userEmail,
          contact: userPhone,
        },
        theme: {
          color: "#0A84FF",
        },
        handler: (response) => {
          setPaying(false);
          onSuccess(response);
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        setPaying(false);
        onFailure(response.error.description || "Payment failed. Please try again.");
      });
      rzp.open();
    } catch (err) {
      setPaying(false);
      onFailure(err instanceof Error ? err.message : "Payment failed");
    }
  }, [amount, currency, description, userName, userEmail, userPhone, onSuccess, onFailure, confirmed]);

  return (
    <button
      onClick={handlePay}
      disabled={disabled || paying || !confirmed}
      className={cn(
        "flex w-full items-center justify-center gap-2",
        "rounded-[var(--glass-radius-button)] px-4 py-3",
        "text-sm font-semibold text-white",
        "bg-[#0A84FF]",
        "shadow-[0_1px_3px_rgba(10,132,255,0.3)]",
        "transition-all duration-200 ease-spring",
        "hover:opacity-90 active:scale-[0.97]",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
    >
      {paying ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : null}
      {paying ? "Processing..." : `Pay ${formatPrice(amount, currency)}`}
    </button>
  );
}
