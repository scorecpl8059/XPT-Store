declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function gtag(...args: unknown[]) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag(...args);
  }
}

export function trackViewItem(item: {
  id: string;
  name: string;
  price: number;
  category?: string;
}) {
  gtag("event", "view_item", {
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        item_category: item.category,
      },
    ],
  });
}

export function trackAddToCart(item: {
  id: string;
  name: string;
  price: number;
  quantity: number;
}) {
  gtag("event", "add_to_cart", {
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      },
    ],
  });
}

export function trackBeginCheckout(value: number) {
  gtag("event", "begin_checkout", {
    value,
    currency: "USD",
  });
}

export function trackPurchase(order: {
  orderId: string;
  total: number;
  shipping: number;
  tax: number;
}) {
  gtag("event", "purchase", {
    transaction_id: order.orderId,
    value: order.total,
    shipping: order.shipping,
    tax: order.tax,
    currency: "USD",
  });
}

export function trackSearch(query: string) {
  gtag("event", "search", {
    search_term: query,
  });
}
