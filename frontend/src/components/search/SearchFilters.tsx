"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { WsCard, WsCardContent } from "@/components/ui/cyber-card";
import { WsButton } from "@/components/ui/cyber-button";
import { api } from "@/lib/api";
import type { Category } from "@/types/category";
import { X } from "lucide-react";

interface SearchFiltersProps {
  selectedCategory: string | null;
  minPrice: string;
  maxPrice: string;
  onCategoryChange: (categoryId: string | null) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onClear: () => void;
}

export function SearchFilters({
  selectedCategory,
  minPrice,
  maxPrice,
  onCategoryChange,
  onMinPriceChange,
  onMaxPriceChange,
  onClear,
}: SearchFiltersProps) {
  const t = useTranslations("category");
  const tp = useTranslations("product");

  const [categories, setCategories] = useState<Category[]>([]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await api
        .get<{ categories: Category[] }>("/categories")
        .catch(() => ({ categories: [] }));
      setCategories(data.categories.filter((c) => c.status === "active"));
    } catch {
      // empty
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const hasFilters = selectedCategory || minPrice || maxPrice;

  return (
    <WsCard>
      <WsCardContent className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ws-text">Filters</h3>
          {hasFilters && (
            <button
              onClick={onClear}
              className="text-xs text-ws-blue hover:text-ws-blue-hover transition-colors flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>

        {/* Categories */}
        <div>
          <h4 className="text-xs font-medium text-ws-text-secondary uppercase tracking-wider mb-2">
            {t("title")}
          </h4>
          <div className="space-y-1">
            <button
              onClick={() => onCategoryChange(null)}
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
                onClick={() => onCategoryChange(cat.categoryId)}
                className={`w-full text-left text-sm px-2 py-1.5 rounded transition-colors ${
                  selectedCategory === cat.categoryId
                    ? "bg-ws-blue/10 text-ws-blue font-medium"
                    : "text-ws-text-secondary hover:text-ws-text hover:bg-ws-surface-hover"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Price range */}
        <div>
          <h4 className="text-xs font-medium text-ws-text-secondary uppercase tracking-wider mb-2">
            {tp("price")}
          </h4>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => onMinPriceChange(e.target.value)}
              min="0"
              step="0.01"
              className="w-full h-8 px-2 text-sm rounded-md border border-ws-border bg-ws-dark text-ws-text placeholder:text-ws-text-muted focus:border-ws-blue focus:outline-none"
            />
            <span className="text-xs text-ws-text-muted">—</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => onMaxPriceChange(e.target.value)}
              min="0"
              step="0.01"
              className="w-full h-8 px-2 text-sm rounded-md border border-ws-border bg-ws-dark text-ws-text placeholder:text-ws-text-muted focus:border-ws-blue focus:outline-none"
            />
          </div>
        </div>
      </WsCardContent>
    </WsCard>
  );
}
