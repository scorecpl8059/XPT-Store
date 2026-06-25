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
import { api } from "@/lib/api";
import type { Order } from "@/types/order";
import { ArrowLeft, Shield, ShieldOff } from "lucide-react";

interface UserDetail {
  userId: string;
  name: string;
  email: string;
  role: "admin" | "customer";
  accountType: "individual" | "business";
  companyName?: string;
  taxId?: string;
  phone?: string;
  createdAt: string;
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [userRes, ordersRes] = await Promise.allSettled([
          api.get<{ user: UserDetail }>(`/users/${id}`),
          api.get<{ orders: Order[] }>(`/users/${id}/orders`),
        ]);
        if (userRes.status === "fulfilled") setUser(userRes.value.user);
        else setError("User not found");
        if (ordersRes.status === "fulfilled") setOrders(ordersRes.value.orders ?? []);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const toggleRole = async () => {
    if (!user) return;
    const newRole = user.role === "admin" ? "customer" : "admin";
    try {
      await api.put(`/users/${id}/role`, { role: newRole });
      setUser((prev) => prev ? { ...prev, role: newRole } : prev);
    } catch {
      // handle error
    }
  };

  if (loading) {
    return <div className="p-6"><p className="text-sm text-ws-text-muted">Loading...</p></div>;
  }

  if (error || !user) {
    return (
      <div className="p-6 text-center py-12">
        <p className="text-sm text-red-400 mb-3">{error || "User not found"}</p>
        <a href="/admin/users">
          <WsButton variant="secondary">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Users
          </WsButton>
        </a>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <a href="/admin/users">
          <WsButton variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </WsButton>
        </a>
        <div>
          <h1 className="text-xl font-bold text-ws-text">{user.name}</h1>
          <p className="text-sm text-ws-text-muted">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Profile */}
          <WsCard>
            <WsCardHeader>
              <WsCardTitle>Profile</WsCardTitle>
            </WsCardHeader>
            <WsCardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-ws-text-muted text-xs">Account Type</p>
                  <WsBadge variant={user.accountType === "business" ? "blue" : "muted"}>
                    {user.accountType}
                  </WsBadge>
                </div>
                <div>
                  <p className="text-ws-text-muted text-xs">Role</p>
                  <WsBadge variant={user.role === "admin" ? "purple" : "muted"}>
                    {user.role}
                  </WsBadge>
                </div>
                {user.companyName && (
                  <div>
                    <p className="text-ws-text-muted text-xs">Company</p>
                    <p className="text-ws-text">{user.companyName}</p>
                  </div>
                )}
                {user.phone && (
                  <div>
                    <p className="text-ws-text-muted text-xs">Phone</p>
                    <p className="text-ws-text">{user.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-ws-text-muted text-xs">Joined</p>
                  <p className="text-ws-text">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </WsCardContent>
          </WsCard>

          {/* Order History */}
          <WsCard>
            <WsCardHeader>
              <WsCardTitle>Order History ({orders.length})</WsCardTitle>
            </WsCardHeader>
            <WsCardContent>
              {orders.length === 0 ? (
                <p className="text-sm text-ws-text-muted">No orders</p>
              ) : (
                <div className="space-y-2">
                  {orders.map((order) => (
                    <a
                      key={order.orderId}
                      href={`/admin/orders/${order.orderId}`}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-ws-surface transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-ws-blue">{order.orderNumber}</p>
                        <p className="text-xs text-ws-text-muted">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <WsBadge variant="muted">{order.status}</WsBadge>
                        <span className="text-sm font-medium text-ws-text tabular-nums">
                          ${order.total.toFixed(2)}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </WsCardContent>
          </WsCard>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <WsCard>
            <WsCardHeader>
              <WsCardTitle>Actions</WsCardTitle>
            </WsCardHeader>
            <WsCardContent>
              <WsButton
                variant={user.role === "admin" ? "secondary" : "primary"}
                className="w-full"
                onClick={toggleRole}
              >
                {user.role === "admin" ? (
                  <>
                    <ShieldOff className="h-4 w-4 mr-1" />
                    Remove Admin
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-1" />
                    Make Admin
                  </>
                )}
              </WsButton>
            </WsCardContent>
          </WsCard>
        </div>
      </div>
    </div>
  );
}
