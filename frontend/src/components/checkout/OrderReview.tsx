"use client";

import { useTranslations } from "next-intl";
import { CartSummary } from "@/components/cart/CartSummary";
import type { CartItem } from "@/types/cart";

interface ProductInfo {
  name: string;
  image?: string;
  price: number;
}

interface OrderReviewProps {
  items: CartItem[];
  productInfoMap: Record<string, ProductInfo>;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  shippingAddress: {
    recipientName: string;
    street1: string;
    city: string;
    state: string;
    zipCode: string;
  };
  poNumber?: string;
  notes?: string;
}

export function OrderReview({
  items,
  productInfoMap,
  subtotal,
  shippingCost,
  tax,
  total,
  shippingAddress,
  poNumber,
  notes,
}: OrderReviewProps) {
  const t = useTranslations("checkout");
  const to = useTranslations("order");

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-ws-text">
        {t("reviewOrder")}
      </h2>

      {/* Items */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-ws-text-secondary uppercase tracking-wider">
          {to("items")}
        </h3>
        <div className="space-y-2">
          {items.map((item) => {
            const info = productInfoMap[item.productId];
            return (
              <div
                key={`${item.productId}-${item.variantId || "base"}`}
                className="flex justify-between text-sm"
              >
                <span className="text-ws-text">
                  {info?.name || item.productId} × {item.quantity}
                </span>
                <span className="text-ws-text tabular-nums">
                  ${((info?.price ?? 0) * item.quantity).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shipping address */}
      <div className="space-y-1">
        <h3 className="text-xs font-medium text-ws-text-secondary uppercase tracking-wider">
          {t("shippingAddress")}
        </h3>
        <p className="text-sm text-ws-text">{shippingAddress.recipientName}</p>
        <p className="text-xs text-ws-text-secondary">
          {shippingAddress.street1}, {shippingAddress.city},{" "}
          {shippingAddress.state} {shippingAddress.zipCode}
        </p>
      </div>

      {/* PO / Notes */}
      {poNumber && (
        <div>
          <h3 className="text-xs font-medium text-ws-text-secondary uppercase tracking-wider">
            {t("poNumber")}
          </h3>
          <p className="text-sm text-ws-text">{poNumber}</p>
        </div>
      )}
      {notes && (
        <div>
          <h3 className="text-xs font-medium text-ws-text-secondary uppercase tracking-wider">
            {t("orderNotes")}
          </h3>
          <p className="text-sm text-ws-text">{notes}</p>
        </div>
      )}

      {/* Totals */}
      <div className="border-t border-ws-border pt-3">
        <CartSummary
          subtotal={subtotal}
          shippingCost={shippingCost}
          tax={tax}
          total={total}
        />
      </div>
    </div>
  );
}
