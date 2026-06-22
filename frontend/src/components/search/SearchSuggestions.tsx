"use client";

import { useTranslations } from "next-intl";
import { useSearch } from "@/hooks/use-search";
import { Search, ArrowRight } from "lucide-react";

interface SearchSuggestionsProps {
  query: string;
  onSelect: (slug: string) => void;
  onViewAll: () => void;
}

export function SearchSuggestions({
  query,
  onSelect,
  onViewAll,
}: SearchSuggestionsProps) {
  const t = useTranslations("common");
  const th = useTranslations("home");
  const { results, loading } = useSearch(query, { size: 5 });

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-ws-surface border border-ws-border rounded-md shadow-lg z-50 overflow-hidden">
      {loading ? (
        <div className="p-3 text-center">
          <p className="text-xs text-ws-text-muted">{t("loading")}</p>
        </div>
      ) : !results || results.items.length === 0 ? (
        <div className="p-3 text-center">
          <p className="text-xs text-ws-text-muted">{t("noResults")}</p>
        </div>
      ) : (
        <>
          <ul>
            {results.items.map((item) => (
              <li key={item.productId}>
                <button
                  type="button"
                  onClick={() => {
                    // Use productId as slug fallback — the search hit doesn't include slug
                    // We'll navigate to products/[productId] and the get handler supports both
                    onSelect(item.productId);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-ws-surface-hover transition-colors"
                >
                  <Search className="h-3.5 w-3.5 text-ws-text-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ws-text truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-ws-text-muted tabular-nums">
                      ${item.basePrice.toFixed(2)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {results.total > results.items.length && (
            <button
              type="button"
              onClick={onViewAll}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-ws-blue hover:bg-ws-blue/5 border-t border-ws-border transition-colors"
            >
              {th("viewAll")} ({results.total})
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
