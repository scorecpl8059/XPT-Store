"use client";

import { useTranslations } from "next-intl";
import type { VariantType, Variant } from "@/types/product";
import { cn } from "@/lib/utils";

interface VariantSelectorProps {
  variantTypes: VariantType[];
  variants: Variant[];
  selected: Record<string, string>;
  onSelect: (attribute: string, value: string) => void;
}

export function VariantSelector({
  variantTypes,
  variants,
  selected,
  onSelect,
}: VariantSelectorProps) {
  const t = useTranslations("product");

  // Check if a specific value is available (has at least one active variant with stock)
  const isValueAvailable = (attrName: string, attrValue: string): boolean => {
    return variants.some(
      (v) =>
        v.attributes[attrName] === attrValue &&
        v.status === "active" &&
        v.stock - v.reservedStock > 0
    );
  };

  return (
    <div className="space-y-4">
      {variantTypes.map((vt) => (
        <div key={vt.name}>
          <label className="text-xs font-medium text-ws-text-secondary uppercase tracking-wider">
            {t("selectVariant", { name: vt.name })}
          </label>
          <div className="flex flex-wrap gap-2 mt-2">
            {vt.values.map((value) => {
              const available = isValueAvailable(vt.name, value);
              const isSelected = selected[vt.name] === value;
              return (
                <button
                  key={value}
                  onClick={() => onSelect(vt.name, value)}
                  disabled={!available}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md border transition-colors",
                    isSelected
                      ? "border-ws-blue bg-ws-blue/10 text-ws-blue font-medium"
                      : available
                        ? "border-ws-border text-ws-text hover:border-ws-border-light"
                        : "border-ws-border/50 text-ws-text-muted/50 cursor-not-allowed line-through"
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
