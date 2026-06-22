"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { WsCard, WsCardContent } from "@/components/ui/cyber-card";
import { api } from "@/lib/api";
import { Truck } from "lucide-react";
import type { CartItem } from "@/types/cart";

interface ShippingOption {
  shippingCost: number;
  zone: string;
}

interface ShippingOptionsProps {
  state: string;
  items: CartItem[];
  onSelect: (cost: number) => void;
}

export function ShippingOptions({
  state,
  items,
  onSelect,
}: ShippingOptionsProps) {
  const t = useTranslations("checkout");
  const tc = useTranslations("common");
  const [option, setOption] = useState<ShippingOption | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state) return;

    setLoading(true);
    api
      .post<ShippingOption>("/shipping/calculate", {
        state,
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
      })
      .then((data) => {
        setOption(data);
        onSelect(data.shippingCost);
      })
      .catch(() => {
        setOption({ shippingCost: 0, zone: "Standard" });
        onSelect(0);
      })
      .finally(() => setLoading(false));
  }, [state, items.length]);

  if (loading) {
    return (
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-ws-text">
          {t("shippingMethod")}
        </h2>
        <div className="h-16 bg-ws-surface border border-ws-border rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-ws-text">
        {t("shippingMethod")}
      </h2>
      {option && (
        <WsCard className="border-ws-blue">
          <WsCardContent className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-ws-blue shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-ws-text">
                {option.zone}
              </p>
              <p className="text-xs text-ws-text-muted">
                {t("estimatedDelivery", { days: "5-7" })}
              </p>
            </div>
            <span className="text-sm font-medium text-ws-text tabular-nums">
              {option.shippingCost > 0
                ? `$${option.shippingCost.toFixed(2)}`
                : t("freeShipping")}
            </span>
          </WsCardContent>
        </WsCard>
      )}
    </div>
  );
}
