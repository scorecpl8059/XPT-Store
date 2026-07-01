"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  WsCard,
  WsCardContent,
  WsCardHeader,
  WsCardTitle,
} from "@/components/ui/cyber-card";
import { WsBadge } from "@/components/ui/cyber-badge";
import { WsButton } from "@/components/ui/cyber-button";
import { WsInput, WsLabel } from "@/components/ui/cyber-input";
import { api } from "@/lib/api";
import type { Order } from "@/types/order";
import { ArrowLeft, Package, Truck, Save } from "lucide-react";

const statusColorMap: Record<string, string> = {
  processing: "blue",
  shipped: "purple",
  delivered: "green",
  refunded: "muted",
};

const statusOptions = [
  "processing",
  "shipped",
  "delivered",
] as const;

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [status, setStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await api.get<Order>(`/orders/${id}`);
        setOrder(res);
        setStatus(res.status);
        setTrackingNumber(res.trackingNumber ?? "");
        setCarrier(res.carrier ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load order");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  const handleUpdate = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const updates: Record<string, string> = {};
      if (status !== order?.status) updates.status = status;
      if (trackingNumber !== (order?.trackingNumber ?? ""))
        updates.trackingNumber = trackingNumber;
      if (carrier !== (order?.carrier ?? "")) updates.carrier = carrier;

      const res = await api.put<{ order: Order }>(`/orders/${id}`, updates);
      setOrder(res.order);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-ws-text-muted">Loading...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6 text-center py-12">
        <p className="text-sm text-red-400 mb-3">{error || "Order not found"}</p>
        <a href="/admin/orders">
          <WsButton variant="secondary">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Orders
          </WsButton>
        </a>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/admin/orders">
            <WsButton variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </WsButton>
          </a>
          <div>
            <h1 className="text-xl font-bold text-ws-text">
              {order.orderNumber}
            </h1>
            <p className="text-sm text-ws-text-muted">
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <WsBadge variant={(statusColorMap[order.status] ?? "muted") as any}>
          {order.status}
        </WsBadge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — order details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <WsCard>
            <WsCardHeader>
              <WsCardTitle>Order Items</WsCardTitle>
            </WsCardHeader>
            <WsCardContent>
              <div className="divide-y divide-ws-border">
                {order.items.map((item, idx) => (
                  <div key={`${item.productId}-${idx}`} className="flex items-center gap-4 py-3">
                    <div className="h-12 w-12 rounded-md bg-ws-surface overflow-hidden shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-ws-text-muted/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ws-text truncate">{item.name}</p>
                      <p className="text-xs text-ws-text-muted">
                        SKU: {item.sku} · Qty: {item.quantity} · ${item.price.toFixed(2)} each
                      </p>
                    </div>
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
              <WsCardTitle>Shipping Address</WsCardTitle>
            </WsCardHeader>
            <WsCardContent>
              <div className="text-sm text-ws-text space-y-0.5">
                <p className="font-medium">{order.shippingAddress.recipientName}</p>
                <p>{order.shippingAddress.street1}</p>
                {order.shippingAddress.street2 && <p>{order.shippingAddress.street2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.zipCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && (
                  <p className="text-ws-text-muted">{order.shippingAddress.phone}</p>
                )}
              </div>
            </WsCardContent>
          </WsCard>

          {/* PO / Notes */}
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

        {/* Right column — status & tracking */}
        <div className="space-y-6">
          {/* Totals */}
          <WsCard>
            <WsCardHeader>
              <WsCardTitle>Summary</WsCardTitle>
            </WsCardHeader>
            <WsCardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-ws-text-muted">
                  <span>Subtotal</span>
                  <span className="tabular-nums">${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-ws-text-muted">
                  <span>Shipping</span>
                  <span className="tabular-nums">${order.shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-ws-text-muted">
                  <span>Tax</span>
                  <span className="tabular-nums">${order.tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-ws-border pt-2 flex justify-between font-semibold text-ws-text">
                  <span>Total</span>
                  <span className="tabular-nums">${order.total.toFixed(2)}</span>
                </div>
              </div>
            </WsCardContent>
          </WsCard>

          {/* Update Status & Tracking */}
          <WsCard>
            <WsCardHeader>
              <WsCardTitle>Update Order</WsCardTitle>
            </WsCardHeader>
            <WsCardContent className="space-y-4">
              <div>
                <WsLabel>Status</WsLabel>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-ws-border bg-white px-3 py-1 text-sm text-ws-text shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ws-blue"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <WsLabel>Tracking Number</WsLabel>
                <WsInput
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g., 1Z999AA10123456784"
                />
              </div>

              <div>
                <WsLabel>Carrier</WsLabel>
                <WsInput
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="e.g., UPS, FedEx, USPS"
                />
              </div>

              <WsButton
                variant="primary"
                className="w-full"
                onClick={handleUpdate}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-1" />
                {saving ? "Saving..." : saved ? "Saved!" : "Update Order"}
              </WsButton>
            </WsCardContent>
          </WsCard>

          {/* Tracking info (if exists) */}
          {order.trackingNumber && (
            <WsCard>
              <WsCardHeader>
                <WsCardTitle>Tracking</WsCardTitle>
              </WsCardHeader>
              <WsCardContent>
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="h-4 w-4 text-ws-blue" />
                  <span className="text-ws-text">
                    {order.carrier ? `${order.carrier}: ` : ""}
                    {order.trackingNumber}
                  </span>
                </div>
                {order.shippedAt && (
                  <p className="text-xs text-ws-text-muted mt-1">
                    Shipped: {new Date(order.shippedAt).toLocaleDateString()}
                  </p>
                )}
                {order.deliveredAt && (
                  <p className="text-xs text-ws-text-muted mt-1">
                    Delivered: {new Date(order.deliveredAt).toLocaleDateString()}
                  </p>
                )}
              </WsCardContent>
            </WsCard>
          )}
        </div>
      </div>
    </div>
  );
}
