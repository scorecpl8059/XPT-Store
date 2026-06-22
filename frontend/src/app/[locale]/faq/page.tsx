"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  WsCard,
  WsCardContent,
} from "@/components/ui/cyber-card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { api } from "@/lib/api";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  pageId: string;
  title: string;
  content: string;
  sortOrder: number;
}

export default function FaqPage() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");

  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFaqs() {
      try {
        const res = await api.get<{ pages: FaqItem[] }>("/pages", { type: "faq" });
        setFaqs((res.pages ?? []).sort((a, b) => a.sortOrder - b.sortOrder));
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchFaqs();
  }, []);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-ws-text mb-6">{t("faq")}</h1>

          {loading ? (
            <p className="text-sm text-ws-text-muted">{tc("loading")}</p>
          ) : faqs.length === 0 ? (
            <WsCard>
              <WsCardContent className="text-center py-12">
                <p className="text-sm text-ws-text-muted">No FAQs available yet.</p>
              </WsCardContent>
            </WsCard>
          ) : (
            <div className="space-y-2">
              {faqs.map((faq) => (
                <div
                  key={faq.pageId}
                  className="border border-ws-border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggle(faq.pageId)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-ws-surface/50 transition-colors"
                  >
                    <span className="text-sm font-medium text-ws-text">
                      {faq.title}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-ws-text-muted transition-transform ${
                        openId === faq.pageId ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openId === faq.pageId && (
                    <div className="px-4 pb-3 border-t border-ws-border">
                      <div
                        className="text-sm text-ws-text-secondary prose prose-sm max-w-none pt-3"
                        dangerouslySetInnerHTML={{ __html: faq.content }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
