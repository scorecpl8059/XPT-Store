"use client";

import { useState, useEffect } from "react";
import {
  WsCard,
  WsCardContent,
} from "@/components/ui/cyber-card";
import { WsBadge } from "@/components/ui/cyber-badge";
import { WsButton } from "@/components/ui/cyber-button";
import { api } from "@/lib/api";
import { FileText, Plus } from "lucide-react";

interface Page {
  pageId: string;
  title: string;
  slug: string;
  type: "legal" | "faq" | "custom";
  status: "published" | "draft";
  sortOrder: number;
  updatedAt: string;
}

export default function AdminPagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ pages: Page[] }>("/pages");
      setPages(res.pages ?? []);
    } catch {
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleDelete = async (pageId: string) => {
    if (!confirm("Delete this page?")) return;
    try {
      await api.delete(`/pages/${pageId}`);
      await fetchPages();
    } catch {
      // handle error
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ws-text">Pages</h1>
          <p className="text-sm text-ws-text-muted">{pages.length} pages</p>
        </div>
        <a href="/admin/pages/new">
          <WsButton variant="primary">
            <Plus className="h-4 w-4 mr-1" />
            New Page
          </WsButton>
        </a>
      </div>

      {loading ? (
        <p className="text-sm text-ws-text-muted">Loading...</p>
      ) : pages.length === 0 ? (
        <WsCard>
          <WsCardContent className="flex flex-col items-center py-12">
            <FileText className="h-12 w-12 text-ws-text-muted/30 mb-3" />
            <p className="text-sm text-ws-text-muted">No pages yet</p>
          </WsCardContent>
        </WsCard>
      ) : (
        <div className="border border-ws-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ws-surface">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-ws-text-muted">Title</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-ws-text-muted">Slug</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-ws-text-muted">Type</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-ws-text-muted">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-ws-text-muted">Updated</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-ws-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.pageId} className="border-t border-ws-border hover:bg-ws-surface/50">
                  <td className="px-4 py-3">
                    <a
                      href={`/admin/pages/${page.pageId}`}
                      className="text-ws-blue hover:underline font-medium"
                    >
                      {page.title}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-ws-text-muted font-mono text-xs">{page.slug}</td>
                  <td className="px-4 py-3">
                    <WsBadge variant="muted">{page.type}</WsBadge>
                  </td>
                  <td className="px-4 py-3">
                    <WsBadge variant={page.status === "published" ? "green" : "amber"}>
                      {page.status}
                    </WsBadge>
                  </td>
                  <td className="px-4 py-3 text-ws-text-muted">
                    {new Date(page.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <a href={`/admin/pages/${page.pageId}`} className="text-xs text-ws-blue hover:underline">
                        Edit
                      </a>
                      <button
                        onClick={() => handleDelete(page.pageId)}
                        className="text-xs text-red-400 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
