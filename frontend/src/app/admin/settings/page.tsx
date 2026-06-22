"use client";

import { useState, useEffect } from "react";
import {
  WsCard,
  WsCardContent,
  WsCardHeader,
  WsCardTitle,
} from "@/components/ui/cyber-card";
import { WsButton } from "@/components/ui/cyber-button";
import { WsInput, WsLabel } from "@/components/ui/cyber-input";
import { api } from "@/lib/api";
import { Save, Check } from "lucide-react";

interface Settings {
  storeName: string;
  contactEmail: string;
  contactPhone: string;
  lowStockThreshold: number;
  returnWindowDays: number;
  defaultCarrier: string;
}

const defaults: Settings = {
  storeName: "XPT-TECH",
  contactEmail: "support@xpt-tech.com",
  contactPhone: "+1 (555) 123-4567",
  lowStockThreshold: 10,
  returnWindowDays: 7,
  defaultCarrier: "USPS",
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await api.get<{ settings: Record<string, unknown> }>("/settings");
        if (res.settings) {
          setSettings({
            storeName: (res.settings.storeName as string) ?? defaults.storeName,
            contactEmail: (res.settings.contactEmail as string) ?? defaults.contactEmail,
            contactPhone: (res.settings.contactPhone as string) ?? defaults.contactPhone,
            lowStockThreshold: (res.settings.lowStockThreshold as number) ?? defaults.lowStockThreshold,
            returnWindowDays: (res.settings.returnWindowDays as number) ?? defaults.returnWindowDays,
            defaultCarrier: (res.settings.defaultCarrier as string) ?? defaults.defaultCarrier,
          });
        }
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.put("/settings", settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof Settings, value: string | number) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className="p-6"><p className="text-sm text-ws-text-muted">Loading...</p></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-ws-text">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Info */}
        <WsCard>
          <WsCardHeader>
            <WsCardTitle>Store Information</WsCardTitle>
          </WsCardHeader>
          <WsCardContent className="space-y-4">
            <div>
              <WsLabel>Store Name</WsLabel>
              <WsInput
                value={settings.storeName}
                onChange={(e) => updateField("storeName", e.target.value)}
              />
            </div>
            <div>
              <WsLabel>Contact Email</WsLabel>
              <WsInput
                type="email"
                value={settings.contactEmail}
                onChange={(e) => updateField("contactEmail", e.target.value)}
              />
            </div>
            <div>
              <WsLabel>Contact Phone</WsLabel>
              <WsInput
                value={settings.contactPhone}
                onChange={(e) => updateField("contactPhone", e.target.value)}
              />
            </div>
          </WsCardContent>
        </WsCard>

        {/* Business Rules */}
        <WsCard>
          <WsCardHeader>
            <WsCardTitle>Business Rules</WsCardTitle>
          </WsCardHeader>
          <WsCardContent className="space-y-4">
            <div>
              <WsLabel>Low Stock Threshold</WsLabel>
              <WsInput
                type="number"
                value={settings.lowStockThreshold}
                onChange={(e) => updateField("lowStockThreshold", parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-ws-text-muted mt-1">
                Products below this quantity will be flagged as low stock
              </p>
            </div>
            <div>
              <WsLabel>Return Window (days)</WsLabel>
              <WsInput
                type="number"
                value={settings.returnWindowDays}
                onChange={(e) => updateField("returnWindowDays", parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-ws-text-muted mt-1">
                Days after delivery that customers can request returns
              </p>
            </div>
            <div>
              <WsLabel>Default Carrier</WsLabel>
              <WsInput
                value={settings.defaultCarrier}
                onChange={(e) => updateField("defaultCarrier", e.target.value)}
              />
            </div>
          </WsCardContent>
        </WsCard>
      </div>

      <div className="flex items-center gap-3">
        <WsButton variant="primary" onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-1" />
          {saving ? "Saving..." : "Save Settings"}
        </WsButton>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <Check className="h-4 w-4" /> Settings saved
          </span>
        )}
      </div>
    </div>
  );
}
