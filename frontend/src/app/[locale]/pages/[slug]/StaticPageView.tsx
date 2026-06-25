"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  WsCard,
  WsCardContent,
} from "@/components/ui/cyber-card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { api } from "@/lib/api";

interface Page {
  pageId: string;
  title: string;
  slug: string;
  content: string;
  updatedAt: string;
}

export default function StaticPage() {
  const { slug } = useParams<{ slug: string }>();
  const tc = useTranslations("common");

  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchPage() {
      try {
        const res = await api.get<{ page: Page }>(`/pages/${slug}`);
        setPage(res.page);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchPage();
  }, [slug]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <p className="text-sm text-ws-text-muted">{tc("loading")}</p>
          ) : error || !page ? (
            <div className="text-center py-12">
              <p className="text-sm text-ws-text-muted">Page not found</p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-ws-text mb-6">{page.title}</h1>
              <div
                className="prose prose-sm max-w-none text-ws-text-secondary"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
              <p className="text-xs text-ws-text-muted mt-8 border-t border-ws-border pt-4">
                Last updated: {new Date(page.updatedAt).toLocaleDateString()}
              </p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
