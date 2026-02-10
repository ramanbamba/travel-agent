"use client";

import { useState, useEffect } from "react";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe/browser";
import { CreditCard, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PaymentMethod } from "@/types";

interface PaymentSelectorProps {
  amount: number;
  currency: string;
  onPay: (paymentMethodId: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

function InlineCardForm({
  onCardSaved,
}: {
  onCardSaved: (pm: PaymentMethod) => void;
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
      const setupRes = await fetch("/api/payments/setup-intent", {
        method: "POST",
      });
      const setupJson = await setupRes.json();
      if (!setupRes.ok) {
        throw new Error(setupJson.error || setupJson.message || "Failed to create setup intent");
      }
      const clientSecret = setupJson.data?.clientSecret;
      if (!clientSecret) throw new Error("No client secret returned");

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
        setError("Card setup failed");
        return;
      }

      const pmId =
        typeof setupIntent.payment_method === "string"
          ? setupIntent.payment_method
          : setupIntent.payment_method.id;

      const confirmRes = await fetch("/api/payments/confirm-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId: pmId }),
      });

      if (!confirmRes.ok) throw new Error("Failed to save card");
      const confirmJson = await confirmRes.json();
      onCardSaved(confirmJson.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "14px",
                color: "#e5e5e5",
                "::placeholder": { color: "#737373" },
              },
              invalid: { color: "#ef4444" },
            },
          }}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={!stripe || loading}
        className="w-full"
      >
        {loading ? "Saving..." : "Save & Use This Card"}
      </Button>
    </form>
  );
}

function SelectorContent({
  amount,
  currency,
  onPay,
  onCancel,
  disabled,
}: PaymentSelectorProps) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/payments/methods");
        if (!res.ok) throw new Error();
        const json = await res.json();
        const cards = (json.data ?? []) as PaymentMethod[];
        setMethods(cards);
        const defaultCard = cards.find((c) => c.is_default);
        if (defaultCard) setSelected(defaultCard.id);
        else if (cards.length > 0) setSelected(cards[0].id);
        if (cards.length === 0) setShowAddCard(true);
      } catch {
        setShowAddCard(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleCardSaved(pm: PaymentMethod) {
    setMethods((prev) => [...prev, pm]);
    setSelected(pm.id);
    setShowAddCard(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p id="payment-method-label" className="text-xs font-medium text-muted-foreground">
        Select payment method
      </p>

      <div role="radiogroup" aria-labelledby="payment-method-label">
      {methods.map((m) => (
        <label
          key={m.id}
          className={`mb-3 flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
            selected === m.id
              ? "border-primary bg-primary/5"
              : "border-white/10 hover:bg-white/[0.03]"
          }`}
        >
          <input
            type="radio"
            name="payment-method"
            value={m.id}
            checked={selected === m.id}
            onChange={() => setSelected(m.id)}
            aria-label={`${m.card_brand} ending in ${m.card_last_four}`}
            className="sr-only"
          />
          <div
            className={`h-4 w-4 rounded-full border-2 ${
              selected === m.id ? "border-primary bg-primary" : "border-white/20"
            }`}
          >
            {selected === m.id && (
              <div className="m-0.5 h-2 w-2 rounded-full bg-background" />
            )}
          </div>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {m.card_brand.charAt(0).toUpperCase() + m.card_brand.slice(1)}{" "}
            &bull;&bull;&bull;&bull; {m.card_last_four}
          </span>
        </label>
      ))}
      </div>

      {!showAddCard && (
        <button
          type="button"
          onClick={() => setShowAddCard(true)}
          className="flex w-full items-center gap-2 rounded-lg border border-dashed border-white/10 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-white/[0.03]"
        >
          <Plus className="h-4 w-4" />
          Add new card
        </button>
      )}

      {showAddCard && (
        <Elements stripe={getStripe()}>
          <InlineCardForm onCardSaved={handleCardSaved} />
        </Elements>
      )}

      <div className="flex gap-2 pt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={!selected || disabled}
          onClick={() => selected && onPay(selected)}
          className="flex-1"
        >
          {disabled ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Pay ${amount.toLocaleString()} {currency}
        </Button>
      </div>
    </div>
  );
}

export function PaymentSelector(props: PaymentSelectorProps) {
  return <SelectorContent {...props} />;
}
