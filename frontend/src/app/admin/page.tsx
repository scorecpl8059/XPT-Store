"use client";

import { useState, useEffect } from "react";
import {
  WsCard,
  WsCardContent,
  WsCardHeader,
  WsCardTitle,
} from "@/components/ui/cyber-card";
import { WsBadge } from "@/components/ui/cyber-badge";
import { api } from "@/lib/api";
import type { Order } from "@/types/order";
import {
  ShoppingCart,
  DollarSign,
  Users,
  AlertTriangle,
  Package,
  TrendingUp,
} from "lucide-react";

const statusColorMap: Record<string, string> = {
  processing: "blue",
  shipped: "purple",
  delivered: "green",
  refunded: "muted",
};

export default function AdminDashboardPage() {
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    revenue: 0,
    processingOrders: 0,
    lowStock: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [ordersRes, pendingRes, inventoryRes] = await Promise.allSettled([
          api.get<{ orders: Order[] }>("/orders/admin", { limit: "10" }),
          api.get<{ orders: Order[] }>("/orders/admin", { status: "processing" }),
          api.get<{ inventory: { lowStock: boolean }[] }>("/inventory", { lowStock: "true" }),
        ]);

        if (ordersRes.status === "fulfilled") {
          const orders = ordersRes.value.orders ?? [];
          setRecentOrders(orders);
          const revenue = orders.reduce((sum, o) => sum + o.total, 0);
          setStats((prev) => ({ ...prev, totalOrders: orders.length, revenue }));
        }
        if (pendingRes.status === "fulfilled") {
          setStats((prev) => ({
            ...prev,
            processingOrders: pendingRes.value.orders?.length ?? 0,
          }));
        }
        if (inventoryRes.status === "fulfilled") {
          setStats((prev) => ({
            ...prev,
            lowStock: inventoryRes.value.inventory?.length ?? 0,
          }));
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-6"><p className="text-sm text-ws-text-muted">Loading...</p></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-ws-text">Dashboard</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WsCard>
          <WsCardContent className="flex items-center gap-3 py-4">
            <div className="p-2 bg-ws-blue/10 rounded-md">
              <ShoppingCart className="h-5 w-5 text-ws-blue" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ws-text">{stats.totalOrders}</p>
              <p className="text-xs text-ws-text-muted">Recent Orders</p>
            </div>
          </WsCardContent>
        </WsCard>

        <WsCard>
          <WsCardContent className="flex items-center gap-3 py-4">
            <div className="p-2 bg-green-100 rounded-md">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ws-text">
                ${stats.revenue.toFixed(0)}
              </p>
              <p className="text-xs text-ws-text-muted">Revenue</p>
            </div>
          </WsCardContent>
        </WsCard>

        <WsCard>
          <WsCardContent className="flex items-center gap-3 py-4">
            <div className="p-2 bg-amber-100 rounded-md">
              <Package className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ws-text">{stats.processingOrders}</p>
              <p className="text-xs text-ws-text-muted">Processing Orders</p>
            </div>
          </WsCardContent>
        </WsCard>

        <WsCard>
          <WsCardContent className="flex items-center gap-3 py-4">
            <div className="p-2 bg-red-100 rounded-md">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ws-text">{stats.lowStock}</p>
              <p className="text-xs text-ws-text-muted">Low Stock Items</p>
            </div>
          </WsCardContent>
        </WsCard>
      </div>

      {/* Recent Orders */}
      <WsCard>
        <WsCardHeader className="flex flex-row items-center justify-between">
          <WsCardTitle>Recent Orders</WsCardTitle>
          <a href="/admin/orders" className="text-xs text-ws-blue hover:underline">
            View all
          </a>
        </WsCardHeader>
        <WsCardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-ws-text-muted">No recent orders</p>
          ) : (
            <div className="border border-ws-border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-ws-surface">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-medium text-ws-text-muted">Order</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-ws-text-muted">Date</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-ws-text-muted">Status</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-ws-text-muted">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.slice(0, 10).map((order) => (
                    <tr key={order.orderId} className="border-t border-ws-border">
                      <td className="px-3 py-2">
                        <a
                          href={`/admin/orders/${order.orderId}`}
                          className="text-ws-blue hover:underline"
                        >
                          {order.orderNumber}
                        </a>
                      </td>
                      <td className="px-3 py-2 text-ws-text-muted">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2">
                        <WsBadge variant={(statusColorMap[order.status] ?? "muted") as any}>
                          {order.status}
                        </WsBadge>
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-ws-text tabular-nums">
                        ${order.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </WsCardContent>
      </WsCard>
    </div>
  );
}
