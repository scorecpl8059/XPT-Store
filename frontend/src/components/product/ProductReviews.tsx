"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { WsCard, WsCardContent } from "@/components/ui/cyber-card";
import { WsButton } from "@/components/ui/cyber-button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Review } from "@/types/review";

interface ProductReviewsProps {
  productId: string;
  averageRating: number;
  reviewCount: number;
  onWriteReview: () => void;
}

export function ProductReviews({
  productId,
  averageRating,
  reviewCount,
  onWriteReview,
}: ProductReviewsProps) {
  const t = useTranslations("product");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    try {
      const data = await api
        .get<{ items: Review[] }>(`/products/${productId}/reviews`)
        .catch(() => ({ items: [] }));
      setReviews(data.items);
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Rating distribution
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-ws-text">
          {t("reviews")} ({reviewCount})
        </h2>
        <WsButton variant="outline" size="sm" onClick={onWriteReview}>
          {t("writeReview")}
        </WsButton>
      </div>

      {/* Rating summary */}
      {reviewCount > 0 && (
        <div className="flex gap-6 mb-6 pb-6 border-b border-ws-border">
          <div className="text-center">
            <div className="text-3xl font-bold text-ws-text tabular-nums">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex items-center gap-0.5 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4",
                    i < Math.round(averageRating)
                      ? "fill-ws-amber text-ws-amber"
                      : "text-ws-border"
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-ws-text-muted mt-1">
              {t("reviewCount", { count: reviewCount })}
            </p>
          </div>

          <div className="flex-1 space-y-1.5">
            {distribution.map(({ star, count }) => {
              const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-ws-text-muted tabular-nums">
                    {star}
                  </span>
                  <Star className="h-3 w-3 fill-ws-amber text-ws-amber" />
                  <div className="flex-1 h-1.5 bg-ws-dark rounded-full overflow-hidden">
                    <div
                      className="h-full bg-ws-amber rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-ws-text-muted tabular-nums">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Review list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-lg bg-ws-surface border border-ws-border animate-pulse"
            />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-ws-text-muted py-8 text-center">
          {t("noReviews")}
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <WsCard key={review.reviewId}>
              <WsCardContent>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3.5 w-3.5",
                            i < review.rating
                              ? "fill-ws-amber text-ws-amber"
                              : "text-ws-border"
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-sm font-medium text-ws-text mt-1">
                      {review.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-ws-text-muted">
                      {review.userName}
                    </p>
                    <p className="text-xs text-ws-text-muted">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-ws-text-secondary leading-relaxed">
                  {review.comment}
                </p>
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {review.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Review image ${i + 1}`}
                        className="w-16 h-16 rounded-md object-cover border border-ws-border"
                      />
                    ))}
                  </div>
                )}
              </WsCardContent>
            </WsCard>
          ))}
        </div>
      )}
    </div>
  );
}
