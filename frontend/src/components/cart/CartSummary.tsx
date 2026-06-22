"use client";

import { useTranslations } from "next-intl";

interface CartSummaryProps {
  subtotal: number;
  shippingCost?: number;
  tax?: number;
  total?: number;
  compact?: boolean;
}

export function CartSummary({
  subtotal,
  shippingCost,
  tax,
  total,
  compact = false,
}: CartSummaryProps) {
  const t = useTranslations("cart");

  const computedTotal = total ?? subtotal + (shippingCost ?? 0) + (tax ?? 0);

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      <div className="flex justify-between text-sm">
        <span className="text-ws-text-secondary">{t("subtotal")}</span>
        <span className="text-ws-text tabular-nums font-medium">
          ${subtotal.toFixed(2)}
        </span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-ws-text-secondary">{t("shipping")}</span>
        <span className="text-ws-text tabular-nums">
          {shippingCost !== undefined
            ? `$${shippingCost.toFixed(2)}`
            : t("calculatedAtCheckout")}
        </span>
      </div>

      {tax !== undefined && (
        <div className="flex justify-between text-sm">
          <span className="text-ws-text-secondary">{t("tax")}</span>
          <span className="text-ws-text tabular-nums">
            ${tax.toFixed(2)}
          </span>
        </div>
      )}

      <div className="border-t border-ws-border pt-2 flex justify-between">
        <span className="text-sm font-semibold text-ws-text">
          {t("total")}
        </span>
        <span className="text-sm font-bold text-ws-text tabular-nums">
          ${computedTotal.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
