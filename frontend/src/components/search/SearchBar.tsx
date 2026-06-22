"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { SearchSuggestions } from "./SearchSuggestions";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  className?: string;
  autoFocus?: boolean;
  onClose?: () => void;
}

export function SearchBar({ className, autoFocus, onClose }: SearchBarProps) {
  const t = useTranslations("nav");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}` as any);
      onClose?.();
    }
  };

  const handleSuggestionClick = (slug: string) => {
    setShowSuggestions(false);
    router.push(`/products/${slug}` as any);
    onClose?.();
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ws-text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(e.target.value.length >= 2);
            }}
            onFocus={() => {
              if (query.length >= 2) setShowSuggestions(true);
            }}
            placeholder={t("search")}
            className={cn(
              "w-full h-9 pl-9 pr-8 text-sm rounded-md bg-ws-surface border border-ws-border text-ws-text placeholder:text-ws-text-muted transition-colors",
              "focus:outline-none focus:border-ws-blue focus:ring-1 focus:ring-ws-blue/30"
            )}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setShowSuggestions(false);
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-ws-text-muted hover:text-ws-text transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </form>

      {showSuggestions && query.length >= 2 && (
        <SearchSuggestions
          query={query}
          onSelect={handleSuggestionClick}
          onViewAll={() => {
            setShowSuggestions(false);
            router.push(`/search?q=${encodeURIComponent(query.trim())}` as any);
            onClose?.();
          }}
        />
      )}
    </div>
  );
}
