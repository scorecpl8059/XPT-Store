"use client";

import { useState, useEffect } from "react";
import {
  WsCard,
  WsCardContent,
} from "@/components/ui/cyber-card";
import { WsBadge } from "@/components/ui/cyber-badge";
import { WsButton } from "@/components/ui/cyber-button";
import { api } from "@/lib/api";
import { MessageSquare, Check, X, Star } from "lucide-react";

interface Review {
  reviewId: string;
  productId: string;
  userId: string;
  rating: number;
  title: string;
  comment: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

const statusColorMap: Record<string, string> = {
  pending: "amber",
  approved: "green",
  rejected: "red",
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<string>("pending");

  const fetchReviews = async (status?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (status && status !== "all") params.status = status;
      const res = await api.get<{ reviews: Review[] }>("/reviews/admin", params);
      setReviews(res.reviews ?? []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(activeStatus);
  }, [activeStatus]);

  const handleUpdateStatus = async (reviewId: string, status: "approved" | "rejected") => {
    try {
      await api.put(`/reviews/${reviewId}`, { status });
      await fetchReviews(activeStatus);
    } catch {
      // handle error
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ws-text">Reviews</h1>
        <p className="text-sm text-ws-text-muted">
          {reviews.length} review{reviews.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-1">
        {["all", "pending", "approved", "rejected"].map((status) => (
          <button
            key={status}
            onClick={() => setActiveStatus(status)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
              activeStatus === status
                ? "bg-ws-blue/10 text-ws-blue border border-ws-blue/20"
                : "text-ws-text-muted hover:text-ws-text hover:bg-ws-surface border border-transparent"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-ws-text-muted">Loading...</p>
      ) : reviews.length === 0 ? (
        <WsCard>
          <WsCardContent className="flex flex-col items-center py-12">
            <MessageSquare className="h-12 w-12 text-ws-text-muted/30 mb-3" />
            <p className="text-sm text-ws-text-muted">No reviews found</p>
          </WsCardContent>
        </WsCard>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <WsCard key={review.reviewId}>
              <WsCardContent className="py-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3.5 w-3.5 ${
                              s <= review.rating ? "fill-amber-400 text-amber-400" : "text-ws-border"
                            }`}
                          />
                        ))}
                      </div>
                      <WsBadge variant={(statusColorMap[review.status] ?? "muted") as any}>
                        {review.status}
                      </WsBadge>
                    </div>
                    <p className="text-sm font-medium text-ws-text">{review.title}</p>
                    <p className="text-xs text-ws-text-muted mt-1">{review.comment}</p>
                    <p className="text-xs text-ws-text-muted mt-2">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {review.status === "pending" && (
                    <div className="flex gap-1 shrink-0">
                      <WsButton
                        variant="ghost"
                        size="sm"
                        className="text-green-600"
                        onClick={() => handleUpdateStatus(review.reviewId, "approved")}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Approve
                      </WsButton>
                      <WsButton
                        variant="ghost"
                        size="sm"
                        className="text-red-500"
                        onClick={() => handleUpdateStatus(review.reviewId, "rejected")}
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Reject
                      </WsButton>
                    </div>
                  )}
                </div>
              </WsCardContent>
            </WsCard>
          ))}
        </div>
      )}
    </div>
  );
}
