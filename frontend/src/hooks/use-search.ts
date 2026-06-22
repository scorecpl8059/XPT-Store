"use client";

import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "./use-debounce";
import { api } from "@/lib/api";

interface SearchHit {
  productId: string;
  name: string;
  description: string;
  categoryId: string;
  basePrice: number;
  score: number;
}

interface SearchResult {
  items: SearchHit[];
  total: number;
  page: number;
  size: number;
}

interface UseSearchOptions {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  size?: number;
}

export function useSearch(query: string, options: UseSearchOptions = {}) {
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async () => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      const params: Record<string, string> = { q: debouncedQuery };
      if (options.categoryId) params.categoryId = options.categoryId;
      if (options.minPrice !== undefined)
        params.minPrice = String(options.minPrice);
      if (options.maxPrice !== undefined)
        params.maxPrice = String(options.maxPrice);
      if (options.page) params.page = String(options.page);
      if (options.size) params.size = String(options.size);

      const data = await api.get<SearchResult>("/search", params);
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [
    debouncedQuery,
    options.categoryId,
    options.minPrice,
    options.maxPrice,
    options.page,
    options.size,
  ]);

  useEffect(() => {
    search();
  }, [search]);

  return { results, loading, query: debouncedQuery };
}
