"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  WsCard,
  WsCardContent,
  WsCardHeader,
  WsCardTitle,
} from "@/components/ui/cyber-card";
import { WsButton } from "@/components/ui/cyber-button";
import { WsInput, WsLabel } from "@/components/ui/cyber-input";
import { api } from "@/lib/api";
import type { Order } from "@/types/order";
import { ArrowLeft, CheckCircle } from "lucide-react";

export default function NewReturnPage() {
  const tc = useTranslations("common");
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedItems, setSelectedItems] = useState<
    { productId: string; variantId?: string; quantity: number }[]
  >([]);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await api.get<{ orders: Order[] }>("/users/me/orders");
        // Only show delivered orders within 30-day return window
        const eligible = (res.orders ?? []).filter((o) => {
          if (o.status !== "delivered") return false;
          const deliveredAt = o.deliveredAt || o.updatedAt;
          const daysSince = Math.floor(
            (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysSince <= 30;
        });
        setOrders(eligible);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const selectedOrder = orders.find((o) => o.orderId === selectedOrderId);

  const toggleItem = (productId: string, variantId?: string) => {
    setSelectedItems((prev) => {
      const exists = prev.find(
        (i) => i.productId === productId && i.variantId === variantId
      );
      if (exists) {
        return prev.filter(
          (i) => !(i.productId === productId && i.variantId === variantId)
        );
      }
      const orderItem = selectedOrder?.items.find(
        (i) => i.productId === productId
      );
      return [...prev, { productId, variantId, quantity: orderItem?.quantity ?? 1 }];
    });
  };

  const handleSubmit = async () => {
    if (!selectedOrderId || selectedItems.length === 0 || !reason) return;
    setSubmitting(true);
    try {
      await api.post("/returns", {
        orderId: selectedOrderId,
        items: selectedItems,
        reason,
      });
      setSubmitted(true);
    } catch {
      // handle error
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <CheckCircle className="h-12 w-12 text-ws-green mb-3" />
        <h2 className="text-lg font-bold text-ws-text mb-1">Return Request Submitted</h2>
        <p className="text-sm text-ws-text-muted mb-4">
          We&apos;ll review your request and get back to you.
        </p>
        <WsButton variant="primary" onClick={() => router.push("/account/returns" as any)}>
          View Returns
        </WsButton>
      </div>
    );
  }

  if (loading) {
    return <p className="text-sm text-ws-text-muted">{tc("loading")}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <WsButton variant="ghost" size="icon" onClick={() => router.push("/account/returns" as any)}>
          <ArrowLeft className="h-4 w-4" />
        </WsButton>
        <h2 className="text-xl font-bold text-ws-text">Request a Return</h2>
      </div>

      {/* Select Order */}
      <WsCard>
        <WsCardHeader>
          <WsCardTitle>Select Order</WsCardTitle>
        </WsCardHeader>
        <WsCardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-ws-text-muted">
              No eligible orders. Returns are available within 30 days of delivery.
            </p>
          ) : (
            <select
              value={selectedOrderId}
              onChange={(e) => {
                setSelectedOrderId(e.target.value);
                setSelectedItems([]);
              }}
              className="flex h-9 w-full rounded-md border border-ws-border bg-white px-3 py-1 text-sm text-ws-text shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ws-blue"
            >
              <option value="">Choose an order...</option>
              {orders.map((order) => (
                <option key={order.orderId} value={order.orderId}>
                  {order.orderNumber} — ${order.total.toFixed(2)} —{" "}
                  {new Date(order.createdAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          )}
        </WsCardContent>
      </WsCard>

      {/* Select Items */}
      {selectedOrder && (
        <WsCard>
          <WsCardHeader>
            <WsCardTitle>Select Items to Return</WsCardTitle>
          </WsCardHeader>
          <WsCardContent>
            <div className="space-y-2">
              {selectedOrder.items.map((item, idx) => {
                const isSelected = selectedItems.some(
                  (i) => i.productId === item.productId
                );
                return (
                  <label
                    key={`${item.productId}-${idx}`}
                    className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                      isSelected
                        ? "border-ws-blue/40 bg-ws-blue/5"
                        : "border-ws-border hover:border-ws-blue/20"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleItem(item.productId, item.variantId)}
                      className="rounded border-ws-border"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ws-text">{item.name}</p>
                      <p className="text-xs text-ws-text-muted">
                        SKU: {item.sku} · Qty: {item.quantity} · ${item.price.toFixed(2)}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </WsCardContent>
        </WsCard>
      )}

      {/* Reason */}
      {selectedItems.length > 0 && (
        <WsCard>
          <WsCardHeader>
            <WsCardTitle>Reason for Return</WsCardTitle>
          </WsCardHeader>
          <WsCardContent>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Please describe why you'd like to return these items..."
              className="flex w-full rounded-md border border-ws-border bg-white px-3 py-2 text-sm text-ws-text shadow-sm placeholder:text-ws-text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ws-blue"
            />
          </WsCardContent>
        </WsCard>
      )}

      {/* Submit */}
      {selectedItems.length > 0 && reason && (
        <WsButton
          variant="primary"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Return Request"}
        </WsButton>
      )}
    </div>
  );
}
