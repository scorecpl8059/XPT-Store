"use client";

import { useState, useEffect } from "react";
import {
  WsCard,
  WsCardContent,
} from "@/components/ui/cyber-card";
import { WsBadge } from "@/components/ui/cyber-badge";
import { WsButton } from "@/components/ui/cyber-button";
import { WsInput } from "@/components/ui/cyber-input";
import { api } from "@/lib/api";
import { Warehouse, AlertTriangle } from "lucide-react";

interface InventoryItem {
  productId: string;
  name: string;
  sku: string;
  stock: number;
  lowStock: boolean;
  variants: { variantId: string; sku: string; stock: number; lowStock: boolean }[];
}

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [adjustments, setAdjustments] = useState<Record<string, string>>({});

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (showLowOnly) params.lowStock = "true";
      const res = await api.get<{ inventory: InventoryItem[] }>("/inventory", params);
      setItems(res.inventory ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [showLowOnly]);

  const handleAdjust = async (productId: string, variantId?: string) => {
    const key = variantId ? `${productId}-${variantId}` : productId;
    const adj = parseInt(adjustments[key] || "0");
    if (adj === 0) return;

    try {
      await api.put("/inventory/stock", {
        productId,
        variantId,
        adjustment: adj,
        reason: "Manual adjustment",
      });
      setAdjustments((prev) => ({ ...prev, [key]: "" }));
      await fetchInventory();
    } catch {
      // handle error
    }
  };

  const lowStockCount = items.filter(
    (i) => i.lowStock || i.variants.some((v) => v.lowStock)
  ).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ws-text">Inventory</h1>
          <p className="text-sm text-ws-text-muted">
            {items.length} products · {lowStockCount} low stock
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-ws-text">
            <input
              type="checkbox"
              checked={showLowOnly}
              onChange={(e) => setShowLowOnly(e.target.checked)}
              className="rounded border-ws-border"
            />
            Low stock only
          </label>
        </div>
      </div>

      {lowStockCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            {lowStockCount} product{lowStockCount !== 1 ? "s" : ""} with low stock (below 10 units)
          </p>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-ws-text-muted">Loading...</p>
      ) : items.length === 0 ? (
        <WsCard>
          <WsCardContent className="flex flex-col items-center py-12">
            <Warehouse className="h-12 w-12 text-ws-text-muted/30 mb-3" />
            <p className="text-sm text-ws-text-muted">No products found</p>
          </WsCardContent>
        </WsCard>
      ) : (
        <div className="border border-ws-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ws-surface">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-ws-text-muted">Product</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-ws-text-muted">SKU</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-ws-text-muted">Stock</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-ws-text-muted">Adjust</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <>
                  <tr key={item.productId} className="border-t border-ws-border hover:bg-ws-surface/50">
                    <td className="px-4 py-3 font-medium text-ws-text">{item.name}</td>
                    <td className="px-4 py-3 text-ws-text-muted">{item.sku}</td>
                    <td className="px-4 py-3 text-right">
                      {item.lowStock ? (
                        <WsBadge variant="amber">{item.stock}</WsBadge>
                      ) : (
                        <span className="text-ws-text tabular-nums">{item.stock}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <WsInput
                          type="number"
                          value={adjustments[item.productId] || ""}
                          onChange={(e) =>
                            setAdjustments((p) => ({ ...p, [item.productId]: e.target.value }))
                          }
                          className="w-20 text-right"
                          placeholder="+/-"
                        />
                        <WsButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAdjust(item.productId)}
                          disabled={!adjustments[item.productId]}
                        >
                          Apply
                        </WsButton>
                      </div>
                    </td>
                  </tr>
                  {item.variants.map((v) => (
                    <tr
                      key={v.variantId}
                      className="border-t border-ws-border/50 bg-ws-surface/20"
                    >
                      <td className="px-4 py-2 pl-8 text-ws-text-muted text-xs">↳ Variant</td>
                      <td className="px-4 py-2 text-ws-text-muted text-xs">{v.sku}</td>
                      <td className="px-4 py-2 text-right">
                        {v.lowStock ? (
                          <WsBadge variant="amber">{v.stock}</WsBadge>
                        ) : (
                          <span className="text-ws-text-muted text-xs tabular-nums">{v.stock}</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <WsInput
                            type="number"
                            value={adjustments[`${item.productId}-${v.variantId}`] || ""}
                            onChange={(e) =>
                              setAdjustments((p) => ({
                                ...p,
                                [`${item.productId}-${v.variantId}`]: e.target.value,
                              }))
                            }
                            className="w-20 text-right text-xs"
                            placeholder="+/-"
                          />
                          <WsButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAdjust(item.productId, v.variantId)}
                            disabled={!adjustments[`${item.productId}-${v.variantId}`]}
                          >
                            Apply
                          </WsButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
