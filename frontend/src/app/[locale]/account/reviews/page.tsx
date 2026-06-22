"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  WsCard,
  WsCardContent,
} from "@/components/ui/cyber-card";
import { WsBadge } from "@/components/ui/cyber-badge";
import { api } from "@/lib/api";
import type { Review } from "@/types/review";
import { Star, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColorMap: Record<string, string> = {
  pending: "amber",
  approved: "green",
  rejected: "red",
};

export default function ReviewsPage() {
  const t = useTranslations("account");
  const tc = useTranslations("common");

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await api.get<{ reviews: Review[] }>("/users/me/reviews");
        setReviews(res.reviews ?? []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, []);

  if (loading) {
    return <p className="text-sm text-ws-text-muted">{tc("loading")}</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-ws-text">{t("reviews")}</h2>

      {reviews.length === 0 ? (
        <WsCard>
          <WsCardContent className="flex flex-col items-center py-12">
            <MessageSquare className="h-12 w-12 text-ws-text-muted/30 mb-3" />
            <p className="text-sm text-ws-text-muted">{t("noReviews")}</p>
          </WsCardContent>
        </WsCard>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <WsCard key={review.reviewId}>
              <WsCardContent className="py-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-ws-text">
                      {review.title}
                    </p>
                    <p className="text-xs text-ws-text-muted">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <WsBadge
                    variant={
                      (statusColorMap[review.status] ?? "muted") as any
                    }
                  >
                    {review.status}
                  </WsBadge>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < review.rating
                          ? "fill-ws-amber text-ws-amber"
                          : "text-ws-border"
                      )}
                    />
                  ))}
                </div>

                <p className="text-sm text-ws-text-secondary">
                  {review.comment}
                </p>
              </WsCardContent>
            </WsCard>
          ))}
        </div>
      )}
    </div>
  );
}
