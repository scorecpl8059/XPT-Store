"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Trash2, Minus, Plus } from "lucide-react";
import type { CartItem as CartItemType } from "@/types/cart";

interface CartItemProps {
  item: CartItemType;
  productName?: string;
  productImage?: string;
  price?: number;
  variantLabel?: string;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export function CartItem({
  item,
  productName,
  productImage,
  price,
  variantLabel,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) {
  const t = useTranslations("cart");

  return (
    <div className="flex gap-3 py-3">
      {/* Image */}
      <Link
        href={`/products/${item.productId}` as any}
        className="shrink-0 w-16 h-16 rounded-md bg-ws-surface border border-ws-border overflow-hidden"
      >
        {productImage ? (
          <img
            src={productImage}
            alt={productName || ""}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-ws-surface" />
        )}
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${item.productId}` as any}
          className="text-sm font-medium text-ws-text hover:text-ws-blue transition-colors line-clamp-1"
        >
          {productName || item.productId}
        </Link>
        {variantLabel && (
          <p className="text-xs text-ws-text-muted mt-0.5">{variantLabel}</p>
        )}
        {price !== undefined && (
          <p className="text-sm font-medium text-ws-text tabular-nums mt-1">
            ${price.toFixed(2)}
          </p>
        )}

        {/* Quantity + Remove */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center border border-ws-border rounded">
            <button
              onClick={() => onUpdateQuantity(item.quantity - 1)}
              className="p-1 text-ws-text-muted hover:text-ws-text transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="px-2 text-xs font-medium text-ws-text tabular-nums min-w-[1.5rem] text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.quantity + 1)}
              className="p-1 text-ws-text-muted hover:text-ws-text transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <button
            onClick={onRemove}
            className="text-ws-text-muted hover:text-ws-red transition-colors p-1"
            aria-label={t("remove")}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
