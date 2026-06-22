"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import type { Variant, VariantType, CreateVariantInput } from "@/types/product";
import { WsButton } from "@/components/ui/cyber-button";
import { WsInput, WsLabel } from "@/components/ui/cyber-input";
import { WsBadge } from "@/components/ui/cyber-badge";
import { Plus, X, Trash2, Save } from "lucide-react";

interface VariantManagerProps {
  productId?: string;
  variantTypes: VariantType[];
  existingVariants: Variant[];
  onVariantTypesChange: (types: VariantType[]) => void;
}

export function VariantManager({
  productId,
  variantTypes,
  existingVariants,
  onVariantTypesChange,
}: VariantManagerProps) {
  const [variants, setVariants] = useState<Variant[]>(existingVariants);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeValues, setNewTypeValues] = useState("");
  const [editingVariant, setEditingVariant] = useState<string | null>(null);
  const [variantForm, setVariantForm] = useState<CreateVariantInput>({
    sku: "",
    attributes: {},
    price: 0,
    stock: 0,
    weight: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addVariantType() {
    if (!newTypeName.trim()) return;
    const values = newTypeValues
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (values.length === 0) return;

    onVariantTypesChange([
      ...variantTypes,
      { name: newTypeName.trim(), values },
    ]);
    setNewTypeName("");
    setNewTypeValues("");
  }

  function removeVariantType(index: number) {
    onVariantTypesChange(variantTypes.filter((_, i) => i !== index));
  }

  function startNewVariant() {
    const attrs: Record<string, string> = {};
    variantTypes.forEach((vt) => {
      attrs[vt.name] = vt.values[0] || "";
    });
    setVariantForm({
      sku: "",
      attributes: attrs,
      price: 0,
      stock: 0,
      weight: 0,
    });
    setEditingVariant("new");
  }

  function startEditVariant(variant: Variant) {
    setVariantForm({
      sku: variant.sku,
      attributes: { ...variant.attributes },
      price: variant.price,
      stock: variant.stock,
      weight: variant.weight,
      image: variant.image,
    });
    setEditingVariant(variant.variantId);
  }

  async function saveVariant() {
    if (!productId) {
      setError("Save the product first before adding variants");
      return;
    }
    if (!variantForm.sku) {
      setError("SKU is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingVariant === "new") {
        const { variant } = await api.post<{ variant: Variant }>(
          `/products/${productId}/variants`,
          variantForm
        );
        setVariants((prev) => [...prev, variant]);
      } else {
        const { variant } = await api.put<{ variant: Variant }>(
          `/products/${productId}/variants/${editingVariant}`,
          variantForm
        );
        setVariants((prev) =>
          prev.map((v) =>
            v.variantId === editingVariant ? variant : v
          )
        );
      }
      setEditingVariant(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteVariant(variantId: string) {
    if (!productId) return;
    if (!confirm("Delete this variant?")) return;

    try {
      await api.delete(`/products/${productId}/variants/${variantId}`);
      setVariants((prev) => prev.filter((v) => v.variantId !== variantId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="p-3 text-sm text-ws-red bg-ws-red/10 border border-ws-red/20 rounded-md">
          {error}
        </div>
      )}

      {/* Variant Types */}
      <div>
        <p className="text-sm font-medium text-ws-text mb-3">
          Variant Types
        </p>

        {variantTypes.length > 0 && (
          <div className="space-y-2 mb-3">
            {variantTypes.map((vt, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2 bg-ws-surface rounded-md"
              >
                <span className="text-sm font-medium text-ws-text min-w-[80px]">
                  {vt.name}
                </span>
                <div className="flex flex-wrap gap-1 flex-1">
                  {vt.values.map((val) => (
                    <WsBadge key={val} variant="blue" className="text-[10px]">
                      {val}
                    </WsBadge>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => removeVariantType(i)}
                  className="p-1 text-ws-text-muted hover:text-ws-red transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="space-y-1.5">
            <WsLabel>Type Name</WsLabel>
            <WsInput
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="e.g. Color"
              className="w-32"
            />
          </div>
          <div className="space-y-1.5 flex-1">
            <WsLabel>Values (comma-separated)</WsLabel>
            <WsInput
              value={newTypeValues}
              onChange={(e) => setNewTypeValues(e.target.value)}
              placeholder="e.g. Red, Blue, Green"
            />
          </div>
          <WsButton
            type="button"
            variant="secondary"
            size="md"
            onClick={addVariantType}
          >
            <Plus className="h-4 w-4" />
            Add
          </WsButton>
        </div>
      </div>

      {/* Variant List */}
      {variants.length > 0 && (
        <div>
          <p className="text-sm font-medium text-ws-text mb-3">
            Variants ({variants.length})
          </p>
          <div className="border border-ws-border rounded-md overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ws-border bg-ws-surface">
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-ws-text-muted">
                    SKU
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-ws-text-muted">
                    Attributes
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium uppercase text-ws-text-muted">
                    Price
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium uppercase text-ws-text-muted">
                    Stock
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium uppercase text-ws-text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr
                    key={v.variantId}
                    className="border-b border-ws-border last:border-0"
                  >
                    <td className="px-3 py-2 text-sm font-mono text-ws-text">
                      {v.sku}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(v.attributes).map(([k, val]) => (
                          <WsBadge
                            key={k}
                            variant="muted"
                            className="text-[10px]"
                          >
                            {k}: {val}
                          </WsBadge>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm text-ws-text text-right font-mono">
                      ${v.price.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-sm text-ws-text text-right tabular-nums">
                      {v.stock}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <WsButton
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditVariant(v)}
                        >
                          Edit
                        </WsButton>
                        <button
                          type="button"
                          onClick={() => deleteVariant(v.variantId)}
                          className="p-1.5 text-ws-text-muted hover:text-ws-red transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Variant Form */}
      {editingVariant ? (
        <div className="p-4 border border-ws-blue/30 bg-ws-blue/5 rounded-md space-y-4">
          <p className="text-sm font-medium text-ws-text">
            {editingVariant === "new" ? "New Variant" : "Edit Variant"}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <WsLabel>SKU *</WsLabel>
              <WsInput
                value={variantForm.sku}
                onChange={(e) =>
                  setVariantForm((p) => ({ ...p, sku: e.target.value }))
                }
                placeholder="XPT-ESP32-RED"
              />
            </div>
            <div className="space-y-1.5">
              <WsLabel>Price ($)</WsLabel>
              <WsInput
                type="number"
                step="0.01"
                min="0.01"
                value={variantForm.price || ""}
                onChange={(e) =>
                  setVariantForm((p) => ({
                    ...p,
                    price: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <WsLabel>Stock</WsLabel>
              <WsInput
                type="number"
                min="0"
                value={variantForm.stock || ""}
                onChange={(e) =>
                  setVariantForm((p) => ({
                    ...p,
                    stock: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>

          {/* Attribute selectors */}
          {variantTypes.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {variantTypes.map((vt) => (
                <div key={vt.name} className="space-y-1.5">
                  <WsLabel>{vt.name}</WsLabel>
                  <select
                    value={variantForm.attributes[vt.name] || ""}
                    onChange={(e) =>
                      setVariantForm((p) => ({
                        ...p,
                        attributes: {
                          ...p.attributes,
                          [vt.name]: e.target.value,
                        },
                      }))
                    }
                    className="w-full h-9 px-3 text-sm rounded-md bg-ws-elevated border border-ws-border text-ws-text focus:outline-none focus:border-ws-blue"
                  >
                    {vt.values.map((val) => (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <WsButton
              type="button"
              variant="primary"
              size="sm"
              onClick={saveVariant}
              disabled={saving}
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving..." : "Save Variant"}
            </WsButton>
            <WsButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditingVariant(null)}
            >
              Cancel
            </WsButton>
          </div>
        </div>
      ) : (
        <WsButton
          type="button"
          variant="secondary"
          size="sm"
          onClick={startNewVariant}
        >
          <Plus className="h-4 w-4" />
          Add Variant
        </WsButton>
      )}
    </div>
  );
}
