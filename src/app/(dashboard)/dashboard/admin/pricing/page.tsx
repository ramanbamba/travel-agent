"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, Percent, Save, Shield, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import type { PricingRule } from "@/lib/pricing/pricing-engine";

export default function AdminPricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rule, setRule] = useState<PricingRule | null>(null);

  // Form state
  const [markupType, setMarkupType] = useState<"percentage" | "fixed">("percentage");
  const [markupValue, setMarkupValue] = useState("1.5");
  const [markupCap, setMarkupCap] = useState("50");
  const [serviceFeeType, setServiceFeeType] = useState<"percentage" | "fixed">("fixed");
  const [serviceFeeValue, setServiceFeeValue] = useState("12");
  const [minTotalFee, setMinTotalFee] = useState("5");

  useEffect(() => {
    async function fetchRule() {
      try {
        const res = await fetch("/api/pricing/rules");
        if (res.status === 403) {
          router.replace("/dashboard");
          return;
        }
        const json = await res.json();
        if (json.data) {
          const r = json.data as PricingRule;
          setRule(r);
          setMarkupType(r.markup_type);
          setMarkupValue(String(r.markup_value));
          setMarkupCap(r.markup_cap !== null ? String(r.markup_cap) : "");
          setServiceFeeType(r.service_fee_type);
          setServiceFeeValue(String(r.service_fee_value));
          setMinTotalFee(String(r.min_total_fee));
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to load pricing rules",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchRule();
  }, [router]);

  async function handleSave() {
    if (!rule) return;
    setSaving(true);
    try {
      const res = await fetch("/api/pricing/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: rule.id,
          markup_type: markupType,
          markup_value: markupValue,
          markup_cap: markupCap || null,
          service_fee_type: serviceFeeType,
          service_fee_value: serviceFeeValue,
          min_total_fee: minTotalFee,
        }),
      });
      const json = await res.json();
      if (json.error) {
        toast({
          title: "Error",
          description: json.message || "Failed to save",
          variant: "destructive",
        });
      } else {
        setRule(json.data);
        toast({ title: "Saved", description: "Pricing rule updated" });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to save pricing rule",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  // Preview calculation
  const exampleFare = 500;
  const markup =
    markupType === "percentage"
      ? Math.min(
          exampleFare * (Number(markupValue) / 100),
          markupCap ? Number(markupCap) : Infinity
        )
      : Number(markupValue);
  const serviceFee =
    serviceFeeType === "percentage"
      ? exampleFare * (Number(serviceFeeValue) / 100)
      : Number(serviceFeeValue);
  const totalFee = markup + serviceFee;
  const adjustedServiceFee =
    totalFee < Number(minTotalFee) ? Number(minTotalFee) - markup : serviceFee;
  const customerTotal = exampleFare + markup + adjustedServiceFee;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!rule) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No pricing rule found. Create one in the database first.</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300 p-6">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">Pricing Rules</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Configure markup and service fees applied to flight searches.
      </p>

      <div className="mt-6 grid max-w-4xl gap-6 lg:grid-cols-2">
        {/* Markup */}
        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Percent className="h-4 w-4" />
              Markup (Hidden in Fare)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={markupType} onValueChange={(v) => setMarkupType(v as "percentage" | "fixed")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                Value {markupType === "percentage" ? "(%)" : "($)"}
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={markupValue}
                onChange={(e) => setMarkupValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Cap ($) — max markup per booking</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="No cap"
                value={markupCap}
                onChange={(e) => setMarkupCap(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Service fee */}
        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4" />
              Service Fee (Visible to Customer)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={serviceFeeType} onValueChange={(v) => setServiceFeeType(v as "percentage" | "fixed")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                Value {serviceFeeType === "percentage" ? "(%)" : "($)"}
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={serviceFeeValue}
                onChange={(e) => setServiceFeeValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Minimum total fee ($) — markup + service fee floor</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={minTotalFee}
                onChange={(e) => setMinTotalFee(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="border-white/10 bg-white/[0.02] lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Preview — $500 supplier fare</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supplier cost</span>
                <span>${exampleFare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">+ Markup (hidden)</span>
                <span>${markup.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">+ Service fee (visible)</span>
                <span>${adjustedServiceFee.toFixed(2)}</span>
              </div>
              <Separator className="bg-white/5" />
              <div className="flex justify-between font-medium">
                <span>Customer pays</span>
                <span>${customerTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Your revenue</span>
                <span>${(markup + adjustedServiceFee).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 max-w-4xl">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Pricing Rule
        </Button>
      </div>
    </div>
  );
}
