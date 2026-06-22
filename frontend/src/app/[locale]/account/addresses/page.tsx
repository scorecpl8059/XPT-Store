"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  WsCard,
  WsCardContent,
  WsCardHeader,
  WsCardTitle,
} from "@/components/ui/cyber-card";
import { WsBadge } from "@/components/ui/cyber-badge";
import { WsButton } from "@/components/ui/cyber-button";
import { WsInput, WsLabel } from "@/components/ui/cyber-input";
import { api } from "@/lib/api";
import type { Address, CreateAddressInput } from "@/types/user";
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react";

const emptyForm: CreateAddressInput = {
  label: "",
  recipientName: "",
  phone: "",
  street1: "",
  street2: "",
  city: "",
  state: "",
  zipCode: "",
  country: "US",
  isDefault: false,
};

export default function AddressesPage() {
  const t = useTranslations("account");
  const tc = useTranslations("common");
  const tch = useTranslations("checkout");

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateAddressInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchAddresses = async () => {
    try {
      const res = await api.get<{ addresses: Address[] }>(
        "/users/me/addresses"
      );
      setAddresses(res.addresses ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleOpenNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const handleEdit = (addr: Address) => {
    setEditingId(addr.addressId);
    setForm({
      label: addr.label ?? "",
      recipientName: addr.recipientName,
      phone: addr.phone,
      street1: addr.street1,
      street2: addr.street2 ?? "",
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
      country: addr.country,
      isDefault: addr.isDefault,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/users/me/addresses/${editingId}`, form);
      } else {
        await api.post("/users/me/addresses", form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await fetchAddresses();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    try {
      await api.delete(`/users/me/addresses/${addressId}`);
      setConfirmDeleteId(null);
      await fetchAddresses();
    } catch {
      // handle error
    }
  };

  const updateField = (field: keyof CreateAddressInput, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <p className="text-sm text-ws-text-muted">{tc("loading")}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-ws-text">
          {t("savedAddresses")}
        </h2>
        {!showForm && (
          <WsButton variant="primary" size="sm" onClick={handleOpenNew}>
            <Plus className="h-4 w-4 mr-1" />
            {t("addAddress")}
          </WsButton>
        )}
      </div>

      {/* Address Form */}
      {showForm && (
        <WsCard>
          <WsCardHeader>
            <WsCardTitle>
              {editingId ? t("editAddress") : t("addAddress")}
            </WsCardTitle>
          </WsCardHeader>
          <WsCardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <WsLabel>{tch("recipientName")}</WsLabel>
                <WsInput
                  value={form.recipientName}
                  onChange={(e) => updateField("recipientName", e.target.value)}
                />
              </div>
              <div>
                <WsLabel>{tch("phone")}</WsLabel>
                <WsInput
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <WsLabel>{tch("street1")}</WsLabel>
                <WsInput
                  value={form.street1}
                  onChange={(e) => updateField("street1", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <WsLabel>{tch("street2")}</WsLabel>
                <WsInput
                  value={form.street2 ?? ""}
                  onChange={(e) => updateField("street2", e.target.value)}
                />
              </div>
              <div>
                <WsLabel>{tch("city")}</WsLabel>
                <WsInput
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                />
              </div>
              <div>
                <WsLabel>{tch("state")}</WsLabel>
                <WsInput
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                />
              </div>
              <div>
                <WsLabel>{tch("zipCode")}</WsLabel>
                <WsInput
                  value={form.zipCode}
                  onChange={(e) => updateField("zipCode", e.target.value)}
                />
              </div>
              <div>
                <WsLabel>{tch("country")}</WsLabel>
                <WsInput
                  value={form.country ?? "US"}
                  onChange={(e) => updateField("country", e.target.value)}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-ws-text">
              <input
                type="checkbox"
                checked={form.isDefault ?? false}
                onChange={(e) => updateField("isDefault", e.target.checked)}
                className="rounded border-ws-border"
              />
              {t("defaultAddress")}
            </label>

            <div className="flex gap-2">
              <WsButton
                variant="primary"
                onClick={handleSave}
                disabled={saving || !form.recipientName || !form.street1 || !form.city}
              >
                {saving ? tc("loading") : tc("save")}
              </WsButton>
              <WsButton
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                {tc("cancel")}
              </WsButton>
            </div>
          </WsCardContent>
        </WsCard>
      )}

      {/* Address List */}
      {addresses.length === 0 && !showForm ? (
        <WsCard>
          <WsCardContent className="flex flex-col items-center py-12">
            <MapPin className="h-12 w-12 text-ws-text-muted/30 mb-3" />
            <p className="text-sm text-ws-text-muted">{t("noAddresses")}</p>
          </WsCardContent>
        </WsCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <WsCard
              key={addr.addressId}
              className={
                addr.isDefault ? "border-ws-blue/40" : undefined
              }
            >
              <WsCardContent className="py-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {addr.label && (
                      <span className="text-xs font-medium text-ws-text-muted">
                        {addr.label}
                      </span>
                    )}
                    {addr.isDefault && (
                      <WsBadge variant="blue">{t("defaultAddress")}</WsBadge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <WsButton
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleEdit(addr)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </WsButton>
                    {confirmDeleteId === addr.addressId ? (
                      <WsButton
                        variant="ghost"
                        size="sm"
                        className="text-red-400 text-xs"
                        onClick={() => handleDelete(addr.addressId)}
                      >
                        {t("confirmDelete")}
                      </WsButton>
                    ) : (
                      <WsButton
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400"
                        onClick={() => setConfirmDeleteId(addr.addressId)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </WsButton>
                    )}
                  </div>
                </div>
                <div className="text-sm text-ws-text space-y-0.5">
                  <p className="font-medium">{addr.recipientName}</p>
                  <p>{addr.street1}</p>
                  {addr.street2 && <p>{addr.street2}</p>}
                  <p>
                    {addr.city}, {addr.state} {addr.zipCode}
                  </p>
                  <p>{addr.country}</p>
                  {addr.phone && (
                    <p className="text-ws-text-muted">{addr.phone}</p>
                  )}
                </div>
              </WsCardContent>
            </WsCard>
          ))}
        </div>
      )}
    </div>
  );
}
