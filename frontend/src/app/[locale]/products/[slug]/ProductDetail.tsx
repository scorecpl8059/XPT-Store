"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductGallery } from "@/components/product/ProductGallery";
import { VariantSelector } from "@/components/product/VariantSelector";
import { StockBadge } from "@/components/product/StockBadge";
import { ProductReviews } from "@/components/product/ProductReviews";
import { ReviewForm } from "@/components/product/ReviewForm";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { WsButton } from "@/components/ui/cyber-button";
import { WsBadge } from "@/components/ui/cyber-badge";
import { WsCard, WsCardContent } from "@/components/ui/cyber-card";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { api } from "@/lib/api";
import type { Product, Variant } from "@/types/product";
import { ShoppingCart, ArrowLeft, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const t = useTranslations("product");
  const tc = useTranslations("common");
  const { user } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});
  const [quantity, setQuantity] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const fetchProduct = useCallback(async () => {
    try {
      const data = await api
        .get<Product & { variants: Variant[] }>(`/products/${slug}`, {
          slug,
        })
        .catch(() => null);

      if (data) {
        const { variants: v, ...prod } = data;
        setProduct(prod);
        setVariants(v || []);

        // Pre-select first available value for each variant type
        if (prod.variantTypes && v.length > 0) {
          const initial: Record<string, string> = {};
          for (const vt of prod.variantTypes) {
            const available = v.find(
              (variant) =>
                variant.status === "active" &&
                variant.stock - variant.reservedStock > 0
            );
            if (available) {
              initial[vt.name] = available.attributes[vt.name];
            }
          }
          setSelectedAttributes(initial);
        }
      }
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // Find matching variant based on selected attributes
  const selectedVariant = variants.find((v) =>
    Object.entries(selectedAttributes).every(
      ([key, val]) => v.attributes[key] === val
    )
  );

  const displayPrice = selectedVariant
    ? selectedVariant.price
    : product?.basePrice ?? 0;

  const displayStock = selectedVariant
    ? selectedVariant.stock - selectedVariant.reservedStock
    : null;

  const handleAttributeSelect = (attribute: string, value: string) => {
    setSelectedAttributes((prev) => ({ ...prev, [attribute]: value }));
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square rounded-lg bg-ws-surface border border-ws-border animate-pulse" />
              <div className="space-y-4">
                <div className="h-8 w-3/4 bg-ws-surface border border-ws-border rounded animate-pulse" />
                <div className="h-6 w-1/4 bg-ws-surface border border-ws-border rounded animate-pulse" />
                <div className="h-32 bg-ws-surface border border-ws-border rounded animate-pulse" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 text-center">
            <p className="text-ws-text-muted">{tc("noResults")}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Back link */}
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm text-ws-text-secondary hover:text-ws-blue transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            {tc("back")}
          </Link>

          {/* Product main section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gallery */}
            <ProductGallery
              images={product.images}
              productName={product.name}
            />

            {/* Info */}
            <div className="space-y-5">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-ws-text">
                  {product.name}
                </h1>

                {/* Rating */}
                {product.reviewCount > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-4 w-4",
                            i < Math.round(product.averageRating)
                              ? "fill-ws-amber text-ws-amber"
                              : "text-ws-border"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-ws-text-muted">
                      {product.averageRating.toFixed(1)} (
                      {t("reviewCount", { count: product.reviewCount })})
                    </span>
                  </div>
                )}
              </div>

              {/* Price */}
              <div>
                {product.hasVariants && !selectedVariant && (
                  <span className="text-xs text-ws-text-muted mr-1">
                    {t("from")}
                  </span>
                )}
                <span className="text-2xl font-bold text-ws-text tabular-nums">
                  ${displayPrice.toFixed(2)}
                </span>
              </div>

              {/* Stock */}
              {displayStock !== null && (
                <StockBadge stock={displayStock} />
              )}

              {/* SKU */}
              {selectedVariant && (
                <p className="text-xs text-ws-text-muted">
                  {t("sku")}: {selectedVariant.sku}
                </p>
              )}

              {/* Variant selector */}
              {product.hasVariants && product.variantTypes && (
                <VariantSelector
                  variantTypes={product.variantTypes}
                  variants={variants}
                  selected={selectedAttributes}
                  onSelect={handleAttributeSelect}
                />
              )}

              {/* Quantity + Add to cart */}
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-ws-border rounded-md">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-ws-text-secondary hover:text-ws-text transition-colors"
                  >
                    -
                  </button>
                  <span className="px-3 py-2 text-sm font-medium text-ws-text tabular-nums min-w-[2rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 text-ws-text-secondary hover:text-ws-text transition-colors"
                  >
                    +
                  </button>
                </div>
                <WsButton
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  disabled={
                    product.hasVariants
                      ? !selectedVariant || displayStock === 0
                      : false
                  }
                  onClick={() =>
                    addItem(
                      product.productId,
                      selectedVariant?.variantId,
                      quantity
                    )
                  }
                >
                  <ShoppingCart className="h-4 w-4" />
                  {displayStock === 0 ? t("outOfStock") : t("addToCart")}
                </WsButton>
              </div>

              {/* Description */}
              <div className="border-t border-ws-border pt-5">
                <h2 className="text-sm font-semibold text-ws-text mb-2">
                  {t("description")}
                </h2>
                <div
                  className="text-sm text-ws-text-secondary leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>

              {/* Specs */}
              {(product.weight || product.dimensions) && (
                <div className="border-t border-ws-border pt-5">
                  <h2 className="text-sm font-semibold text-ws-text mb-2">
                    {t("specifications")}
                  </h2>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    {product.weight > 0 && (
                      <>
                        <dt className="text-ws-text-muted">{t("weight")}</dt>
                        <dd className="text-ws-text tabular-nums">
                          {product.weight} lbs
                        </dd>
                      </>
                    )}
                    {product.dimensions && (
                      <>
                        <dt className="text-ws-text-muted">
                          {t("dimensions")}
                        </dt>
                        <dd className="text-ws-text tabular-nums">
                          {product.dimensions.length} ×{" "}
                          {product.dimensions.width} ×{" "}
                          {product.dimensions.height} in
                        </dd>
                      </>
                    )}
                  </dl>
                </div>
              )}
            </div>
          </div>

          {/* Reviews section */}
          <div className="mt-12 border-t border-ws-border pt-8">
            {showReviewForm ? (
              <ReviewForm
                productId={product.productId}
                isLoggedIn={!!user}
                onSubmitted={() => {
                  setShowReviewForm(false);
                  fetchProduct();
                }}
                onCancel={() => setShowReviewForm(false)}
              />
            ) : (
              <ProductReviews
                productId={product.productId}
                averageRating={product.averageRating}
                reviewCount={product.reviewCount}
                onWriteReview={() => setShowReviewForm(true)}
              />
            )}
          </div>

          {/* Related products */}
          {product.relatedProductIds.length > 0 && (
            <div className="mt-12 border-t border-ws-border pt-8">
              <RelatedProducts productIds={product.relatedProductIds} />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
