"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/types/product";
import { WsBadge } from "@/components/ui/cyber-badge";
import { WsButton } from "@/components/ui/cyber-button";
import { ShoppingCart, Star, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const t = useTranslations("product");

  return (
    <Link
      href={`/products/${product.slug}` as any}
      className={cn(
        "group block rounded-lg border border-ws-border bg-ws-surface overflow-hidden transition-all duration-200 hover:border-ws-blue/30 hover:shadow-sm",
        className
      )}
    >
      {/* Image */}
      <div className="aspect-square bg-ws-dark relative overflow-hidden">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-ws-text-muted/30" />
          </div>
        )}

        {/* Status badge for non-active */}
        {product.status === "draft" && (
          <div className="absolute top-2 left-2">
            <WsBadge variant="amber" className="text-[10px]">
              Draft
            </WsBadge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-ws-text leading-snug line-clamp-2 group-hover:text-ws-blue transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3 w-3",
                    i < Math.round(product.averageRating)
                      ? "fill-ws-amber text-ws-amber"
                      : "text-ws-border"
                  )}
                />
              ))}
            </div>
            <span className="text-[11px] text-ws-text-muted">
              ({product.reviewCount})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-base font-semibold text-ws-text tabular-nums">
            ${product.basePrice.toFixed(2)}
          </span>

          <WsButton
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              // TODO: add to cart
            }}
          >
            <ShoppingCart className="h-4 w-4" />
          </WsButton>
        </div>
      </div>
    </Link>
  );
}
