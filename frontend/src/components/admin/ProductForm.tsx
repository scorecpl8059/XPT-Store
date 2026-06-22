"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type {
  Product,
  Variant,
  CreateProductInput,
  VariantType,
} from "@/types/product";
import type { Category } from "@/types/category";
import { WsButton } from "@/components/ui/cyber-button";
import {
  WsCard,
  WsCardHeader,
  WsCardTitle,
  WsCardContent,
} from "@/components/ui/cyber-card";
import { WsInput, WsLabel } from "@/components/ui/cyber-input";
import { ImageUpload, ImagePreviewGrid } from "@/components/shared/ImageUpload";
import { VariantManager } from "@/components/admin/VariantManager";
import { ArrowLeft, Save, Trash2 } from "lucide-react";

interface ProductFormProps {
  product?: Product;
  variants?: Variant[];
}

export function ProductForm({ product, variants }: ProductFormProps) {
  const router = useRouter();
  const isEditing = !!product;

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  const [form, setForm] = useState<CreateProductInput>({
    name: product?.name || "",
    slug: product?.slug || "",
    description: product?.description || "",
    categoryId: product?.categoryId || "",
    basePrice: product?.basePrice || 0,
    weight: product?.weight || 0,
    dimensions: product?.dimensions,
    images: product?.images || [],
    status: product?.status || "draft",
    hasVariants: product?.hasVariants || false,
    variantTypes: product?.variantTypes || [],
    relatedProductIds: product?.relatedProductIds || [],
    seoTitle: product?.seoTitle || "",
    seoDescription: product?.seoDescription || "",
  });

  const [imageList, setImageList] = useState<
    Array<{ key: string; url: string }>
  >(
    (product?.images || []).map((url) => ({
      key: url,
      url,
    }))
  );

  const fetchCategories = useCallback(async () => {
    try {
      const data = await api.get<{ categories: Category[] }>("/categories");
      setCategories(data.categories);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  function updateField<K extends keyof CreateProductInput>(
    key: K,
    value: CreateProductInput[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleImageUpload(key: string, url: string) {
    setImageList((prev) => [...prev, { key, url }]);
    setForm((prev) => ({
      ...prev,
      images: [...(prev.images || []), url],
    }));
  }

  function handleImageRemove(key: string) {
    setImageList((prev) => prev.filter((img) => img.key !== key));
    setForm((prev) => ({
      ...prev,
      images: (prev.images || []).filter(
        (url) => url !== imageList.find((img) => img.key === key)?.url
      ),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Product name is required");
      return;
    }
    if (!form.categoryId) {
      setError("Category is required");
      return;
    }
    if (!form.description.trim()) {
      setError("Description is required");
      return;
    }
    if (form.basePrice <= 0) {
      setError("Price must be greater than 0");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        slug: form.slug || undefined,
        seoTitle: form.seoTitle || undefined,
        seoDescription: form.seoDescription || undefined,
        dimensions: form.dimensions || undefined,
        variantTypes:
          form.hasVariants && form.variantTypes?.length
            ? form.variantTypes
            : undefined,
      };

      if (isEditing) {
        await api.put(`/products/${product.productId}`, payload);
      } else {
        await api.post("/products", payload);
      }
      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!product) return;
    if (!confirm("Delete this product? This cannot be undone.")) return;

    setDeleting(true);
    try {
      await api.delete(`/products/${product.productId}`);
      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 text-sm text-ws-red bg-ws-red/10 border border-ws-red/20 rounded-md">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <WsCard>
        <WsCardHeader>
          <WsCardTitle>Basic Information</WsCardTitle>
        </WsCardHeader>
        <WsCardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <WsLabel htmlFor="name">Product Name *</WsLabel>
              <WsInput
                id="name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g. ESP32-S3 DevKitC-1"
                required
              />
            </div>
            <div className="space-y-1.5">
              <WsLabel htmlFor="slug">
                Slug{" "}
                <span className="text-ws-text-muted font-normal">
                  (auto-generated if empty)
                </span>
              </WsLabel>
              <WsInput
                id="slug"
                value={form.slug || ""}
                onChange={(e) => updateField("slug", e.target.value)}
                placeholder="esp32-s3-devkitc-1"
              />
            </div>
            <div className="space-y-1.5">
              <WsLabel htmlFor="category">Category *</WsLabel>
              <select
                id="category"
                value={form.categoryId}
                onChange={(e) => updateField("categoryId", e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-md bg-ws-elevated border border-ws-border text-ws-text focus:outline-none focus:border-ws-blue focus:ring-1 focus:ring-ws-blue/30"
                required
              >
                <option value="">Select category</option>
                {categories
                  .filter((c) => c.status === "active")
                  .map((c) => (
                    <option key={c.categoryId} value={c.categoryId}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <WsLabel htmlFor="description">Description *</WsLabel>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Product description (supports HTML)"
              rows={6}
              className="w-full px-3 py-2 text-sm rounded-md bg-ws-elevated border border-ws-border text-ws-text placeholder:text-ws-text-muted focus:outline-none focus:border-ws-blue focus:ring-1 focus:ring-ws-blue/30 resize-y"
              required
            />
          </div>
        </WsCardContent>
      </WsCard>

      {/* Pricing & Shipping */}
      <WsCard>
        <WsCardHeader>
          <WsCardTitle>Pricing &amp; Shipping</WsCardTitle>
        </WsCardHeader>
        <WsCardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <WsLabel htmlFor="basePrice">Base Price ($) *</WsLabel>
              <WsInput
                id="basePrice"
                type="number"
                step="0.01"
                min="0.01"
                value={form.basePrice || ""}
                onChange={(e) =>
                  updateField("basePrice", parseFloat(e.target.value) || 0)
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <WsLabel htmlFor="weight">Weight (lbs) *</WsLabel>
              <WsInput
                id="weight"
                type="number"
                step="0.01"
                min="0"
                value={form.weight || ""}
                onChange={(e) =>
                  updateField("weight", parseFloat(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-1.5">
              <WsLabel htmlFor="status">Status</WsLabel>
              <select
                id="status"
                value={form.status}
                onChange={(e) =>
                  updateField(
                    "status",
                    e.target.value as "active" | "draft" | "archived"
                  )
                }
                className="w-full h-9 px-3 text-sm rounded-md bg-ws-elevated border border-ws-border text-ws-text focus:outline-none focus:border-ws-blue focus:ring-1 focus:ring-ws-blue/30"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </WsCardContent>
      </WsCard>

      {/* Images */}
      <WsCard>
        <WsCardHeader>
          <WsCardTitle>Images</WsCardTitle>
        </WsCardHeader>
        <WsCardContent>
          <ImageUpload
            folder="products"
            entityId={product?.productId || "new"}
            onUpload={handleImageUpload}
            maxFiles={10}
          />
          <ImagePreviewGrid images={imageList} onRemove={handleImageRemove} />
        </WsCardContent>
      </WsCard>

      {/* Variants */}
      <WsCard>
        <WsCardHeader>
          <div className="flex items-center justify-between">
            <WsCardTitle>Variants</WsCardTitle>
            <label className="flex items-center gap-2 text-sm text-ws-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={form.hasVariants}
                onChange={(e) =>
                  updateField("hasVariants", e.target.checked)
                }
                className="rounded border-ws-border text-ws-blue focus:ring-ws-blue/30"
              />
              Enable variants
            </label>
          </div>
        </WsCardHeader>
        {form.hasVariants && (
          <WsCardContent>
            <VariantManager
              productId={product?.productId}
              variantTypes={form.variantTypes || []}
              existingVariants={variants || []}
              onVariantTypesChange={(types) =>
                updateField("variantTypes", types)
              }
            />
          </WsCardContent>
        )}
      </WsCard>

      {/* SEO */}
      <WsCard>
        <WsCardHeader>
          <WsCardTitle>SEO</WsCardTitle>
        </WsCardHeader>
        <WsCardContent className="space-y-4">
          <div className="space-y-1.5">
            <WsLabel htmlFor="seoTitle">
              Meta Title{" "}
              <span className="text-ws-text-muted font-normal">
                (max 70 chars)
              </span>
            </WsLabel>
            <WsInput
              id="seoTitle"
              value={form.seoTitle || ""}
              onChange={(e) => updateField("seoTitle", e.target.value)}
              maxLength={70}
            />
          </div>
          <div className="space-y-1.5">
            <WsLabel htmlFor="seoDescription">
              Meta Description{" "}
              <span className="text-ws-text-muted font-normal">
                (max 160 chars)
              </span>
            </WsLabel>
            <textarea
              id="seoDescription"
              value={form.seoDescription || ""}
              onChange={(e) => updateField("seoDescription", e.target.value)}
              maxLength={160}
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-md bg-ws-elevated border border-ws-border text-ws-text placeholder:text-ws-text-muted focus:outline-none focus:border-ws-blue focus:ring-1 focus:ring-ws-blue/30 resize-none"
            />
          </div>
        </WsCardContent>
      </WsCard>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <a href="/admin/products">
          <WsButton type="button" variant="ghost">
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </WsButton>
        </a>
        <div className="flex items-center gap-2">
          {isEditing && (
            <WsButton
              type="button"
              variant="destructive-outline"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Deleting..." : "Delete"}
            </WsButton>
          )}
          <WsButton type="submit" variant="primary" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Create Product"}
          </WsButton>
        </div>
      </div>
    </form>
  );
}
