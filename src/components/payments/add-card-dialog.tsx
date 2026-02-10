"use client";

import { useState } from "react";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe/browser";
import { GlassButton, GlassDialog } from "@/components/ui/glass";

interface AddCardDialogProps {
  trigger: React.ReactNode;
  onCardAdded: () => void;
}

function CardForm({
  onCardAdded,
  onClose,
}: {
  onCardAdded: () => void;
  onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Create SetupIntent
      const setupRes = await fetch("/api/payments/setup-intent", {
        method: "POST",
      });
      const setupJson = await setupRes.json();
      if (!setupRes.ok) {
        throw new Error(setupJson.error || setupJson.message || "Failed to create setup intent");
      }
      const clientSecret = setupJson.data?.clientSecret;
      if (!clientSecret) throw new Error("No client secret returned");

      // 2. Confirm card setup via Stripe.js
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Card element not found");

      const { error: stripeError, setupIntent } =
        await stripe.confirmCardSetup(clientSecret, {
          payment_method: { card: cardElement },
        });

      if (stripeError) {
        setError(stripeError.message ?? "Card setup failed");
        return;
      }

      if (!setupIntent?.payment_method) {
        setError("Card setup failed — no payment method returned");
        return;
      }

      // 3. Save to our DB
      const pmId =
        typeof setupIntent.payment_method === "string"
          ? setupIntent.payment_method
          : setupIntent.payment_method.id;

      const confirmRes = await fetch("/api/payments/confirm-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId: pmId }),
      });

      if (!confirmRes.ok) {
        const json = await confirmRes.json();
        throw new Error(json.message ?? "Failed to save card");
      }

      onCardAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-[var(--glass-radius-sm)] border border-[var(--glass-border)] bg-[var(--glass-subtle)] p-4">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "var(--glass-text-primary-raw, #1c1c1e)",
                "::placeholder": {
                  color: "var(--glass-text-tertiary-raw, #8e8e93)",
                },
              },
              invalid: { color: "#ef4444" },
            },
          }}
        />
      </div>
      {error && (
        <p className="text-sm text-[var(--glass-accent-red)]">{error}</p>
      )}
      <GlassButton
        type="submit"
        disabled={!stripe || loading}
        className="w-full"
        size="lg"
      >
        {loading ? "Saving..." : "Add Card"}
      </GlassButton>
    </form>
  );
}

export function AddCardDialog({ trigger, onCardAdded }: AddCardDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <GlassDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Add Payment Method"
        description="Your card details are securely handled by Stripe. We never store your full card number."
      >
        <Elements stripe={getStripe()}>
          <CardForm
            onCardAdded={onCardAdded}
            onClose={() => setOpen(false)}
          />
        </Elements>
      </GlassDialog>
    </>
  );
}
