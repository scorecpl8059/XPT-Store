export interface OrderItem {
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  orderId: string;
  orderNumber: string; // e.g., XPT-20260620-0001
  userId: string;
  status: "processing" | "shipped" | "delivered" | "refunded";
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  shippingAddress: {
    recipientName: string;
    phone: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  billingAddress?: {
    recipientName: string;
    street1: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentIntentId?: string;
  poNumber?: string;
  notes?: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  invoiceUrl?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  items: {
    productId: string;
    variantId?: string;
    quantity: number;
  }[];
  shippingAddressId: string;
  billingAddressId?: string;
  poNumber?: string;
  notes?: string;
}
