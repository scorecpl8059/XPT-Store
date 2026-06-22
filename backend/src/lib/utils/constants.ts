export const OrderStatus = {
  PENDING: "pending",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

export const ReturnStatus = {
  REQUESTED: "requested",
  APPROVED: "approved",
  REJECTED: "rejected",
  REFUNDED: "refunded",
} as const;

export const ReviewStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export const ProductStatus = {
  ACTIVE: "active",
  DRAFT: "draft",
  ARCHIVED: "archived",
} as const;

export const AccountType = {
  INDIVIDUAL: "individual",
  BUSINESS: "business",
} as const;

export const UserRole = {
  CUSTOMER: "customer",
  ADMIN: "admin",
} as const;

export const RfqStatus = {
  PENDING: "pending",
  RESPONDED: "responded",
  CLOSED: "closed",
} as const;

export const RETURN_WINDOW_DAYS = 7;
export const LOW_STOCK_THRESHOLD = 5;
