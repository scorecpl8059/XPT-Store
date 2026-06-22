"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { SearchFilters } from "@/components/search/SearchFilters";
import { WsButton } from "@/components/ui/cyber-button";
import { useSearch } from "@/hooks/use-search";
import { SlidersHorizontal, Search, X } from "lucide-react";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("search");
  const tc = useTranslations("common");

  const query = searchParams.get("q") || "";
  const [inputValue, setInputValue] = useState(query);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { results, loading } = useSearch(query, {
    categoryId: selectedCategory || undefined,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    page,
    size: 20,
  });

  // Sync input with URL query param
  useEffect(() => {
    setInputValue(query);
    setPage(1);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(inputValue.trim())}` as any);
    }
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setMinPrice("");
    setMaxPrice("");
    setPage(1);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          {/* Search header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-ws-text">{t("title")}</h1>
            {query && (
              <p className="text-sm text-ws-text-secondary mt-1">
                {t("resultsFor")} &ldquo;{query}&rdquo;
                {results && ` — ${results.total} ${tc("results")}`}
              </p>
            )}
          </div>

          {/* Search input */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ws-text-muted" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={tc("noResults")}
                className="w-full h-10 pl-9 pr-10 text-sm rounded-md bg-ws-surface border border-ws-border text-ws-text placeholder:text-ws-text-muted focus:outline-none focus:border-ws-blue focus:ring-1 focus:ring-ws-blue/30"
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={() => setInputValue("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ws-text-muted hover:text-ws-text"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>

          <div className="flex items-center justify-between mb-4 lg:hidden">
            <WsButton
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t("filters")}
            </WsButton>
          </div>

          <div className="flex gap-6">
            {/* Sidebar filters */}
            <aside
              className={`${
                showFilters ? "block" : "hidden"
              } lg:block w-full lg:w-56 shrink-0`}
            >
              <SearchFilters
                selectedCategory={selectedCategory}
                minPrice={minPrice}
                maxPrice={maxPrice}
                onCategoryChange={(id) => {
                  setSelectedCategory(id);
                  setPage(1);
                }}
                onMinPriceChange={(v) => {
                  setMinPrice(v);
                  setPage(1);
                }}
                onMaxPriceChange={(v) => {
                  setMaxPrice(v);
                  setPage(1);
                }}
                onClear={clearFilters}
              />
            </aside>

            {/* Results */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[3/4] rounded-lg bg-ws-surface border border-ws-border animate-pulse"
                    />
                  ))}
                </div>
              ) : !query ? (
                <div className="text-center py-16">
                  <Search className="h-10 w-10 text-ws-text-muted mx-auto mb-3" />
                  <p className="text-sm text-ws-text-muted">
                    {t("noResultsDesc")}
                  </p>
                </div>
              ) : !results || results.items.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-sm font-medium text-ws-text mb-1">
                    {t("noResultsTitle")}
                  </p>
                  <p className="text-xs text-ws-text-muted">
                    {t("noResultsDesc")}
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-ws-text-muted mb-3">
                    {tc("showing")} {results.items.length} {tc("of")}{" "}
                    {results.total} {tc("results")}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {results.items.map((item) => (
                      <ProductCard
                        key={item.productId}
                        product={{
                          productId: item.productId,
                          name: item.name,
                          description: item.description,
                          basePrice: item.basePrice,
                          categoryId: item.categoryId,
                          slug: item.productId,
                          images: [],
                          status: "active",
                          weight: 0,
                          hasVariants: false,
                          relatedProductIds: [],
                          averageRating: 0,
                          reviewCount: 0,
                          totalSold: 0,
                          createdAt: "",
                          updatedAt: "",
                        }}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {results.total > results.size && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <WsButton
                        variant="secondary"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                      >
                        {tc("back")}
                      </WsButton>
                      <span className="text-xs text-ws-text-muted px-3">
                        {page} {tc("of")}{" "}
                        {Math.ceil(results.total / results.size)}
                      </span>
                      <WsButton
                        variant="secondary"
                        size="sm"
                        disabled={page >= Math.ceil(results.total / results.size)}
                        onClick={() => setPage(page + 1)}
                      >
                        {tc("next")}
                      </WsButton>
                    </div>
                  )}
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
