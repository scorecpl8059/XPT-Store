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
import { WsBadge } from "@/components/ui/cyber-badge";
import { api } from "@/lib/api";
import { Plus, Pencil, Trash2, X, Save } from "lucide-react";

interface ShippingRate {
  minWeight: number;
  maxWeight: number;
  price: number;
}

interface ShippingZone {
  zoneId: string;
  name: string;
  states: string[];
  rates: ShippingRate[];
  createdAt: string;
  updatedAt: string;
}

interface ZoneForm {
  name: string;
  states: string;
  rates: ShippingRate[];
}

const emptyForm: ZoneForm = { name: "", states: "", rates: [{ minWeight: 0, maxWeight: 5, price: 5.99 }] };

export default function AdminShippingPage() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ZoneForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchZones = async () => {
    try {
      const res = await api.get<{ zones: ShippingZone[] }>("/shipping/zones");
      setZones(res.zones ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const handleEdit = (zone: ShippingZone) => {
    setEditingId(zone.zoneId);
    setForm({
      name: zone.name,
      states: zone.states.join(", "),
      rates: [...zone.rates],
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        states: form.states.split(",").map((s) => s.trim()).filter(Boolean),
        rates: form.rates,
      };
      if (editingId) {
        await api.put(`/shipping/zones/${editingId}`, payload);
      } else {
        await api.post("/shipping/zones", payload);
      }
      setShowForm(false);
      setEditingId(null);
      await fetchZones();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (zoneId: string) => {
    try {
      await api.delete(`/shipping/zones/${zoneId}`);
      setConfirmDeleteId(null);
      await fetchZones();
    } catch {
      // handle error
    }
  };

  const addRate = () => {
    const lastRate = form.rates[form.rates.length - 1];
    setForm((prev) => ({
      ...prev,
      rates: [
        ...prev.rates,
        {
          minWeight: lastRate ? lastRate.maxWeight : 0,
          maxWeight: lastRate ? lastRate.maxWeight + 10 : 10,
          price: lastRate ? lastRate.price + 5 : 5.99,
        },
      ],
    }));
  };

  const updateRate = (index: number, field: keyof ShippingRate, value: number) => {
    setForm((prev) => ({
      ...prev,
      rates: prev.rates.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    }));
  };

  const removeRate = (index: number) => {
    setForm((prev) => ({
      ...prev,
      rates: prev.rates.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-ws-text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ws-text">Shipping Zones</h1>
          <p className="text-sm text-ws-text-muted">
            Manage shipping zones and rate tiers
          </p>
        </div>
        {!showForm && (
          <WsButton variant="primary" onClick={handleNew}>
            <Plus className="h-4 w-4 mr-1" />
            Add Zone
          </WsButton>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <WsCard>
          <WsCardHeader>
            <WsCardTitle>{editingId ? "Edit Zone" : "New Zone"}</WsCardTitle>
          </WsCardHeader>
          <WsCardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <WsLabel>Zone Name</WsLabel>
                <WsInput
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Northeast"
                />
              </div>
              <div>
                <WsLabel>States (comma-separated)</WsLabel>
                <WsInput
                  value={form.states}
                  onChange={(e) => setForm((p) => ({ ...p, states: e.target.value }))}
                  placeholder="e.g., NY, NJ, CT, MA"
                />
              </div>
            </div>

            {/* Rate tiers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <WsLabel>Rate Tiers</WsLabel>
                <WsButton variant="ghost" size="sm" onClick={addRate}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Tier
                </WsButton>
              </div>
              <div className="space-y-2">
                {form.rates.map((rate, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <WsInput
                        type="number"
                        value={rate.minWeight}
                        onChange={(e) => updateRate(i, "minWeight", parseFloat(e.target.value) || 0)}
                        className="w-20"
                      />
                      <span className="text-xs text-ws-text-muted">to</span>
                      <WsInput
                        type="number"
                        value={rate.maxWeight}
                        onChange={(e) => updateRate(i, "maxWeight", parseFloat(e.target.value) || 0)}
                        className="w-20"
                      />
                      <span className="text-xs text-ws-text-muted">lbs</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-ws-text-muted">$</span>
                      <WsInput
                        type="number"
                        step="0.01"
                        value={rate.price}
                        onChange={(e) => updateRate(i, "price", parseFloat(e.target.value) || 0)}
                        className="w-24"
                      />
                    </div>
                    {form.rates.length > 1 && (
                      <button
                        onClick={() => removeRate(i)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <WsButton
                variant="primary"
                onClick={handleSave}
                disabled={saving || !form.name || !form.states}
              >
                <Save className="h-4 w-4 mr-1" />
                {saving ? "Saving..." : "Save"}
              </WsButton>
              <WsButton
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                Cancel
              </WsButton>
            </div>
          </WsCardContent>
        </WsCard>
      )}

      {/* Zone List */}
      {zones.length === 0 && !showForm ? (
        <WsCard>
          <WsCardContent className="text-center py-12">
            <p className="text-sm text-ws-text-muted">No shipping zones configured</p>
          </WsCardContent>
        </WsCard>
      ) : (
        <div className="space-y-4">
          {zones.map((zone) => (
            <WsCard key={zone.zoneId}>
              <WsCardContent className="py-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-ws-text">
                      {zone.name}
                    </h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {zone.states.map((state) => (
                        <WsBadge key={state} variant="muted">
                          {state}
                        </WsBadge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <WsButton
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleEdit(zone)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </WsButton>
                    {confirmDeleteId === zone.zoneId ? (
                      <WsButton
                        variant="ghost"
                        size="sm"
                        className="text-red-400 text-xs"
                        onClick={() => handleDelete(zone.zoneId)}
                      >
                        Confirm
                      </WsButton>
                    ) : (
                      <WsButton
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400"
                        onClick={() => setConfirmDeleteId(zone.zoneId)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </WsButton>
                    )}
                  </div>
                </div>

                {/* Rate table */}
                <div className="border border-ws-border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-ws-surface">
                      <tr>
                        <th className="text-left px-3 py-1.5 text-xs font-medium text-ws-text-muted">
                          Weight Range
                        </th>
                        <th className="text-right px-3 py-1.5 text-xs font-medium text-ws-text-muted">
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {zone.rates.map((rate, i) => (
                        <tr key={i} className="border-t border-ws-border">
                          <td className="px-3 py-1.5 text-ws-text">
                            {rate.minWeight} – {rate.maxWeight} lbs
                          </td>
                          <td className="px-3 py-1.5 text-right text-ws-text tabular-nums">
                            ${rate.price.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </WsCardContent>
            </WsCard>
          ))}
        </div>
      )}
    </div>
  );
}
