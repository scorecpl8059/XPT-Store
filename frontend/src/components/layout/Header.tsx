"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ShoppingCart, User, Search, Menu, Heart, LogOut, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { SearchBar } from "@/components/search/SearchBar";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileMenu } from "./MobileMenu";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const t = useTranslations("nav");

  const navLinks = [
    { href: "/products" as const, label: t("products") },
    { href: "/categories" as const, label: t("categories") },
    { href: "/faq" as const, label: t("faq") },
    { href: "/contact" as const, label: t("contact") },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-ws-border bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <span className="text-lg font-bold tracking-tight text-ws-brand">
                XPT-TECH
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 text-sm text-ws-text-secondary hover:text-ws-text transition-colors rounded-md hover:bg-ws-surface"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Search Bar */}
            <div className="hidden sm:flex flex-1 max-w-sm mx-4">
              <SearchBar className="w-full" />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-0.5">
              <button
                className="sm:hidden p-2 text-ws-text-secondary hover:text-ws-text transition-colors rounded-md"
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              >
                {mobileSearchOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
              </button>

              <Link
                href="/account/wishlist"
                className="hidden sm:flex p-2 text-ws-text-secondary hover:text-ws-text transition-colors rounded-md"
              >
                <Heart className="h-5 w-5" />
              </Link>

              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 text-ws-text-secondary hover:text-ws-text transition-colors rounded-md"
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center bg-ws-blue text-[10px] font-bold text-white rounded-full">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </button>

              {user ? (
                <div className="hidden sm:flex items-center gap-1">
                  <Link
                    href="/account"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-ws-text-secondary hover:text-ws-text transition-colors rounded-md hover:bg-ws-surface"
                  >
                    <User className="h-4 w-4" />
                    <span className="max-w-[100px] truncate">{user.name}</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="p-2 text-ws-text-secondary hover:text-ws-red transition-colors rounded-md"
                    title={t("signOut")}
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="hidden sm:flex p-2 text-ws-text-secondary hover:text-ws-text transition-colors rounded-md"
                >
                  <User className="h-5 w-5" />
                </Link>
              )}

              <LanguageSwitcher />

              <button
                className="md:hidden p-2 text-ws-text-secondary hover:text-ws-text transition-colors rounded-md"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile search bar */}
      {mobileSearchOpen && (
        <div className="sm:hidden border-b border-ws-border bg-white px-4 py-2">
          <SearchBar
            autoFocus
            onClose={() => setMobileSearchOpen(false)}
          />
        </div>
      )}

      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        links={navLinks}
      />

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </>
  );
}
