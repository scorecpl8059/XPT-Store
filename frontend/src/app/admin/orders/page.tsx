"use client";

import { useState, useEffect } from "react";
import {
  WsCard,
  WsCardContent,
} from "@/components/ui/cyber-card";
import { WsBadge } from "@/components/ui/cyber-badge";
import { WsButton } from "@/components/ui/cyber-button";
import { api } from "@/lib/api";
import type { Order } from "@/types/order";
import { Package, Download } from "lucide-react";

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

  const fetchOrders = async (status?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "50" };
      if (status && status !== "all") params.status = status;
      const res = await api.get<{ orders: Order[] }>("/orders/admin", params);
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
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/orders/export?${new URLSearchParams(params)}`,
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
                <th className="text-right px-4 py-2.5 text-xs font-medium text-ws-text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.orderId}
                  className="border-t border-ws-border hover:bg-ws-surface/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <a
                      href={`/admin/orders/${order.orderId}`}
                      className="text-ws-blue hover:underline font-medium"
                    >
                      {order.orderNumber}
                    </a>
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
                  <td className="px-4 py-3 text-right">
                    <a
                      href={`/admin/orders/${order.orderId}`}
                      className="text-xs text-ws-blue hover:underline"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
