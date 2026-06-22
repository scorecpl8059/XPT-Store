"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { WsButton } from "@/components/ui/cyber-button";
import { WsInput, WsLabel } from "@/components/ui/cyber-input";
import {
  WsCard,
  WsCardContent,
  WsCardFooter,
} from "@/components/ui/cyber-card";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", { email });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
            {t("resetPassword")}
          </p>
        </div>

        <WsCard>
          {submitted ? (
            <WsCardContent className="text-center py-6">
              <div className="text-ws-green text-3xl mb-3">&#10003;</div>
              <p className="text-sm text-ws-text font-medium mb-1">
                {t("checkEmail")}
              </p>
              <p className="text-sm text-ws-text-secondary">
                {t("resetSent", { email })}
              </p>
              <Link
                href="/auth/login"
                className="inline-block mt-4 text-sm text-ws-blue hover:text-ws-blue-hover font-medium transition-colors"
              >
                {t("backToLogin")}
              </Link>
            </WsCardContent>
          ) : (
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

                <WsButton
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "..." : t("sendResetLink")}
                </WsButton>
              </WsCardContent>
            </form>
          )}

          <WsCardFooter className="justify-center">
            <Link
              href="/auth/login"
              className="text-sm text-ws-text-secondary hover:text-ws-text transition-colors"
            >
              &larr; {t("backToLogin")}
            </Link>
          </WsCardFooter>
        </WsCard>
      </div>
    </div>
  );
}
