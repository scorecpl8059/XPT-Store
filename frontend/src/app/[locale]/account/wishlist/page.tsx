"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { WsCard, WsCardContent } from "@/components/ui/cyber-card";
import { WsButton } from "@/components/ui/cyber-button";
import { ProductCard } from "@/components/product/ProductCard";
import { api } from "@/lib/api";
import type { Product } from "@/types/product";
import { Heart, X } from "lucide-react";

interface WishlistItem {
  productId: string;
}

export default function WishlistPage() {
  const t = useTranslations("account");
  const tc = useTranslations("common");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWishlist() {
      try {
        const res = await api.get<{ items: WishlistItem[] }>(
          "/users/me/wishlist"
        );
        const items = res.items ?? [];

        if (items.length === 0) {
          setProducts([]);
          return;
        }

        // Fetch product details for each wishlist item
        const results = await Promise.allSettled(
          items.map((item) =>
            api.get<Product>(`/products/${item.productId}`)
          )
        );

        const fetched: Product[] = [];
        for (const result of results) {
          if (result.status === "fulfilled" && result.value) {
            fetched.push(result.value);
          }
        }
        setProducts(fetched);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchWishlist();
  }, []);

  const handleRemove = async (productId: string) => {
    try {
      await api.delete(`/users/me/wishlist/${productId}`);
      setProducts((prev) => prev.filter((p) => p.productId !== productId));
    } catch {
      // handle error
    }
  };

  if (loading) {
    return <p className="text-sm text-ws-text-muted">{tc("loading")}</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-ws-text">{t("wishlist")}</h2>

      {products.length === 0 ? (
        <WsCard>
          <WsCardContent className="flex flex-col items-center py-12">
            <Heart className="h-12 w-12 text-ws-text-muted/30 mb-3" />
            <p className="text-sm text-ws-text-muted">{t("noWishlist")}</p>
          </WsCardContent>
        </WsCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.productId} className="relative group/wish">
              <ProductCard product={product} />
              <WsButton
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 bg-ws-dark/80 hover:bg-red-500/20 text-red-400 opacity-0 group-hover/wish:opacity-100 transition-opacity z-10"
                onClick={(e) => {
                  e.preventDefault();
                  handleRemove(product.productId);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </WsButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
