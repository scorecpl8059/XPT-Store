"use client";

import { useState, useEffect, Fragment } from "react";
import {
  WsCard,
  WsCardContent,
} from "@/components/ui/cyber-card";
import { WsBadge } from "@/components/ui/cyber-badge";
import { WsButton } from "@/components/ui/cyber-button";
import { api } from "@/lib/api";
import type { Order } from "@/types/order";
import { Package, Download, ChevronRight, Truck } from "lucide-react";

const statuses = [
  "all",
  "processing",
  "shipped",
  "delivered",
  "refunded",
] as const;

const statusColorMap: Record<string, string> = {
  processing: "blue",
  shipped: "purple",
  delivered: "green",
  refunded: "muted",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOrders = async (status?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "50" };
      if (status && status !== "all") params.status = status;
      const res = await api.get<{ orders: Order[] }>("/admin/orders", params);
      setOrders(res.orders ?? []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(activeStatus);
  }, [activeStatus]);

  const handleExport = async () => {
    try {
      const params: Record<string, string> = {};
      if (activeStatus !== "all") params.status = activeStatus;
      const blob = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/orders/export?${new URLSearchParams(params)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      const csv = await blob.text();
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "orders.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // handle error
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ws-text">Orders</h1>
          <p className="text-sm text-ws-text-muted">
            {orders.length} order{orders.length !== 1 ? "s" : ""}
          </p>
        </div>
        <WsButton variant="secondary" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" />
          Export CSV
        </WsButton>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setActiveStatus(status)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
              activeStatus === status
                ? "bg-ws-blue/10 text-ws-blue border border-ws-blue/20"
                : "text-ws-text-muted hover:text-ws-text hover:bg-ws-surface border border-transparent"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Orders table */}
      {loading ? (
        <p className="text-sm text-ws-text-muted">Loading...</p>
      ) : orders.length === 0 ? (
        <WsCard>
          <WsCardContent className="flex flex-col items-center py-12">
            <Package className="h-12 w-12 text-ws-text-muted/30 mb-3" />
            <p className="text-sm text-ws-text-muted">No orders found</p>
          </WsCardContent>
        </WsCard>
      ) : (
        <div className="border border-ws-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ws-surface">
              <tr>
                <th className="w-8 px-2" />
                <th className="text-left px-4 py-2.5 text-xs font-medium text-ws-text-muted">
                  Order
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-ws-text-muted">
                  Date
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-ws-text-muted">
                  Status
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-ws-text-muted">
                  Items
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-ws-text-muted">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const isExpanded = expandedId === order.orderId;
                return (
                  <Fragment key={order.orderId}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : order.orderId)}
                      className="border-t border-ws-border hover:bg-ws-surface/50 transition-colors cursor-pointer"
                    >
                      <td className="px-2 py-3 text-ws-text-muted">
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-ws-blue">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-ws-text-muted">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <WsBadge
                          variant={(statusColorMap[order.status] ?? "muted") as any}
                        >
                          {order.status}
                        </WsBadge>
                      </td>
                      <td className="px-4 py-3 text-ws-text">
                        {order.items.length}
                      </td>
                      <td className="px-4 py-3 text-right text-ws-text tabular-nums font-medium">
                        ${order.total.toFixed(2)}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-t border-ws-border bg-ws-surface/30">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="space-y-4">
                            {/* Order items */}
                            <div>
                              <h4 className="text-xs font-medium text-ws-text-muted mb-2">Items</h4>
                              <div className="space-y-1.5">
                                {order.items.map((item, i) => (
                                  <div key={i} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="text-ws-text">{item.name}</span>
                                      <span className="text-ws-text-muted text-xs">
                                        SKU: {item.sku}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-4 tabular-nums">
                                      <span className="text-ws-text-muted">x{item.quantity}</span>
                                      <span className="text-ws-text font-medium w-20 text-right">
                                        ${(item.price * item.quantity).toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Tracking info */}
                            {order.trackingNumber && (
                              <div className="flex items-center gap-2 text-sm pt-2 border-t border-ws-border">
                                <Truck className="h-4 w-4 text-ws-text-muted" />
                                <span className="text-ws-text-muted">
                                  {order.carrier ?? "Carrier"}:
                                </span>
                                <span className="text-ws-text font-medium">
                                  {order.trackingNumber}
                                </span>
                                {order.shippedAt && (
                                  <span className="text-ws-text-muted text-xs ml-2">
                                    Shipped {new Date(order.shippedAt).toLocaleDateString()}
                                  </span>
                                )}
                                {order.deliveredAt && (
                                  <span className="text-ws-text-muted text-xs ml-2">
                                    Delivered {new Date(order.deliveredAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Summary + link */}
                            <div className="flex items-center justify-between pt-2 border-t border-ws-border text-sm">
                              <div className="flex gap-4 text-ws-text-muted text-xs">
                                <span>Subtotal: ${order.subtotal.toFixed(2)}</span>
                                <span>Shipping: ${order.shippingCost.toFixed(2)}</span>
                                <span>Tax: ${order.tax.toFixed(2)}</span>
                              </div>
                              <a
                                href={`/admin/orders/${order.orderId}`}
                                className="text-xs text-ws-blue hover:underline"
                              >
                                Full details
                              </a>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
