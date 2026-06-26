"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/hooks/use-auth";
import { WsButton } from "@/components/ui/cyber-button";
import { WsInput, WsLabel } from "@/components/ui/cyber-input";
import {
  WsCard,
  WsCardContent,
  WsCardFooter,
} from "@/components/ui/cyber-card";

export default function LoginPage() {
  const locale = useLocale();
  const router = useRouter();
  const { login } = useAuth();
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      window.location.href = `/${locale}/`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-ws-dark">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-2xl font-bold text-ws-brand">XPT-TECH</span>
          </Link>
          <p className="mt-2 text-sm text-ws-text-secondary">
            {t("signIn")}
          </p>
        </div>

        <WsCard>
          <form onSubmit={handleSubmit}>
            <WsCardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-ws-red bg-ws-red/10 border border-ws-red/20 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <WsLabel htmlFor="email">{t("email")}</WsLabel>
                <WsInput
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <WsLabel htmlFor="password">{t("password")}</WsLabel>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-ws-blue hover:text-ws-blue-hover transition-colors"
                  >
                    {t("forgotPassword")}
                  </Link>
                </div>
                <WsInput
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <WsButton
                type="submit"
                variant="primary"
                className="w-full"
                disabled={loading}
              >
                {loading ? t("signingIn") : t("signIn")}
              </WsButton>
            </WsCardContent>
          </form>

          <WsCardFooter className="justify-center">
            <p className="text-sm text-ws-text-secondary">
              {t("noAccount")}{" "}
              <Link
                href="/auth/register"
                className="text-ws-blue hover:text-ws-blue-hover font-medium transition-colors"
              >
                {t("createOne")}
              </Link>
            </p>
          </WsCardFooter>
        </WsCard>
      </div>
    </div>
  );
}
