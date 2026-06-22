"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { X, Heart, User, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  links: { href: string; label: string }[];
}

export function MobileMenu({ open, onClose, links }: MobileMenuProps) {
  const t = useTranslations("nav");

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-72 bg-ws-dark border-l border-ws-border transition-transform duration-200 md:hidden",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full p-5">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-semibold text-ws-text">Menu</span>
            <button
              onClick={onClose}
              className="p-1.5 text-ws-text-secondary hover:text-ws-text transition-colors rounded-md"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex flex-col gap-0.5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href as "/products" | "/categories" | "/faq" | "/contact"}
                onClick={onClose}
                className="px-3 py-2.5 text-sm text-ws-text-secondary hover:text-ws-text hover:bg-ws-surface rounded-md transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="my-4 h-px bg-ws-border" />

          <nav className="flex flex-col gap-0.5">
            <Link
              href="/account/wishlist"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-ws-text-secondary hover:text-ws-text hover:bg-ws-surface rounded-md transition-colors"
            >
              <Heart className="h-4 w-4" />
              {t("wishlist")}
            </Link>
            <Link
              href="/cart"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-ws-text-secondary hover:text-ws-text hover:bg-ws-surface rounded-md transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              {t("cart")}
            </Link>
            <Link
              href="/auth/login"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-ws-text-secondary hover:text-ws-text hover:bg-ws-surface rounded-md transition-colors"
            >
              <User className="h-4 w-4" />
              {t("account")}
            </Link>
          </nav>

          <div className="mt-auto pt-4 border-t border-ws-border">
            <p className="text-xs text-ws-text-muted">
              &copy; {new Date().getFullYear()} XPT-TECH
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
