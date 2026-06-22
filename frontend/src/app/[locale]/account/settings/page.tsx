"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  WsCard,
  WsCardContent,
  WsCardHeader,
  WsCardTitle,
} from "@/components/ui/cyber-card";
import { WsButton } from "@/components/ui/cyber-button";
import { WsInput, WsLabel } from "@/components/ui/cyber-input";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { Check } from "lucide-react";

interface ProfileForm {
  name: string;
  phone: string;
  companyName: string;
  taxId: string;
  preferredLanguage: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const t = useTranslations("account");
  const ta = useTranslations("auth");
  const tc = useTranslations("common");

  const [form, setForm] = useState<ProfileForm>({
    name: "",
    phone: "",
    companyName: "",
    taxId: "",
    preferredLanguage: "en",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? "",
        phone: "",
        companyName: user.companyName ?? "",
        taxId: "",
        preferredLanguage: user.preferredLanguage ?? "en",
      });

      // Also fetch full profile for phone/taxId
      api
        .get<{
          phone?: string;
          taxId?: string;
        }>("/users/me/profile")
        .then((res) => {
          setForm((prev) => ({
            ...prev,
            phone: res.phone ?? "",
            taxId: res.taxId ?? "",
          }));
        })
        .catch(() => {});
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.put("/users/me/profile", {
        name: form.name,
        phone: form.phone || undefined,
        companyName: form.companyName || undefined,
        taxId: form.taxId || undefined,
        preferredLanguage: form.preferredLanguage,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return;
    setChangingPassword(true);
    try {
      await api.put("/users/me/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch {
      // handle error
    } finally {
      setChangingPassword(false);
    }
  };

  const updateField = (field: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isBusiness = user?.accountType === "business";

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-ws-text">{t("settings")}</h2>

      {/* Profile Form */}
      <WsCard>
        <WsCardHeader>
          <WsCardTitle>{t("settings")}</WsCardTitle>
        </WsCardHeader>
        <WsCardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <WsLabel>{ta("fullName")}</WsLabel>
              <WsInput
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
            </div>
            <div>
              <WsLabel>{ta("phone")}</WsLabel>
              <WsInput
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </div>

            {isBusiness && (
              <>
                <div>
                  <WsLabel>{ta("companyName")}</WsLabel>
                  <WsInput
                    value={form.companyName}
                    onChange={(e) =>
                      updateField("companyName", e.target.value)
                    }
                  />
                </div>
                <div>
                  <WsLabel>{ta("taxId")}</WsLabel>
                  <WsInput
                    value={form.taxId}
                    onChange={(e) => updateField("taxId", e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <WsLabel>{t("language")}</WsLabel>
              <select
                value={form.preferredLanguage}
                onChange={(e) =>
                  updateField("preferredLanguage", e.target.value)
                }
                className="flex h-9 w-full rounded-md border border-ws-border bg-ws-dark px-3 py-1 text-sm text-ws-text shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ws-blue"
              >
                <option value="en">English</option>
                <option value="zh-CN">中文</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <WsButton
              variant="primary"
              onClick={handleSaveProfile}
              disabled={saving || !form.name}
            >
              {saving ? tc("loading") : tc("save")}
            </WsButton>
            {saved && (
              <span className="flex items-center gap-1 text-sm text-ws-green">
                <Check className="h-4 w-4" />
                {t("profileUpdated")}
              </span>
            )}
          </div>
        </WsCardContent>
      </WsCard>

      {/* Password Change */}
      <WsCard>
        <WsCardHeader>
          <WsCardTitle>{t("changePassword")}</WsCardTitle>
        </WsCardHeader>
        <WsCardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <WsLabel>{t("currentPassword")}</WsLabel>
              <WsInput
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
              />
            </div>
            <div />
            <div>
              <WsLabel>{t("newPassword")}</WsLabel>
              <WsInput
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <WsLabel>{ta("confirmPassword")}</WsLabel>
              <WsInput
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <WsButton
            variant="primary"
            onClick={handleChangePassword}
            disabled={
              changingPassword ||
              !passwordForm.currentPassword ||
              !passwordForm.newPassword ||
              passwordForm.newPassword !== passwordForm.confirmPassword
            }
          >
            {changingPassword ? tc("loading") : t("changePassword")}
          </WsButton>
        </WsCardContent>
      </WsCard>
    </div>
  );
}
