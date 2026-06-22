"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/hooks/use-auth";
import { WsButton } from "@/components/ui/cyber-button";
import { WsInput, WsLabel } from "@/components/ui/cyber-input";
import {
  WsCard,
  WsCardContent,
  WsCardFooter,
} from "@/components/ui/cyber-card";
import { cn } from "@/lib/utils";

type AccountTab = "individual" | "business";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const t = useTranslations("auth");
  const [tab, setTab] = useState<AccountTab>("individual");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    taxId: "",
    phone: "",
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        accountType: tab,
        companyName: tab === "business" ? form.companyName : undefined,
        taxId: tab === "business" ? form.taxId : undefined,
        phone: form.phone || undefined,
      });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-ws-dark">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-2xl font-bold text-ws-brand">XPT-TECH</span>
          </Link>
          <p className="mt-2 text-sm text-ws-text-secondary">
            {t("signUp")}
          </p>
        </div>

        <WsCard>
          {/* Account Type Tabs */}
          <div className="flex border-b border-ws-border">
            {(["individual", "business"] as const).map((tabVal) => (
              <button
                key={tabVal}
                type="button"
                onClick={() => setTab(tabVal)}
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                  tab === tabVal
                    ? "text-ws-blue border-b-2 border-ws-blue"
                    : "text-ws-text-muted hover:text-ws-text-secondary"
                )}
              >
                {t(tabVal)}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <WsCardContent className="space-y-4 pt-5">
              {error && (
                <div className="p-3 text-sm text-ws-red bg-ws-red/10 border border-ws-red/20 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <WsLabel htmlFor="name">{t("fullName")}</WsLabel>
                <WsInput
                  id="name"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <WsLabel htmlFor="email">{t("email")}</WsLabel>
                <WsInput
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  required
                />
              </div>

              {tab === "business" && (
                <>
                  <div className="space-y-1.5">
                    <WsLabel htmlFor="companyName">{t("companyName")}</WsLabel>
                    <WsInput
                      id="companyName"
                      placeholder="Acme Electronics Inc."
                      value={form.companyName}
                      onChange={(e) =>
                        updateField("companyName", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <WsLabel htmlFor="taxId">{t("taxId")}</WsLabel>
                    <WsInput
                      id="taxId"
                      placeholder="XX-XXXXXXX"
                      value={form.taxId}
                      onChange={(e) => updateField("taxId", e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <WsLabel htmlFor="phone">{t("phone")}</WsLabel>
                <WsInput
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <WsLabel htmlFor="password">{t("password")}</WsLabel>
                <WsInput
                  id="password"
                  type="password"
                  placeholder={t("passwordRequirements")}
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <WsLabel htmlFor="confirmPassword">
                  {t("confirmPassword")}
                </WsLabel>
                <WsInput
                  id="confirmPassword"
                  type="password"
                  placeholder={t("confirmPassword")}
                  value={form.confirmPassword}
                  onChange={(e) =>
                    updateField("confirmPassword", e.target.value)
                  }
                  required
                />
              </div>

              <WsButton
                type="submit"
                variant="primary"
                className="w-full"
                disabled={loading}
              >
                {loading ? t("creatingAccount") : t("signUp")}
              </WsButton>
            </WsCardContent>
          </form>

          <WsCardFooter className="justify-center">
            <p className="text-sm text-ws-text-secondary">
              {t("hasAccount")}{" "}
              <Link
                href="/auth/login"
                className="text-ws-blue hover:text-ws-blue-hover font-medium transition-colors"
              >
                {t("signIn")}
              </Link>
            </p>
          </WsCardFooter>
        </WsCard>
      </div>
    </div>
  );
}
