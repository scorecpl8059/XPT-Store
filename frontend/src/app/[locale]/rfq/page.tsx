"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  WsCard,
  WsCardContent,
  WsCardHeader,
  WsCardTitle,
} from "@/components/ui/cyber-card";
import { WsButton } from "@/components/ui/cyber-button";
import { WsInput, WsLabel } from "@/components/ui/cyber-input";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { api } from "@/lib/api";
import { CheckCircle, Plus, X } from "lucide-react";

interface RfqLine {
  productId: string;
  quantity: number;
  name?: string;
}

export default function RfqPage() {
  const t = useTranslations("rfq");

  const [items, setItems] = useState<RfqLine[]>([{ productId: "", quantity: 1 }]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const addLine = () => {
    setItems((prev) => [...prev, { productId: "", quantity: 1 }]);
  };

  const removeLine = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, field: keyof RfqLine, value: string | number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async () => {
    const validItems = items.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) return;

    setSubmitting(true);
    try {
      await api.post("/rfq", {
        items: validItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        message: message || undefined,
      });
      setSubmitted(true);
    } catch {
      // handle error
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-ws-green mx-auto mb-3" />
            <h2 className="text-lg font-bold text-ws-text mb-1">{t("submitted")}</h2>
            <p className="text-sm text-ws-text-muted">
              We&apos;ll get back to you within 24 hours.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-ws-text mb-2">{t("title")}</h1>
          <p className="text-sm text-ws-text-muted mb-6">{t("description")}</p>

          <div className="space-y-6">
            {/* Product lines */}
            <WsCard>
              <WsCardHeader>
                <div className="flex items-center justify-between">
                  <WsCardTitle>{t("selectProducts")}</WsCardTitle>
                  <WsButton variant="ghost" size="sm" onClick={addLine}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Item
                  </WsButton>
                </div>
              </WsCardHeader>
              <WsCardContent className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-end gap-3">
                    <div className="flex-1">
                      <WsLabel>Product ID / SKU</WsLabel>
                      <WsInput
                        value={item.productId}
                        onChange={(e) => updateLine(idx, "productId", e.target.value)}
                        placeholder="Enter product ID or SKU"
                      />
                    </div>
                    <div className="w-24">
                      <WsLabel>Qty</WsLabel>
                      <WsInput
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateLine(idx, "quantity", parseInt(e.target.value) || 1)}
                      />
                    </div>
                    {items.length > 1 && (
                      <WsButton
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-red-400"
                        onClick={() => removeLine(idx)}
                      >
                        <X className="h-4 w-4" />
                      </WsButton>
                    )}
                  </div>
                ))}
              </WsCardContent>
            </WsCard>

            {/* Message */}
            <WsCard>
              <WsCardHeader>
                <WsCardTitle>{t("message")}</WsCardTitle>
              </WsCardHeader>
              <WsCardContent>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Any additional requirements, timeline, etc."
                  className="flex w-full rounded-md border border-ws-border bg-white px-3 py-2 text-sm text-ws-text shadow-sm placeholder:text-ws-text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ws-blue"
                />
              </WsCardContent>
            </WsCard>

            <WsButton
              variant="primary"
              onClick={handleSubmit}
              disabled={submitting || items.every((i) => !i.productId)}
            >
              {submitting ? "Submitting..." : t("submit")}
            </WsButton>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
