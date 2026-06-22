"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");

  const footerLinks = {
    shop: [
      { href: "/products" as const, label: t("allProducts") },
      { href: "/categories" as const, label: t("shop") },
    ],
    support: [
      { href: "/faq" as const, label: "FAQ" },
      { href: "/contact" as const, label: t("contactUs") },
      { href: "/rfq" as const, label: t("requestQuote") },
    ],
    legal: [
      { href: "/pages/terms" as const, label: t("terms") },
      { href: "/pages/privacy" as const, label: t("privacy") },
      { href: "/pages/return-policy" as const, label: t("returnPolicy") },
    ],
  };

  return (
    <footer className="mt-auto border-t border-ws-border bg-ws-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-block mb-3">
              <span className="text-lg font-bold tracking-tight text-ws-brand">
                XPT-TECH
              </span>
            </Link>
            <p className="text-sm text-ws-text-secondary leading-relaxed">
              {t("description")}
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ws-text-muted mb-3">
              {t("shop")}
            </h4>
            <ul className="space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ws-text-secondary hover:text-ws-text transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ws-text-muted mb-3">
              {t("support")}
            </h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ws-text-secondary hover:text-ws-text transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ws-text-muted mb-3">
              {t("legal")}
            </h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ws-text-secondary hover:text-ws-text transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-ws-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-ws-text-muted">
            &copy; {new Date().getFullYear()} XPT-TECH. {t("rights")}
          </p>
          <p className="text-xs text-ws-text-muted font-mono">
            store.xpt-tech.com
          </p>
        </div>
      </div>
    </footer>
  );
}
