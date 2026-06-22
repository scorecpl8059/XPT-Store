"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  WsCard,
  WsCardContent,
  WsCardHeader,
  WsCardTitle,
} from "@/components/ui/cyber-card";
import { WsBadge } from "@/components/ui/cyber-badge";
import { api } from "@/lib/api";
import type { Order } from "@/types/order";
import { Package } from "lucide-react";

const statusColorMap: Record<string, string> = {
  pending: "amber",
  processing: "blue",
  shipped: "purple",
  delivered: "green",
  completed: "green",
  cancelled: "red",
  refunded: "muted",
};

export default function OrdersPage() {
  const t = useTranslations("account");
  const to = useTranslations("order");
  const tc = useTranslations("common");

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await api.get<{ orders: Order[] }>("/users/me/orders");
        setOrders(res.orders ?? []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  if (loading) {
    return <p className="text-sm text-ws-text-muted">{tc("loading")}</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-ws-text">{t("orders")}</h2>

      {orders.length === 0 ? (
        <WsCard>
          <WsCardContent className="flex flex-col items-center py-12">
            <Package className="h-12 w-12 text-ws-text-muted/30 mb-3" />
            <p className="text-sm text-ws-text-muted">{t("noOrders")}</p>
          </WsCardContent>
        </WsCard>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.orderId}
              href={`/account/orders/${order.orderId}` as any}
              className="block"
            >
              <WsCard className="hover:border-ws-blue/30 transition-colors">
                <WsCardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-ws-text">
                      {to("orderNumber")}
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-ws-text-muted">
                      {to("date")}:{" "}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-xs text-ws-text-muted">
                      {to("items")}: {order.items.length}
                    </div>
                    <WsBadge
                      variant={
                        (statusColorMap[order.status] ?? "muted") as any
                      }
                    >
                      {to(order.status)}
                    </WsBadge>
                    <span className="text-sm font-semibold text-ws-text tabular-nums">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                </WsCardContent>
              </WsCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
