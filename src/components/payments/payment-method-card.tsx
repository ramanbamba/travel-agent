"use client";

import { CreditCard, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PaymentMethod } from "@/types";

interface PaymentMethodCardProps {
  method: PaymentMethod;
  onSetDefault?: (id: string) => void;
  onDelete?: (id: string) => void;
}

function brandIcon(brand: string) {
  const b = brand.toLowerCase();
  if (b === "visa") return "Visa";
  if (b === "mastercard") return "MC";
  if (b === "amex" || b === "american_express") return "Amex";
  if (b === "discover") return "Disc";
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

export function PaymentMethodCard({
  method,
  onSetDefault,
  onDelete,
}: PaymentMethodCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/5">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {brandIcon(method.card_brand)}
            </span>
            <span className="text-sm text-muted-foreground">
              &bull;&bull;&bull;&bull; {method.card_last_four}
            </span>
            {method.is_default && (
              <Badge
                variant="outline"
                className="border-green-500/20 bg-green-500/10 text-green-400 text-[10px]"
              >
                Default
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Expires {String(method.card_exp_month).padStart(2, "0")}/
            {method.card_exp_year}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {!method.is_default && onSetDefault && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSetDefault(method.id)}
            className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Star className="h-3 w-3" />
            Set default
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(method.id)}
            className="h-8 w-8 text-muted-foreground hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
