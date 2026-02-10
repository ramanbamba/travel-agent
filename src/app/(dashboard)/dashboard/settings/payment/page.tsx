"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, CreditCard, Plus } from "lucide-react";
import Link from "next/link";
import { GlassCard, GlassButton } from "@/components/ui/glass";
import { PaymentMethodCard } from "@/components/payments/payment-method-card";
import { AddCardDialog } from "@/components/payments/add-card-dialog";
import { toast } from "@/hooks/use-toast";
import type { PaymentMethod } from "@/types";

function CardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-[var(--glass-radius-sm)] bg-[var(--glass-subtle)] p-3">
      <div className="h-10 w-14 animate-pulse rounded-lg bg-[var(--glass-standard)]" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-24 animate-pulse rounded-md bg-[var(--glass-standard)]" />
        <div className="h-3 w-16 animate-pulse rounded-md bg-[var(--glass-standard)]" />
      </div>
    </div>
  );
}

export default function PaymentSettingsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMethods = useCallback(async () => {
    try {
      const res = await fetch("/api/payments/methods");
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      setMethods(json.data ?? []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load payment methods",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  async function handleSetDefault(id: string) {
    try {
      const res = await fetch("/api/payments/default", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId: id }),
      });
      if (!res.ok) throw new Error();
      setMethods((prev) =>
        prev.map((m) => ({ ...m, is_default: m.id === id }))
      );
      toast({ title: "Default updated" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update default",
        variant: "destructive",
      });
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/payments/methods?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setMethods((prev) => prev.filter((m) => m.id !== id));
      toast({ title: "Card removed" });
      fetchMethods();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete card",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header with back button */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard/settings">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-[var(--glass-radius-sm)] text-[var(--glass-text-secondary)] transition-colors hover:bg-[var(--glass-subtle)]"
            aria-label="Back to settings"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--glass-text-primary)] sm:text-4xl">
            Payment Methods
          </h1>
          <p className="mt-1 text-sm text-[var(--glass-text-secondary)]">
            Manage your saved cards for flight bookings.
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <GlassCard tier="subtle" hover={false} padding="md">
          {/* Card header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--glass-text-secondary)]">
              <CreditCard className="h-4 w-4" />
              Saved Cards
            </div>
            <AddCardDialog
              trigger={
                <GlassButton variant="secondary" size="sm">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add card
                </GlassButton>
              }
              onCardAdded={fetchMethods}
            />
          </div>

          {/* Card list */}
          <div className="space-y-2">
            {loading ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : methods.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--glass-accent-blue-light)]">
                  <CreditCard className="h-6 w-6 text-[var(--glass-accent-blue)]" />
                </div>
                <p className="text-sm text-[var(--glass-text-secondary)]">
                  No payment methods added yet.
                </p>
                <p className="mt-1 text-xs text-[var(--glass-text-tertiary)]">
                  Add a card to start booking flights.
                </p>
              </div>
            ) : (
              methods.map((m) => (
                <PaymentMethodCard
                  key={m.id}
                  method={m}
                  onSetDefault={handleSetDefault}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
