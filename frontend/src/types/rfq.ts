export interface RfqItem {
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  quantity: number;
}

export interface Rfq {
  rfqId: string;
  userId: string;
  companyName?: string;
  items: RfqItem[];
  message?: string;
  status: "pending" | "quoted" | "accepted" | "rejected" | "expired";
  createdAt: string;
  updatedAt: string;
}

export interface CreateRfqInput {
  items: {
    productId: string;
    variantId?: string;
    quantity: number;
  }[];
  message?: string;
}
