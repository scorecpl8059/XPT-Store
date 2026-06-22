"use client";

import { useState, useEffect, use } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  WsCard,
  WsCardContent,
  WsCardHeader,
  WsCardTitle,
} from "@/components/ui/cyber-card";
import { WsBadge } from "@/components/ui/cyber-badge";
import { WsButton } from "@/components/ui/cyber-button";
import { api } from "@/lib/api";
import type { Order } from "@/types/order";
import { ArrowLeft, Package, Truck } from "lucide-react";

const statusColorMap: Record<string, string> = {
  pending: "amber",
  processing: "blue",
  shipped: "purple",
  delivered: "green",
  completed: "green",
  cancelled: "red",
  refunded: "muted",
};

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = use(params);
  const t = useTranslations("account");
  const to = useTranslations("order");
  const tc = useTranslations("common");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await api.get<Order>(`/orders/${id}`);
        setOrder(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : tc("error"));
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id, tc]);

  if (loading) {
    return <p className="text-sm text-ws-text-muted">{tc("loading")}</p>;
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-red-400 mb-3">{error || tc("error")}</p>
        <Link href="/account/orders">
          <WsButton variant="secondary">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {tc("back")}
          </WsButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/account/orders">
            <WsButton variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </WsButton>
          </Link>
          <div>
            <h2 className="text-xl font-bold text-ws-text">
              {t("orderDetails")}
            </h2>
            <p className="text-sm text-ws-text-muted">
              {to("orderNumber")}
              {order.orderNumber}
            </p>
          </div>
        </div>
        <WsBadge
          variant={(statusColorMap[order.status] ?? "muted") as any}
        >
          {to(order.status)}
        </WsBadge>
      </div>

      {/* Dates & Tracking */}
      <WsCard>
        <WsCardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          <div>
            <p className="text-xs text-ws-text-muted">{to("date")}</p>
            <p className="text-sm text-ws-text">
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          {order.trackingNumber && (
            <div>
              <p className="text-xs text-ws-text-muted">{to("tracking")}</p>
              <div className="flex items-center gap-1">
                <Truck className="h-3.5 w-3.5 text-ws-blue" />
                <p className="text-sm text-ws-text">
                  {order.carrier ? `${order.carrier}: ` : ""}
                  {order.trackingNumber}
                </p>
              </div>
            </div>
          )}
          {order.shippedAt && (
            <div>
              <p className="text-xs text-ws-text-muted">Shipped</p>
              <p className="text-sm text-ws-text">
                {new Date(order.shippedAt).toLocaleDateString()}
              </p>
            </div>
          )}
          {order.deliveredAt && (
            <div>
              <p className="text-xs text-ws-text-muted">Delivered</p>
              <p className="text-sm text-ws-text">
                {new Date(order.deliveredAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </WsCardContent>
      </WsCard>

      {/* Order Items */}
      <WsCard>
        <WsCardHeader>
          <WsCardTitle>{t("orderItems")}</WsCardTitle>
        </WsCardHeader>
        <WsCardContent>
          <div className="divide-y divide-ws-border">
            {order.items.map((item, idx) => (
              <div
                key={`${item.productId}-${idx}`}
                className="flex items-center gap-4 py-3"
              >
                {/* Image */}
                <div className="h-14 w-14 rounded-md bg-ws-dark overflow-hidden shrink-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-ws-text-muted/30" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ws-text truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-ws-text-muted">
                    SKU: {item.sku} &middot; Qty: {item.quantity}
                  </p>
                </div>

                {/* Price */}
                <p className="text-sm font-medium text-ws-text tabular-nums">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </WsCardContent>
      </WsCard>

      {/* Shipping Address */}
      <WsCard>
        <WsCardHeader>
          <WsCardTitle>{t("shippingAddress")}</WsCardTitle>
        </WsCardHeader>
        <WsCardContent>
          <div className="text-sm text-ws-text space-y-0.5">
            <p className="font-medium">
              {order.shippingAddress.recipientName}
            </p>
            <p>{order.shippingAddress.street1}</p>
            {order.shippingAddress.street2 && (
              <p>{order.shippingAddress.street2}</p>
            )}
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.zipCode}
            </p>
            <p>{order.shippingAddress.country}</p>
            {order.shippingAddress.phone && (
              <p className="text-ws-text-muted">
                {order.shippingAddress.phone}
              </p>
            )}
          </div>
        </WsCardContent>
      </WsCard>

      {/* Totals */}
      <WsCard>
        <WsCardContent className="py-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-ws-text-muted">
              <span>Subtotal</span>
              <span className="tabular-nums">
                ${order.subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-ws-text-muted">
              <span>Shipping</span>
              <span className="tabular-nums">
                ${order.shippingCost.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-ws-text-muted">
              <span>Tax</span>
              <span className="tabular-nums">${order.tax.toFixed(2)}</span>
            </div>
            <div className="border-t border-ws-border pt-2 flex justify-between font-semibold text-ws-text">
              <span>{to("total")}</span>
              <span className="tabular-nums">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </WsCardContent>
      </WsCard>

      {/* PO Number / Notes */}
      {(order.poNumber || order.notes) && (
        <WsCard>
          <WsCardContent className="py-4 space-y-2 text-sm">
            {order.poNumber && (
              <div>
                <span className="text-ws-text-muted">PO Number: </span>
                <span className="text-ws-text">{order.poNumber}</span>
              </div>
            )}
            {order.notes && (
              <div>
                <span className="text-ws-text-muted">Notes: </span>
                <span className="text-ws-text">{order.notes}</span>
              </div>
            )}
          </WsCardContent>
        </WsCard>
      )}
    </div>
  );
}
