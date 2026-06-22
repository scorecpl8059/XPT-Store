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
import { WsButton } from "@/components/ui/cyber-button";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import type { Order } from "@/types/order";
import type { Address } from "@/types/user";
import { Package, MapPin, Heart, ArrowRight } from "lucide-react";

interface WishlistItem {
  productId: string;
}

const statusColorMap: Record<string, string> = {
  pending: "amber",
  processing: "blue",
  shipped: "purple",
  delivered: "green",
  completed: "green",
  cancelled: "red",
  refunded: "muted",
};

export default function AccountDashboardPage() {
  const { user } = useAuth();
  const t = useTranslations("account");
  const to = useTranslations("order");
  const tc = useTranslations("common");

  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [ordersRes, addressesRes, wishlistRes] = await Promise.allSettled([
          api.get<{ orders: Order[] }>("/users/me/orders", { limit: "5" }),
          api.get<{ addresses: Address[] }>("/users/me/addresses"),
          api.get<{ items: WishlistItem[] }>("/users/me/wishlist"),
        ]);

        if (ordersRes.status === "fulfilled") {
          setOrders(ordersRes.value.orders ?? []);
        }
        if (addressesRes.status === "fulfilled") {
          setAddresses(addressesRes.value.addresses ?? []);
        }
        if (wishlistRes.status === "fulfilled") {
          setWishlistCount(wishlistRes.value.items?.length ?? 0);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <p className="text-sm text-ws-text-muted">{tc("loading")}</p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <p className="text-lg text-ws-text">
        {t("welcome", { name: user?.name ?? "" })}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <WsCard>
          <WsCardContent className="flex items-center gap-3 py-4">
            <Package className="h-8 w-8 text-ws-blue" />
            <div>
              <p className="text-2xl font-bold text-ws-text">{orders.length}</p>
              <p className="text-xs text-ws-text-muted">{t("recentOrders")}</p>
            </div>
          </WsCardContent>
        </WsCard>

        <WsCard>
          <WsCardContent className="flex items-center gap-3 py-4">
            <MapPin className="h-8 w-8 text-ws-blue" />
            <div>
              <p className="text-2xl font-bold text-ws-text">
                {addresses.length}
              </p>
              <p className="text-xs text-ws-text-muted">
                {t("savedAddresses")}
              </p>
            </div>
          </WsCardContent>
        </WsCard>

        <WsCard>
          <WsCardContent className="flex items-center gap-3 py-4">
            <Heart className="h-8 w-8 text-ws-blue" />
            <div>
              <p className="text-2xl font-bold text-ws-text">{wishlistCount}</p>
              <p className="text-xs text-ws-text-muted">{t("wishlist")}</p>
            </div>
          </WsCardContent>
        </WsCard>
      </div>

      {/* Recent Orders */}
      <WsCard>
        <WsCardHeader className="flex flex-row items-center justify-between">
          <WsCardTitle>{t("recentOrders")}</WsCardTitle>
          <Link href="/account/orders" as={"/account/orders" as any}>
            <WsButton variant="ghost" size="sm">
              {t("orders")}
              <ArrowRight className="h-4 w-4 ml-1" />
            </WsButton>
          </Link>
        </WsCardHeader>
        <WsCardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-ws-text-muted">{t("noOrders")}</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Link
                  key={order.orderId}
                  href={`/account/orders/${order.orderId}` as any}
                  className="flex items-center justify-between p-3 rounded-md border border-ws-border hover:border-ws-blue/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium text-ws-text">
                        {to("orderNumber")}
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-ws-text-muted">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <WsBadge
                      variant={
                        (statusColorMap[order.status] ?? "muted") as any
                      }
                    >
                      {to(order.status)}
                    </WsBadge>
                    <span className="text-sm font-medium text-ws-text tabular-nums">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </WsCardContent>
      </WsCard>
    </div>
  );
}
