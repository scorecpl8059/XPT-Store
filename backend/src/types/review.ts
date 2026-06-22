export interface Review {
  productId: string;
  reviewId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  title: string;
  comment: string;
  images?: string[];
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewInput {
  productId: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
}
