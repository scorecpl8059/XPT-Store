"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  MessageSquare,
  RotateCcw,
  Truck,
  FileText,
  Settings,
  BarChart3,
  Warehouse,
  FileQuestion,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/admin/returns", label: "Returns", icon: RotateCcw },
  { href: "/admin/shipping", label: "Shipping", icon: Truck },
  { href: "/admin/rfq", label: "RFQ", icon: FileQuestion },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-ws-dark">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-ws-border bg-white">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-4 py-4 border-b border-ws-border">
            <Link href="/admin" className="block">
              <span className="text-lg font-bold text-ws-brand">XPT-TECH</span>
              <span className="ml-2 text-[10px] font-medium uppercase tracking-wider text-ws-text-muted bg-ws-surface px-1.5 py-0.5 rounded">
                Admin
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
            {adminNav.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors",
                    isActive
                      ? "bg-ws-blue/10 text-ws-blue font-medium"
                      : "text-ws-text-secondary hover:text-ws-text hover:bg-ws-surface"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* User info */}
          <div className="px-3 py-3 border-t border-ws-border">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ws-text truncate">
                  {user?.name || "Admin"}
                </p>
                <p className="text-xs text-ws-text-muted truncate">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-ws-text-muted hover:text-ws-red transition-colors rounded"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
