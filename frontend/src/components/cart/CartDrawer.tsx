"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useCart } from "@/hooks/use-cart";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";
import { WsButton } from "@/components/ui/cyber-button";
import { api } from "@/lib/api";
import type { Product } from "@/types/product";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { ShoppingBag } from "lucide-react";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProductInfo {
  name: string;
  image?: string;
  price: number;
  variantLabel?: string;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const t = useTranslations("cart");
  const router = useRouter();
  const { items, updateQuantity, removeItem } = useCart();
  const [productInfoMap, setProductInfoMap] = useState<
    Record<string, ProductInfo>
  >({});

  // Fetch product details for items in cart
  const fetchProductInfo = useCallback(async () => {
    const ids = [...new Set(items.map((i) => i.productId))];
    const toFetch = ids.filter((id) => !productInfoMap[id]);

    if (toFetch.length === 0) return;

    const results = await Promise.allSettled(
      toFetch.map((id) =>
        api.get<Product & { variants?: { variantId: string; attributes: Record<string, string>; price: number }[] }>(
          `/products/${id}`
        )
      )
    );

    const newMap = { ...productInfoMap };
    results.forEach((result, idx) => {
      if (result.status === "fulfilled" && result.value) {
        const p = result.value;
        newMap[toFetch[idx]] = {
          name: p.name,
          image: p.images?.[0],
          price: p.basePrice,
        };
      }
    });
    setProductInfoMap(newMap);
  }, [items, productInfoMap]);

  useEffect(() => {
    if (open && items.length > 0) {
      fetchProductInfo();
    }
  }, [open, items.length, fetchProductInfo]);

  const subtotal = items.reduce((sum, item) => {
    const info = productInfoMap[item.productId];
    return sum + (info?.price ?? 0) * item.quantity;
  }, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-ws-text">{t("title")}</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
            <ShoppingBag className="h-10 w-10 text-ws-text-muted" />
            <p className="text-sm text-ws-text-muted">{t("empty")}</p>
            <WsButton
              variant="secondary"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                router.push("/products" as any);
              }}
            >
              {t("continueShopping")}
            </WsButton>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 divide-y divide-ws-border">
              {items.map((item) => {
                const info = productInfoMap[item.productId];
                return (
                  <CartItem
                    key={`${item.productId}-${item.variantId || "base"}`}
                    item={item}
                    productName={info?.name}
                    productImage={info?.image}
                    price={info?.price}
                    variantLabel={info?.variantLabel}
                    onUpdateQuantity={(qty) =>
                      updateQuantity(item.productId, item.variantId, qty)
                    }
                    onRemove={() =>
                      removeItem(item.productId, item.variantId)
                    }
                  />
                );
              })}
            </div>

            <SheetFooter className="border-t border-ws-border">
              <CartSummary subtotal={subtotal} compact />
              <WsButton
                variant="primary"
                className="w-full mt-3"
                onClick={() => {
                  onOpenChange(false);
                  router.push("/checkout" as any);
                }}
              >
                {t("checkout")}
              </WsButton>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
