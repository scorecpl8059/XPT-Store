"use client";

import React, { useState, useEffect, use } from "react";
import { api } from "@/lib/api";
import type { Product, Variant } from "@/types/product";
import { ProductForm } from "@/components/admin/ProductForm";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [product, setProduct] = useState<(Product & { variants?: Variant[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get<Product & { variants?: Variant[] }>(
          `/products/${id}`
        );
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load product");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-sm text-ws-text-muted">Loading product...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-6">
        <div className="text-sm text-ws-red">{error || "Product not found"}</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ws-text">Edit Product</h1>
        <p className="text-sm text-ws-text-secondary mt-0.5">
          {product.name}
        </p>
      </div>
      <ProductForm product={product} variants={product.variants} />
    </div>
  );
}
