"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WsButton } from "@/components/ui/cyber-button";
import { WsCard, WsCardContent } from "@/components/ui/cyber-card";
import { WsBadge } from "@/components/ui/cyber-badge";
import { ProductCard } from "@/components/product/ProductCard";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";
import {
  Cpu,
  Zap,
  Cable,
  Gauge,
  ArrowRight,
  Truck,
  ShieldCheck,
  DollarSign,
  Headphones,
} from "lucide-react";

const categoryIcons: Record<string, React.ElementType> = {
  Microcontrollers: Cpu,
  Sensors: Gauge,
  "Cables & Connectors": Cable,
  "Power Modules": Zap,
};

const defaultIcon = Cpu;

export default function HomePage() {
  const t = useTranslations("home");
  const tp = useTranslations("product");

  const [categories, setCategories] = useState<Category[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [catData, prodData] = await Promise.all([
        api
          .get<{ categories: Category[] }>("/categories")
          .catch(() => ({ categories: [] })),
        api
          .get<{ items: Product[] }>("/products", {
            status: "active",
            limit: "8",
          })
          .catch(() => ({ items: [] })),
      ]);
      setCategories(catData.categories.filter((c) => c.status === "active"));
      setNewArrivals(prodData.items);
    } catch {
      // Fallback: render without data
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const whyReasons = [
    { icon: Truck, title: t("reason1Title"), desc: t("reason1Desc") },
    { icon: ShieldCheck, title: t("reason2Title"), desc: t("reason2Desc") },
    { icon: DollarSign, title: t("reason3Title"), desc: t("reason3Desc") },
    { icon: Headphones, title: t("reason4Title"), desc: t("reason4Desc") },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-ws-border bg-ws-dark">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
            <div className="max-w-2xl">
              <WsBadge variant="blue" dot className="mb-4">
                {t("badge")}
              </WsBadge>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ws-text leading-tight">
                {t("title")}
                <br />
                <span className="text-ws-text-secondary">{t("subtitle")}</span>
              </h1>

              <p className="mt-4 text-base text-ws-text-secondary max-w-lg leading-relaxed">
                {t("description")}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/products">
                  <WsButton variant="primary" size="lg">
                    {t("browseProducts")}
                    <ArrowRight className="h-4 w-4" />
                  </WsButton>
                </Link>
                <Link href="/rfq">
                  <WsButton variant="secondary" size="lg">
                    {t("requestQuote")}
                  </WsButton>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-ws-text">
              {t("categories")}
            </h2>
            <Link
              href="/categories"
              className="text-sm text-ws-blue hover:text-ws-blue-hover transition-colors"
            >
              {t("viewAll")} &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {categories.slice(0, 8).map((cat) => {
              const Icon = categoryIcons[cat.name] || defaultIcon;
              return (
                <Link
                  key={cat.categoryId}
                  href={`/categories/${cat.slug}` as any}
                >
                  <WsCard hoverable className="group cursor-pointer">
                    <WsCardContent className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ws-blue/10 text-ws-blue group-hover:bg-ws-blue/15 transition-colors">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ws-text">
                          {cat.name}
                        </p>
                        <p className="text-xs text-ws-text-muted">
                          {tp("products", { count: cat.productCount })}
                        </p>
                      </div>
                    </WsCardContent>
                  </WsCard>
                </Link>
              );
            })}
          </div>
        </section>

        {/* New Arrivals */}
        {newArrivals.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 border-t border-ws-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-ws-text">
                {t("newArrivals")}
              </h2>
              <Link
                href="/products"
                className="text-sm text-ws-blue hover:text-ws-blue-hover transition-colors"
              >
                {t("viewAll")} &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {newArrivals.slice(0, 8).map((product) => (
                <ProductCard key={product.productId} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Why XPT-TECH */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 border-t border-ws-border">
          <h2 className="text-lg font-semibold text-ws-text mb-6">
            {t("whyUs")}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {whyReasons.map((reason) => {
              const Icon = reason.icon;
              return (
                <div key={reason.title} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ws-blue/10 text-ws-blue">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ws-text">
                      {reason.title}
                    </p>
                    <p className="text-xs text-ws-text-muted mt-0.5 leading-relaxed">
                      {reason.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
