"use client";

import React, { useState } from "react";
import type { Category, CreateCategoryInput } from "@/types/category";
import { WsButton } from "@/components/ui/cyber-button";
import { WsInput, WsLabel } from "@/components/ui/cyber-input";
import { X } from "lucide-react";

interface CategoryFormModalProps {
  category: Category | null;
  parentId?: string;
  categories: Category[];
  onSave: (input: CreateCategoryInput) => Promise<void>;
  onClose: () => void;
}

export function CategoryFormModal({
  category,
  parentId,
  categories,
  onSave,
  onClose,
}: CategoryFormModalProps) {
  const isEditing = !!category;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<CreateCategoryInput>({
    name: category?.name || "",
    slug: category?.slug || "",
    description: category?.description || "",
    parentId: category?.parentId || parentId,
    image: category?.image || "",
    sortOrder: category?.sortOrder ?? 0,
    status: category?.status || "active",
  });

  function updateField<K extends keyof CreateCategoryInput>(
    key: K,
    value: CreateCategoryInput[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSave({
        ...form,
        slug: form.slug || undefined,
        description: form.description || undefined,
        image: form.image || undefined,
        parentId: form.parentId || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  }

  // Build parent options — exclude self and descendants
  const getDescendantIds = (id: string): Set<string> => {
    const ids = new Set<string>();
    const queue = categories.filter((c) => c.parentId === id);
    while (queue.length > 0) {
      const c = queue.pop()!;
      ids.add(c.categoryId);
      queue.push(...categories.filter((x) => x.parentId === c.categoryId));
    }
    return ids;
  };

  const excludeIds = category
    ? new Set([category.categoryId, ...getDescendantIds(category.categoryId)])
    : new Set<string>();

  const parentOptions = categories.filter(
    (c) => !excludeIds.has(c.categoryId)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white border border-ws-border rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ws-border">
          <h2 className="text-base font-semibold text-ws-text">
            {isEditing ? "Edit Category" : "New Category"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-ws-text-muted hover:text-ws-text transition-colors rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4 space-y-4">
            {error && (
              <div className="p-3 text-sm text-ws-red bg-ws-red/10 border border-ws-red/20 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <WsLabel htmlFor="cat-name">Name *</WsLabel>
              <WsInput
                id="cat-name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g. Microcontrollers"
                required
              />
            </div>

            <div className="space-y-1.5">
              <WsLabel htmlFor="cat-slug">
                Slug{" "}
                <span className="text-ws-text-muted font-normal">
                  (auto-generated if empty)
                </span>
              </WsLabel>
              <WsInput
                id="cat-slug"
                value={form.slug || ""}
                onChange={(e) => updateField("slug", e.target.value)}
                placeholder="microcontrollers"
              />
            </div>

            <div className="space-y-1.5">
              <WsLabel htmlFor="cat-desc">Description</WsLabel>
              <textarea
                id="cat-desc"
                value={form.description || ""}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Brief description of this category"
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-md bg-ws-surface border border-ws-border text-ws-text placeholder:text-ws-text-muted focus:outline-none focus:border-ws-blue focus:ring-1 focus:ring-ws-blue/30 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <WsLabel htmlFor="cat-parent">Parent Category</WsLabel>
              <select
                id="cat-parent"
                value={form.parentId || ""}
                onChange={(e) =>
                  updateField("parentId", e.target.value || undefined)
                }
                className="w-full h-9 px-3 text-sm rounded-md bg-ws-surface border border-ws-border text-ws-text focus:outline-none focus:border-ws-blue focus:ring-1 focus:ring-ws-blue/30"
              >
                <option value="">None (top-level)</option>
                {parentOptions.map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <WsLabel htmlFor="cat-order">Sort Order</WsLabel>
                <WsInput
                  id="cat-order"
                  type="number"
                  value={form.sortOrder ?? 0}
                  onChange={(e) =>
                    updateField("sortOrder", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <WsLabel htmlFor="cat-status">Status</WsLabel>
                <select
                  id="cat-status"
                  value={form.status || "active"}
                  onChange={(e) =>
                    updateField(
                      "status",
                      e.target.value as "active" | "inactive"
                    )
                  }
                  className="w-full h-9 px-3 text-sm rounded-md bg-ws-surface border border-ws-border text-ws-text focus:outline-none focus:border-ws-blue focus:ring-1 focus:ring-ws-blue/30"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <WsLabel htmlFor="cat-image">Image URL</WsLabel>
              <WsInput
                id="cat-image"
                value={form.image || ""}
                onChange={(e) => updateField("image", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-ws-border">
            <WsButton type="button" variant="secondary" onClick={onClose}>
              Cancel
            </WsButton>
            <WsButton type="submit" variant="primary" disabled={saving}>
              {saving
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Create Category"}
            </WsButton>
          </div>
        </form>
      </div>
    </div>
  );
}
