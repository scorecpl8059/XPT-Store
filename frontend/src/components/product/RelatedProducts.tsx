"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { ProductCard } from "./ProductCard";
import { api } from "@/lib/api";
import type { Product } from "@/types/product";

interface RelatedProductsProps {
  productIds: string[];
}

export function RelatedProducts({ productIds }: RelatedProductsProps) {
  const t = useTranslations("product");
  const [products, setProducts] = useState<Product[]>([]);

  const fetchProducts = useCallback(async () => {
    if (productIds.length === 0) return;

    try {
      // Fetch each related product individually
      const results = await Promise.all(
        productIds.slice(0, 8).map((id) =>
          api
            .get<Product>(`/products/${id}`)
            .catch(() => null)
        )
      );
      setProducts(
        results.filter((p): p is Product => p !== null && p.status === "active")
      );
    } catch {
      // empty
    }
  }, [productIds]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  if (products.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-ws-text mb-4">
        {t("relatedProducts")}
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {products.map((product) => (
          <div key={product.productId} className="w-48 shrink-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
