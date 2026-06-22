"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Warehouse,
  RotateCcw,
  Truck,
  Star,
  FileText,
  MessageSquareQuote,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { href: "/admin/returns", label: "Returns", icon: RotateCcw },
  { href: "/admin/shipping", label: "Shipping", icon: Truck },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/rfq", label: "Quotes", icon: MessageSquareQuote },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-56 bg-ws-dark border-r border-ws-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-ws-border">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="text-sm font-bold text-ws-brand">XPT-TECH</span>
          <span className="text-xs text-ws-text-muted font-mono">Admin</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {adminLinks.map((link) => {
          const isActive =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors duration-150",
                isActive
                  ? "text-ws-blue bg-ws-blue/10 font-medium"
                  : "text-ws-text-secondary hover:text-ws-text hover:bg-ws-surface"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-ws-border">
        <Link
          href="/"
          className="text-xs text-ws-text-muted hover:text-ws-text transition-colors"
        >
          &larr; Back to Store
        </Link>
      </div>
    </aside>
  );
}
