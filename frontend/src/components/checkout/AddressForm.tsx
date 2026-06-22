"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { WsInput, WsLabel } from "@/components/ui/cyber-input";
import { WsButton } from "@/components/ui/cyber-button";
import { WsCard, WsCardContent } from "@/components/ui/cyber-card";
import { api } from "@/lib/api";

interface Address {
  addressId: string;
  label?: string;
  recipientName: string;
  phone: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

interface AddressFormData {
  recipientName: string;
  phone: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface AddressFormProps {
  onSelect: (address: Address | AddressFormData) => void;
  selectedAddressId?: string;
}

const EMPTY_FORM: AddressFormData = {
  recipientName: "",
  phone: "",
  street1: "",
  street2: "",
  city: "",
  state: "",
  zipCode: "",
  country: "US",
};

export function AddressForm({ onSelect, selectedAddressId }: AddressFormProps) {
  const t = useTranslations("checkout");
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [useNew, setUseNew] = useState(false);
  const [form, setForm] = useState<AddressFormData>(EMPTY_FORM);

  useEffect(() => {
    api
      .get<Address[]>("/users/me/addresses")
      .then((addresses) => {
        setSavedAddresses(addresses || []);
        if (!addresses || addresses.length === 0) {
          setUseNew(true);
        } else {
          // Auto-select default
          const def = addresses.find((a) => a.isDefault) || addresses[0];
          onSelect(def);
        }
      })
      .catch(() => setUseNew(true));
  }, []);

  const handleFieldChange = (field: keyof AddressFormData, value: string) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
  };

  const handleNewAddressSubmit = () => {
    if (form.recipientName && form.street1 && form.city && form.state && form.zipCode) {
      onSelect(form);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-ws-text">
        {t("shippingAddress")}
      </h2>

      {/* Saved addresses */}
      {savedAddresses.length > 0 && !useNew && (
        <div className="space-y-2">
          {savedAddresses.map((addr) => (
            <WsCard
              key={addr.addressId}
              hoverable
              className={`cursor-pointer ${
                selectedAddressId === addr.addressId
                  ? "border-ws-blue"
                  : ""
              }`}
              onClick={() => {
                onSelect(addr);
              }}
            >
              <WsCardContent>
                <p className="text-sm font-medium text-ws-text">
                  {addr.recipientName}
                  {addr.label && (
                    <span className="text-ws-text-muted ml-2">
                      ({addr.label})
                    </span>
                  )}
                </p>
                <p className="text-xs text-ws-text-secondary mt-0.5">
                  {addr.street1}
                  {addr.street2 && `, ${addr.street2}`}, {addr.city},{" "}
                  {addr.state} {addr.zipCode}
                </p>
                <p className="text-xs text-ws-text-muted">{addr.phone}</p>
              </WsCardContent>
            </WsCard>
          ))}
          <button
            type="button"
            onClick={() => setUseNew(true)}
            className="text-xs text-ws-blue hover:text-ws-blue-hover transition-colors"
          >
            + {t("newAddress")}
          </button>
        </div>
      )}

      {/* New address form */}
      {useNew && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <WsLabel>{t("recipientName")}</WsLabel>
            <WsInput
              value={form.recipientName}
              onChange={(e) => handleFieldChange("recipientName", e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <WsLabel>{t("phone")}</WsLabel>
            <WsInput
              type="tel"
              value={form.phone}
              onChange={(e) => handleFieldChange("phone", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <WsLabel>{t("street1")}</WsLabel>
            <WsInput
              value={form.street1}
              onChange={(e) => handleFieldChange("street1", e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <WsLabel>{t("street2")}</WsLabel>
            <WsInput
              value={form.street2}
              onChange={(e) => handleFieldChange("street2", e.target.value)}
            />
          </div>
          <div>
            <WsLabel>{t("city")}</WsLabel>
            <WsInput
              value={form.city}
              onChange={(e) => handleFieldChange("city", e.target.value)}
              required
            />
          </div>
          <div>
            <WsLabel>{t("state")}</WsLabel>
            <WsInput
              value={form.state}
              onChange={(e) => handleFieldChange("state", e.target.value)}
              required
            />
          </div>
          <div>
            <WsLabel>{t("zipCode")}</WsLabel>
            <WsInput
              value={form.zipCode}
              onChange={(e) => handleFieldChange("zipCode", e.target.value)}
              required
            />
          </div>
          <div>
            <WsLabel>{t("country")}</WsLabel>
            <WsInput
              value={form.country}
              onChange={(e) => handleFieldChange("country", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 flex gap-2">
            {savedAddresses.length > 0 && (
              <WsButton
                variant="secondary"
                size="sm"
                onClick={() => setUseNew(false)}
              >
                {t("selectAddress")}
              </WsButton>
            )}
            <WsButton
              variant="primary"
              size="sm"
              onClick={handleNewAddressSubmit}
            >
              {t("shippingAddress")}
            </WsButton>
          </div>
        </div>
      )}
    </div>
  );
}

export type { Address, AddressFormData };
