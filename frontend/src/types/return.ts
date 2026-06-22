export interface ReturnItem {
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
}

export interface Return {
  returnId: string;
  orderId: string;
  userId: string;
  status: "requested" | "approved" | "rejected" | "received" | "refunded";
  items: ReturnItem[];
  reason: string;
  images?: string[];
  refundAmount?: number;
  adminNotes?: string;
  requestedAt: string;
  updatedAt: string;
}

export interface CreateReturnInput {
  orderId: string;
  items: {
    productId: string;
    variantId?: string;
    quantity: number;
  }[];
  reason: string;
  images?: string[];
}
