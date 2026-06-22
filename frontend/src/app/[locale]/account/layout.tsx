"use client";

import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AccountNav } from "@/components/account/AccountNav";
import { WsButton } from "@/components/ui/cyber-button";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "@/i18n/navigation";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const t = useTranslations("account");
  const tc = useTranslations("common");

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-sm text-ws-text-muted">{tc("loading")}</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-ws-text-muted mb-3">
              Please sign in to access your account.
            </p>
            <Link href="/auth/login">
              <WsButton variant="primary">Sign In</WsButton>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-ws-text mb-6">{t("title")}</h1>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar - hidden on mobile */}
            <aside className="hidden md:block w-56 shrink-0">
              <AccountNav />
            </aside>

            {/* Mobile nav */}
            <div className="md:hidden overflow-x-auto">
              <AccountNav />
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
