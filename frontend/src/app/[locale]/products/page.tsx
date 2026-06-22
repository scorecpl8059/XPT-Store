"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WsButton } from "@/components/ui/cyber-button";
import { WsCard, WsCardContent } from "@/components/ui/cyber-card";
import { ProductCard } from "@/components/product/ProductCard";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";
import { SlidersHorizontal, X } from "lucide-react";

export default function ProductsPage() {
  const t = useTranslations("category");
  const tc = useTranslations("common");
  const tp = useTranslations("product");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { status: "active" };
      if (selectedCategory) {
        params.categoryId = selectedCategory;
      }

      const [prodData, catData] = await Promise.all([
        api
          .get<{ items: Product[] }>("/products", params)
          .catch(() => ({ items: [] })),
        api
          .get<{ categories: Category[] }>("/categories")
          .catch(() => ({ categories: [] })),
      ]);

      setProducts(prodData.items);
      setCategories(catData.categories.filter((c) => c.status === "active"));
    } catch {
      // render empty
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const clearFilters = () => {
    setSelectedCategory(null);
  };

  const hasFilters = selectedCategory !== null;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          {/* Page header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-ws-text">
                {t("allProducts")}
              </h1>
              <p className="text-sm text-ws-text-secondary mt-1">
                {t("description")}
              </p>
            </div>
            <WsButton
              variant="secondary"
              size="sm"
              className="lg:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </WsButton>
          </div>

          <div className="flex gap-6">
            {/* Sidebar filters */}
            <aside
              className={`${
                showFilters ? "block" : "hidden"
              } lg:block w-full lg:w-56 shrink-0`}
            >
              <WsCard>
                <WsCardContent>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-ws-text">
                      {t("title")}
                    </h3>
                    {hasFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-ws-blue hover:text-ws-blue-hover transition-colors flex items-center gap-1"
                      >
                        <X className="h-3 w-3" />
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`w-full text-left text-sm px-2 py-1.5 rounded transition-colors ${
                        !selectedCategory
                          ? "bg-ws-blue/10 text-ws-blue font-medium"
                          : "text-ws-text-secondary hover:text-ws-text hover:bg-ws-surface-hover"
                      }`}
                    >
                      {t("allProducts")}
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.categoryId}
                        onClick={() => setSelectedCategory(cat.categoryId)}
                        className={`w-full text-left text-sm px-2 py-1.5 rounded transition-colors ${
                          selectedCategory === cat.categoryId
                            ? "bg-ws-blue/10 text-ws-blue font-medium"
                            : "text-ws-text-secondary hover:text-ws-text hover:bg-ws-surface-hover"
                        }`}
                      >
                        {cat.name}
                        <span className="text-xs text-ws-text-muted ml-1">
                          ({cat.productCount})
                        </span>
                      </button>
                    ))}
                  </div>
                </WsCardContent>
              </WsCard>
            </aside>

            {/* Product grid */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[3/4] rounded-lg bg-ws-surface border border-ws-border animate-pulse"
                    />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-sm text-ws-text-muted">
                    {tc("noResults")}
                  </p>
                  {hasFilters && (
                    <button
                      onClick={clearFilters}
                      className="mt-2 text-sm text-ws-blue hover:text-ws-blue-hover transition-colors"
                    >
                      {tc("tryAgain")}
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-xs text-ws-text-muted mb-3">
                    {tc("showing")} {products.length} {tc("results")}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {products.map((product) => (
                      <ProductCard
                        key={product.productId}
                        product={product}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
