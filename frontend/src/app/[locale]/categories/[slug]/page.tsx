"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback, use } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WsCard, WsCardContent } from "@/components/ui/cyber-card";
import { WsBadge } from "@/components/ui/cyber-badge";
import { ProductCard } from "@/components/product/ProductCard";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";
import { ArrowLeft } from "lucide-react";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = use(params);
  const t = useTranslations("category");
  const tp = useTranslations("product");

  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      // Fetch category by slug
      const catData = await api
        .get<{ category: Category }>(`/categories/${slug}`, { by: "slug" })
        .catch(() => null);

      if (!catData) {
        setLoading(false);
        return;
      }

      setCategory(catData.category);

      // Fetch subcategories and products in parallel
      const [subData, prodData] = await Promise.all([
        api
          .get<{ categories: Category[] }>("/categories", {
            parentId: catData.category.categoryId,
          })
          .catch(() => ({ categories: [] })),
        api
          .get<{ items: Product[] }>("/products", {
            categoryId: catData.category.categoryId,
            status: "active",
          })
          .catch(() => ({ items: [] })),
      ]);

      setSubcategories(
        subData.categories.filter((c) => c.status === "active")
      );
      setProducts(prodData.items);
    } catch {
      // render empty
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          {/* Back link */}
          <Link
            href="/categories"
            className="inline-flex items-center gap-1.5 text-sm text-ws-text-secondary hover:text-ws-blue transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToCategories")}
          </Link>

          {loading ? (
            <div className="space-y-4">
              <div className="h-8 w-48 bg-ws-surface border border-ws-border rounded animate-pulse" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] rounded-lg bg-ws-surface border border-ws-border animate-pulse"
                  />
                ))}
              </div>
            </div>
          ) : !category ? (
            <p className="text-ws-text-muted text-sm">{t("noProducts")}</p>
          ) : (
            <>
              {/* Category header */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-ws-text">
                  {category.name}
                </h1>
                {category.description && (
                  <p className="text-sm text-ws-text-secondary mt-1">
                    {category.description}
                  </p>
                )}
              </div>

              {/* Subcategories */}
              {subcategories.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-sm font-semibold text-ws-text-secondary uppercase tracking-wider mb-3">
                    {t("subcategories")}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {subcategories.map((sub) => (
                      <Link
                        key={sub.categoryId}
                        href={`/categories/${sub.slug}` as any}
                      >
                        <WsBadge
                          variant="blue"
                          className="cursor-pointer hover:bg-ws-blue/20 transition-colors"
                        >
                          {sub.name}{" "}
                          <span className="text-ws-text-muted ml-1">
                            ({sub.productCount})
                          </span>
                        </WsBadge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Products */}
              <div>
                <h2 className="text-sm font-semibold text-ws-text-secondary uppercase tracking-wider mb-4">
                  {t("productsIn", { name: category.name })} &middot;{" "}
                  {tp("products", { count: products.length })}
                </h2>

                {products.length === 0 ? (
                  <WsCard>
                    <WsCardContent>
                      <p className="text-sm text-ws-text-muted text-center py-8">
                        {t("noProducts")}
                      </p>
                    </WsCardContent>
                  </WsCard>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {products.map((product) => (
                      <ProductCard
                        key={product.productId}
                        product={product}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
