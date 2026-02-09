"use client";

import { useEffect, useState, useCallback } from "react";
import { CreditCard, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentMethodCard } from "@/components/payments/payment-method-card";
import { AddCardDialog } from "@/components/payments/add-card-dialog";
import { toast } from "@/hooks/use-toast";
import type { PaymentMethod } from "@/types";

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
      // Re-fetch to get updated defaults
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
    <div className="animate-in fade-in duration-300 p-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/settings">
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Back to settings">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Payment Methods</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your saved cards for flight bookings.
          </p>
        </div>
      </div>

      <div className="mt-6 max-w-2xl">
        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4" />
              Saved Cards
            </CardTitle>
            <AddCardDialog
              trigger={
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Add card
                </Button>
              }
              onCardAdded={fetchMethods}
            />
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-lg bg-white/5"
                  />
                ))}
              </div>
            ) : methods.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No payment methods added yet.
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
