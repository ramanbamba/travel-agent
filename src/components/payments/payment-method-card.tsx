"use client";

import { Star, Trash2 } from "lucide-react";
import { GlassPill } from "@/components/ui/glass";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/types";

interface PaymentMethodCardProps {
  method: PaymentMethod;
  onSetDefault?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const brandConfig: Record<string, { label: string; gradient: string; text: string }> = {
  visa: {
    label: "Visa",
    gradient: "from-[#1a1f71] to-[#2557d6]",
    text: "text-white",
  },
  mastercard: {
    label: "Mastercard",
    gradient: "from-[#eb001b] to-[#f79e1b]",
    text: "text-white",
  },
  amex: {
    label: "Amex",
    gradient: "from-[#007bc1] to-[#00a3e0]",
    text: "text-white",
  },
  american_express: {
    label: "Amex",
    gradient: "from-[#007bc1] to-[#00a3e0]",
    text: "text-white",
  },
  discover: {
    label: "Discover",
    gradient: "from-[#ff6000] to-[#ff8a3d]",
    text: "text-white",
  },
};

function getBrand(brand: string) {
  const b = brand.toLowerCase();
  return brandConfig[b] ?? {
    label: brand.charAt(0).toUpperCase() + brand.slice(1),
    gradient: "from-[var(--glass-text-tertiary)] to-[var(--glass-text-secondary)]",
    text: "text-white",
  };
}

export function PaymentMethodCard({
  method,
  onSetDefault,
  onDelete,
}: PaymentMethodCardProps) {
  const brand = getBrand(method.card_brand);

  return (
    <div className="flex items-center gap-3 rounded-[var(--glass-radius-sm)] bg-[var(--glass-subtle)] p-3">
      {/* Mini card visualization */}
      <div
        className={cn(
          "flex h-10 w-14 shrink-0 items-end justify-start rounded-lg bg-gradient-to-br p-1.5 shadow-sm",
          brand.gradient
        )}
      >
        <span className={cn("text-[9px] font-bold leading-none", brand.text)}>
          {brand.label}
        </span>
      </div>

      {/* Card info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--glass-text-primary)]">
            &bull;&bull;&bull;&bull; {method.card_last_four}
          </span>
          {method.is_default && (
            <GlassPill variant="green" size="sm">
              <Star className="h-2.5 w-2.5" />
              Default
            </GlassPill>
          )}
        </div>
        <p className="text-xs text-[var(--glass-text-tertiary)]">
          Expires {String(method.card_exp_month).padStart(2, "0")}/
          {method.card_exp_year}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {!method.is_default && onSetDefault && (
          <button
            onClick={() => onSetDefault(method.id)}
            className="flex h-8 items-center gap-1 rounded-[var(--glass-radius-sm)] px-2 text-xs font-medium text-[var(--glass-text-tertiary)] transition-colors hover:bg-[var(--glass-standard)] hover:text-[var(--glass-text-primary)]"
          >
            <Star className="h-3 w-3" />
            <span className="hidden sm:inline">Set default</span>
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(method.id)}
            aria-label="Delete card"
            className="flex h-8 w-8 items-center justify-center rounded-[var(--glass-radius-sm)] text-[var(--glass-text-tertiary)] transition-colors hover:bg-[var(--glass-accent-red-light)] hover:text-[var(--glass-accent-red)]"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
