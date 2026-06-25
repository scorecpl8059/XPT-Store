const PREFIX = "xpt_store_";

export const Tables = {
  USERS: `${PREFIX}users`,
  SESSIONS: `${PREFIX}sessions`,
  VERIFICATION_TOKENS: `${PREFIX}verification_tokens`,
  ADDRESSES: `${PREFIX}addresses`,
  CATEGORIES: `${PREFIX}categories`,
  PRODUCTS: `${PREFIX}products`,
  VARIANTS: `${PREFIX}variants`,
  INVENTORY_LOGS: `${PREFIX}inventory_logs`,
  CART: `${PREFIX}cart`,
  ORDERS: `${PREFIX}orders`,
  REVIEWS: `${PREFIX}reviews`,
  WISHLISTS: `${PREFIX}wishlists`,
  RETURNS: `${PREFIX}returns`,
  SHIPPING_ZONES: `${PREFIX}shipping_zones`,
  RFQ: `${PREFIX}rfq`,
  PAGES: `${PREFIX}pages`,
  SETTINGS: `${PREFIX}settings`,
  SEARCH_LOGS: `${PREFIX}search_logs`,
  AUDIT_LOGS: `${PREFIX}audit_logs`,
} as const;
