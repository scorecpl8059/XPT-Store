"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { WsButton } from "@/components/ui/cyber-button";
import { WsCard, WsCardContent } from "@/components/ui/cyber-card";
import { useCart } from "@/hooks/use-cart";
import { api } from "@/lib/api";
import type { Product } from "@/types/product";
import { ShoppingBag } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface ProductInfo {
  name: string;
  image?: string;
  price: number;
  variantLabel?: string;
}

export default function CartPage() {
  const t = useTranslations("cart");
  const tc = useTranslations("common");
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart } = useCart();
  const [productInfoMap, setProductInfoMap] = useState<
    Record<string, ProductInfo>
  >({});

  const fetchProductInfo = useCallback(async () => {
    const ids = [...new Set(items.map((i) => i.productId))];
    const toFetch = ids.filter((id) => !productInfoMap[id]);
    if (toFetch.length === 0) return;

    const results = await Promise.allSettled(
      toFetch.map((id) =>
        api.get<Product>(`/products/${id}`)
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
    if (items.length > 0) {
      fetchProductInfo();
    }
  }, [items.length, fetchProductInfo]);

  const subtotal = items.reduce((sum, item) => {
    const info = productInfoMap[item.productId];
    return sum + (info?.price ?? 0) * item.quantity;
  }, 0);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-2xl font-bold text-ws-text mb-6">
            {t("title")}
          </h1>

          {items.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="h-12 w-12 text-ws-text-muted mx-auto mb-4" />
              <p className="text-sm text-ws-text-muted mb-4">{t("empty")}</p>
              <Link href="/products">
                <WsButton variant="primary">{t("continueShopping")}</WsButton>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cart items */}
              <div className="lg:col-span-2">
                <WsCard>
                  <WsCardContent className="divide-y divide-ws-border">
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
                            updateQuantity(
                              item.productId,
                              item.variantId,
                              qty
                            )
                          }
                          onRemove={() =>
                            removeItem(item.productId, item.variantId)
                          }
                        />
                      );
                    })}
                  </WsCardContent>
                </WsCard>
              </div>

              {/* Summary sidebar */}
              <div>
                <WsCard>
                  <WsCardContent>
                    <CartSummary subtotal={subtotal} />
                    <WsButton
                      variant="primary"
                      className="w-full mt-4"
                      onClick={() => router.push("/checkout" as any)}
                    >
                      {t("checkout")}
                    </WsButton>
                    <Link
                      href="/products"
                      className="block text-center text-sm text-ws-blue hover:text-ws-blue-hover mt-3 transition-colors"
                    >
                      {t("continueShopping")}
                    </Link>
                  </WsCardContent>
                </WsCard>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
