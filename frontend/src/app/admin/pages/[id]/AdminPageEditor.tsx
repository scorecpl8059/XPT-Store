"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  WsCard,
  WsCardContent,
  WsCardHeader,
  WsCardTitle,
} from "@/components/ui/cyber-card";
import { WsButton } from "@/components/ui/cyber-button";
import { WsInput, WsLabel } from "@/components/ui/cyber-input";
import { api } from "@/lib/api";
import { ArrowLeft, Save, Check } from "lucide-react";

interface PageData {
  pageId: string;
  title: string;
  slug: string;
  content: string;
  type: "legal" | "faq" | "custom";
  sortOrder: number;
  status: "published" | "draft";
  seoTitle?: string;
  seoDescription?: string;
}

interface PageForm {
  title: string;
  slug: string;
  content: string;
  type: "legal" | "faq" | "custom";
  sortOrder: number;
  status: "published" | "draft";
  seoTitle: string;
  seoDescription: string;
}

export default function AdminPageEditor() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";

  const [form, setForm] = useState<PageForm>({
    title: "",
    slug: "",
    content: "",
    type: "custom",
    sortOrder: 0,
    status: "draft",
    seoTitle: "",
    seoDescription: "",
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isNew) return;
    async function fetchPage() {
      try {
        // For editing, we fetch by pageId
        const res = await api.get<{ page: PageData }>(`/pages/${id}`);
        const p = res.page;
        setForm({
          title: p.title,
          slug: p.slug,
          content: p.content,
          type: p.type,
          sortOrder: p.sortOrder,
          status: p.status,
          seoTitle: p.seoTitle ?? "",
          seoDescription: p.seoDescription ?? "",
        });
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    fetchPage();
  }, [id, isNew]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      if (isNew) {
        await api.post("/pages", form);
      } else {
        await api.put(`/pages/${id}`, form);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      if (isNew) {
        window.location.href = "/admin/pages";
      }
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof PageForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className="p-6"><p className="text-sm text-ws-text-muted">Loading...</p></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/admin/pages">
            <WsButton variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </WsButton>
          </a>
          <h1 className="text-xl font-bold text-ws-text">
            {isNew ? "New Page" : "Edit Page"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <Check className="h-4 w-4" /> Saved
            </span>
          )}
          <WsButton variant="primary" onClick={handleSave} disabled={saving || !form.title}>
            <Save className="h-4 w-4 mr-1" />
            {saving ? "Saving..." : "Save"}
          </WsButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <WsCard>
            <WsCardHeader>
              <WsCardTitle>Content</WsCardTitle>
            </WsCardHeader>
            <WsCardContent className="space-y-4">
              <div>
                <WsLabel>Title</WsLabel>
                <WsInput
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                />
              </div>
              <div>
                <WsLabel>Slug</WsLabel>
                <WsInput
                  value={form.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  placeholder="auto-generated if empty"
                />
              </div>
              <div>
                <WsLabel>Content (HTML)</WsLabel>
                <textarea
                  value={form.content}
                  onChange={(e) => updateField("content", e.target.value)}
                  rows={15}
                  className="flex w-full rounded-md border border-ws-border bg-white px-3 py-2 text-sm text-ws-text shadow-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ws-blue"
                />
              </div>
            </WsCardContent>
          </WsCard>
        </div>

        <div className="space-y-6">
          <WsCard>
            <WsCardHeader>
              <WsCardTitle>Settings</WsCardTitle>
            </WsCardHeader>
            <WsCardContent className="space-y-4">
              <div>
                <WsLabel>Type</WsLabel>
                <select
                  value={form.type}
                  onChange={(e) => updateField("type", e.target.value)}
                  className="flex h-9 w-full rounded-md border border-ws-border bg-white px-3 py-1 text-sm text-ws-text shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ws-blue"
                >
                  <option value="legal">Legal</option>
                  <option value="faq">FAQ</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <WsLabel>Status</WsLabel>
                <select
                  value={form.status}
                  onChange={(e) => updateField("status", e.target.value)}
                  className="flex h-9 w-full rounded-md border border-ws-border bg-white px-3 py-1 text-sm text-ws-text shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ws-blue"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div>
                <WsLabel>Sort Order</WsLabel>
                <WsInput
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => updateField("sortOrder", parseInt(e.target.value) || 0)}
                />
              </div>
            </WsCardContent>
          </WsCard>

          <WsCard>
            <WsCardHeader>
              <WsCardTitle>SEO</WsCardTitle>
            </WsCardHeader>
            <WsCardContent className="space-y-4">
              <div>
                <WsLabel>SEO Title</WsLabel>
                <WsInput
                  value={form.seoTitle}
                  onChange={(e) => updateField("seoTitle", e.target.value)}
                />
              </div>
              <div>
                <WsLabel>SEO Description</WsLabel>
                <textarea
                  value={form.seoDescription}
                  onChange={(e) => updateField("seoDescription", e.target.value)}
                  rows={3}
                  className="flex w-full rounded-md border border-ws-border bg-white px-3 py-2 text-sm text-ws-text shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ws-blue"
                />
              </div>
            </WsCardContent>
          </WsCard>
        </div>
      </div>
    </div>
  );
}
