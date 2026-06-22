"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import {
  LayoutDashboard,
  Package,
  MapPin,
  Heart,
  Star,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/account", icon: LayoutDashboard, labelKey: "dashboard" as const },
  { href: "/account/orders", icon: Package, labelKey: "orders" as const },
  { href: "/account/addresses", icon: MapPin, labelKey: "addresses" as const },
  { href: "/account/wishlist", icon: Heart, labelKey: "wishlist" as const },
  { href: "/account/reviews", icon: Star, labelKey: "reviews" as const },
  { href: "/account/settings", icon: Settings, labelKey: "settings" as const },
];

export function AccountNav() {
  const t = useTranslations("account");
  const pathname = usePathname();

  // Strip locale prefix to compare routes
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?(\/|$)/, "/");

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive =
          item.href === "/account"
            ? pathWithoutLocale === "/account"
            : pathWithoutLocale.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href as any}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-ws-blue/10 text-ws-blue border border-ws-blue/20"
                : "text-ws-text-muted hover:text-ws-text hover:bg-ws-surface"
            )}
          >
            <item.icon className="h-4 w-4" />
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
