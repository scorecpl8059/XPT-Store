"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WsCard, WsCardContent } from "@/components/ui/cyber-card";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import type { Category } from "@/types/category";
import { Cpu, Zap, Cable, Gauge, FolderOpen } from "lucide-react";

const categoryIcons: Record<string, React.ElementType> = {
  Microcontrollers: Cpu,
  Sensors: Gauge,
  "Cables & Connectors": Cable,
  "Power Modules": Zap,
};

const defaultIcon = FolderOpen;

export default function CategoriesPage() {
  const t = useTranslations("category");
  const tp = useTranslations("product");

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await api
        .get<{ categories: Category[] }>("/categories")
        .catch(() => ({ categories: [] }));
      setCategories(data.categories.filter((c) => c.status === "active"));
    } catch {
      // render empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Build tree: top-level + children
  const topLevel = categories.filter((c) => !c.parentId);
  const childrenOf = (parentId: string) =>
    categories.filter((c) => c.parentId === parentId);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-2xl font-bold text-ws-text mb-2">{t("title")}</h1>
          <p className="text-sm text-ws-text-secondary mb-8">
            {t("description")}
          </p>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 rounded-lg bg-ws-surface border border-ws-border animate-pulse"
                />
              ))}
            </div>
          ) : topLevel.length === 0 ? (
            <p className="text-ws-text-muted text-sm">{t("noProducts")}</p>
          ) : (
            <div className="space-y-8">
              {topLevel.map((cat) => {
                const Icon = categoryIcons[cat.name] || defaultIcon;
                const children = childrenOf(cat.categoryId);

                return (
                  <div key={cat.categoryId}>
                    <Link href={`/categories/${cat.slug}` as any}>
                      <WsCard hoverable className="group cursor-pointer">
                        <WsCardContent className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-ws-blue/10 text-ws-blue group-hover:bg-ws-blue/15 transition-colors">
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h2 className="text-base font-semibold text-ws-text group-hover:text-ws-blue transition-colors">
                              {cat.name}
                            </h2>
                            {cat.description && (
                              <p className="text-xs text-ws-text-muted mt-0.5 line-clamp-1">
                                {cat.description}
                              </p>
                            )}
                            <p className="text-xs text-ws-text-secondary mt-1">
                              {tp("products", { count: cat.productCount })}
                            </p>
                          </div>
                        </WsCardContent>
                      </WsCard>
                    </Link>

                    {children.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-3 ml-4">
                        {children.map((child) => (
                          <Link
                            key={child.categoryId}
                            href={`/categories/${child.slug}` as any}
                          >
                            <WsCard
                              hoverable
                              className="group cursor-pointer"
                            >
                              <WsCardContent className="py-3">
                                <p className="text-sm font-medium text-ws-text group-hover:text-ws-blue transition-colors">
                                  {child.name}
                                </p>
                                <p className="text-xs text-ws-text-muted">
                                  {tp("products", {
                                    count: child.productCount,
                                  })}
                                </p>
                              </WsCardContent>
                            </WsCard>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
