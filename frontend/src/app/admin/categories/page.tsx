"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { Category, CreateCategoryInput } from "@/types/category";
import { WsButton } from "@/components/ui/cyber-button";
import { WsCard, WsCardContent } from "@/components/ui/cyber-card";
import { WsBadge } from "@/components/ui/cyber-badge";
import {
  FolderTree,
  Plus,
  ChevronRight,
  ChevronDown,
  Pencil,
  Trash2,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryFormModal } from "@/components/admin/CategoryFormModal";

interface CategoryNode extends Category {
  children: CategoryNode[];
}

function buildTree(categories: Category[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>();
  const roots: CategoryNode[] = [];

  for (const cat of categories) {
    map.set(cat.categoryId, { ...cat, children: [] });
  }

  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort each level by sortOrder
  const sortChildren = (nodes: CategoryNode[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder);
    nodes.forEach((n) => sortChildren(n.children));
  };
  sortChildren(roots);

  return roots;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [parentId, setParentId] = useState<string | undefined>();
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await api.get<{ categories: Category[] }>("/categories");
      setCategories(data.categories);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const tree = buildTree(categories);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAdd(pId?: string) {
    setEditingCategory(null);
    setParentId(pId);
    setModalOpen(true);
  }

  function handleEdit(cat: Category) {
    setEditingCategory(cat);
    setParentId(cat.parentId);
    setModalOpen(true);
  }

  async function handleDelete(cat: Category) {
    if (!confirm(`Delete "${cat.name}"? This cannot be undone.`)) return;
    setDeleting(cat.categoryId);
    try {
      await api.delete(`/categories/${cat.categoryId}`);
      await fetchCategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  async function handleSave(input: CreateCategoryInput) {
    if (editingCategory) {
      await api.put(`/categories/${editingCategory.categoryId}`, input);
    } else {
      await api.post("/categories", { ...input, parentId });
    }
    await fetchCategories();
    setModalOpen(false);
  }

  function renderNode(node: CategoryNode, depth: number) {
    const isExpanded = expanded.has(node.categoryId);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.categoryId}>
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 hover:bg-ws-surface rounded-md group transition-colors",
            depth > 0 && "ml-6"
          )}
        >
          <GripVertical className="h-3.5 w-3.5 text-ws-text-muted opacity-0 group-hover:opacity-100 cursor-grab" />

          {hasChildren ? (
            <button
              onClick={() => toggleExpand(node.categoryId)}
              className="p-0.5 text-ws-text-muted hover:text-ws-text transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="w-5" />
          )}

          <FolderTree className="h-4 w-4 text-ws-blue shrink-0" />

          <span className="flex-1 text-sm font-medium text-ws-text truncate">
            {node.name}
          </span>

          <WsBadge
            variant={node.status === "active" ? "green" : "muted"}
            className="text-[10px]"
          >
            {node.status}
          </WsBadge>

          <span className="text-xs text-ws-text-muted tabular-nums">
            {node.productCount} products
          </span>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleAdd(node.categoryId)}
              className="p-1.5 text-ws-text-muted hover:text-ws-blue transition-colors rounded"
              title="Add subcategory"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleEdit(node)}
              className="p-1.5 text-ws-text-muted hover:text-ws-blue transition-colors rounded"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleDelete(node)}
              disabled={deleting === node.categoryId}
              className="p-1.5 text-ws-text-muted hover:text-ws-red transition-colors rounded disabled:opacity-50"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {isExpanded &&
          hasChildren &&
          node.children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-ws-text">Categories</h1>
          <p className="text-sm text-ws-text-secondary mt-0.5">
            Organize your product catalog
          </p>
        </div>
        <WsButton variant="primary" onClick={() => handleAdd()}>
          <Plus className="h-4 w-4" />
          Add Category
        </WsButton>
      </div>

      <WsCard>
        <WsCardContent>
          {loading ? (
            <div className="py-12 text-center text-sm text-ws-text-muted">
              Loading categories...
            </div>
          ) : tree.length === 0 ? (
            <div className="py-12 text-center">
              <FolderTree className="h-8 w-8 text-ws-text-muted mx-auto mb-3" />
              <p className="text-sm text-ws-text-secondary">
                No categories yet
              </p>
              <p className="text-xs text-ws-text-muted mt-1">
                Create your first category to organize products
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {tree.map((node) => renderNode(node, 0))}
            </div>
          )}
        </WsCardContent>
      </WsCard>

      {modalOpen && (
        <CategoryFormModal
          category={editingCategory}
          parentId={parentId}
          categories={categories}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
