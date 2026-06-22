"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { WsButton } from "@/components/ui/cyber-button";
import { WsCard, WsCardContent } from "@/components/ui/cyber-card";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
  productId: string;
  isLoggedIn: boolean;
  onSubmitted: () => void;
  onCancel: () => void;
}

export function ReviewForm({
  productId,
  isLoggedIn,
  onSubmitted,
  onCancel,
}: ReviewFormProps) {
  const t = useTranslations("product");
  const tc = useTranslations("common");

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isLoggedIn) {
    return (
      <WsCard>
        <WsCardContent>
          <p className="text-sm text-ws-text-muted text-center py-4">
            {t("reviewLoginRequired")}
          </p>
        </WsCardContent>
      </WsCard>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setSubmitting(true);
    setError("");

    try {
      await api.post(`/products/${productId}/reviews`, {
        rating,
        title,
        comment,
      });
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <WsCard>
      <WsCardContent>
        <h3 className="text-sm font-semibold text-ws-text mb-4">
          {t("writeReview")}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star rating */}
          <div>
            <label className="text-xs font-medium text-ws-text-secondary">
              {t("reviewRating")}
            </label>
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: 5 }).map((_, i) => {
                const starValue = i + 1;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-0.5"
                  >
                    <Star
                      className={cn(
                        "h-6 w-6 transition-colors",
                        starValue <= (hoverRating || rating)
                          ? "fill-ws-amber text-ws-amber"
                          : "text-ws-border"
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-ws-text-secondary">
              {t("reviewTitle")}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-ws-border bg-ws-dark px-3 py-2 text-sm text-ws-text placeholder:text-ws-text-muted focus:border-ws-blue focus:outline-none"
              placeholder={t("reviewTitle")}
            />
          </div>

          {/* Comment */}
          <div>
            <label className="text-xs font-medium text-ws-text-secondary">
              {t("reviewComment")}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              rows={4}
              className="mt-1 w-full rounded-md border border-ws-border bg-ws-dark px-3 py-2 text-sm text-ws-text placeholder:text-ws-text-muted focus:border-ws-blue focus:outline-none resize-none"
              placeholder={t("reviewComment")}
            />
          </div>

          {error && (
            <p className="text-xs text-ws-red">{error}</p>
          )}

          <div className="flex gap-2">
            <WsButton
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting || rating === 0}
            >
              {submitting ? tc("loading") : t("submitReview")}
            </WsButton>
            <WsButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
            >
              {tc("cancel")}
            </WsButton>
          </div>
        </form>
      </WsCardContent>
    </WsCard>
  );
}
