"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { Product } from "@/types/product";
import type { Category } from "@/types/category";
import { WsButton } from "@/components/ui/cyber-button";
import { WsCard, WsCardContent } from "@/components/ui/cyber-card";
import { WsBadge } from "@/components/ui/cyber-badge";
import { WsInput } from "@/components/ui/cyber-input";
import {
  Plus,
  Search,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusOptions = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

const statusVariant: Record<string, "green" | "blue" | "amber" | "muted"> = {
  active: "green",
  draft: "amber",
  archived: "muted",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [nextKey, setNextKey] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "20" };
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.categoryId = categoryFilter;

      const data = await api.get<{ items: Product[]; nextKey: string | null }>(
        "/products",
        params
      );
      setProducts(data.items);
      setNextKey(data.nextKey);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await api.get<{ categories: Category[] }>("/categories");
      setCategories(data.categories);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const getCategoryName = (id: string) =>
    categories.find((c) => c.categoryId === id)?.name || "—";

  const filteredProducts = searchQuery
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.slug.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-ws-text">Products</h1>
          <p className="text-sm text-ws-text-secondary mt-0.5">
            Manage your product catalog
          </p>
        </div>
        <a href="/admin/products/new">
          <WsButton variant="primary">
            <Plus className="h-4 w-4" />
            Add Product
          </WsButton>
        </a>
      </div>

      {/* Filters */}
      <WsCard className="mb-4">
        <WsCardContent>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ws-text-muted" />
              <WsInput
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-md border border-ws-border bg-ws-elevated text-ws-text focus:outline-none focus:border-ws-blue"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-md border border-ws-border bg-ws-elevated text-ws-text focus:outline-none focus:border-ws-blue"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.categoryId} value={cat.categoryId}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </WsCardContent>
      </WsCard>

      {/* Product Table */}
      <WsCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ws-border">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ws-text-muted">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ws-text-muted">
                  Category
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-ws-text-muted">
                  Price
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-ws-text-muted">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-ws-text-muted">
                  Variants
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-ws-text-muted">
                  Sold
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-ws-text-muted"
                  >
                    Loading...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Package className="h-8 w-8 text-ws-text-muted mx-auto mb-2" />
                    <p className="text-sm text-ws-text-secondary">
                      No products found
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr
                    key={product.productId}
                    className="border-b border-ws-border last:border-b-0 hover:bg-ws-surface transition-colors cursor-pointer"
                    onClick={() =>
                      (window.location.href = `/admin/products/${product.productId}`)
                    }
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt=""
                            className="h-10 w-10 rounded-md object-cover border border-ws-border"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-ws-surface border border-ws-border flex items-center justify-center">
                            <Package className="h-4 w-4 text-ws-text-muted" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ws-text truncate max-w-[250px]">
                            {product.name}
                          </p>
                          <p className="text-xs text-ws-text-muted font-mono">
                            {product.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-ws-text-secondary">
                      {getCategoryName(product.categoryId)}
                    </td>
                    <td className="px-4 py-3 text-sm text-ws-text text-right font-mono">
                      ${product.basePrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <WsBadge
                        variant={statusVariant[product.status] || "muted"}
                        className="text-[10px]"
                      >
                        {product.status}
                      </WsBadge>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-ws-text-secondary">
                      {product.hasVariants ? "Yes" : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-ws-text-secondary tabular-nums">
                      {product.totalSold}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {nextKey && (
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-ws-border">
            <WsButton variant="ghost" size="sm" disabled>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </WsButton>
            <WsButton variant="ghost" size="sm">
              Next
              <ChevronRight className="h-4 w-4" />
            </WsButton>
          </div>
        )}
      </WsCard>
    </div>
  );
}
