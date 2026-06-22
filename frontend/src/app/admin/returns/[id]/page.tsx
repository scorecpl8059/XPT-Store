"use client";

import { useState, useEffect, use } from "react";
import {
  WsCard,
  WsCardContent,
  WsCardHeader,
  WsCardTitle,
} from "@/components/ui/cyber-card";
import { WsBadge } from "@/components/ui/cyber-badge";
import { WsButton } from "@/components/ui/cyber-button";
import { WsInput, WsLabel } from "@/components/ui/cyber-input";
import { api } from "@/lib/api";
import type { Return } from "@/types/return";
import { ArrowLeft, Check, X, Save } from "lucide-react";

const statusColorMap: Record<string, string> = {
  requested: "amber",
  approved: "blue",
  rejected: "red",
  received: "purple",
  refunded: "green",
};

interface AdminReturnDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AdminReturnDetailPage({ params }: AdminReturnDetailPageProps) {
  const { id } = use(params);

  const [ret, setRet] = useState<Return | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [status, setStatus] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    async function fetchReturn() {
      try {
        const res = await api.get<{ return: Return }>(`/returns/${id}`);
        const r = res.return;
        setRet(r);
        setStatus(r.status);
        setRefundAmount(r.refundAmount?.toString() ?? "");
        setAdminNotes(r.adminNotes ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load return");
      } finally {
        setLoading(false);
      }
    }
    fetchReturn();
  }, [id]);

  const handleUpdate = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const updates: Record<string, unknown> = {};
      if (status !== ret?.status) updates.status = status;
      if (refundAmount) updates.refundAmount = parseFloat(refundAmount);
      if (adminNotes !== (ret?.adminNotes ?? "")) updates.adminNotes = adminNotes;

      const res = await api.put<{ return: Return }>(`/returns/${id}`, updates);
      setRet(res.return);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6"><p className="text-sm text-ws-text-muted">Loading...</p></div>;
  }

  if (error || !ret) {
    return (
      <div className="p-6 text-center py-12">
        <p className="text-sm text-red-400 mb-3">{error || "Return not found"}</p>
        <a href="/admin/returns">
          <WsButton variant="secondary">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Returns
          </WsButton>
        </a>
      </div>
    );
  }

  const itemTotal = ret.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/admin/returns">
            <WsButton variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </WsButton>
          </a>
          <div>
            <h1 className="text-xl font-bold text-ws-text">
              Return Request
            </h1>
            <p className="text-sm text-ws-text-muted">
              {ret.returnId.slice(0, 16)}... · {new Date(ret.requestedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <WsBadge variant={(statusColorMap[ret.status] ?? "muted") as any}>
          {ret.status}
        </WsBadge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <WsCard>
            <WsCardHeader>
              <WsCardTitle>Return Items</WsCardTitle>
            </WsCardHeader>
            <WsCardContent>
              <div className="divide-y divide-ws-border">
                {ret.items.map((item, idx) => (
                  <div key={`${item.productId}-${idx}`} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-ws-text">{item.name}</p>
                      <p className="text-xs text-ws-text-muted">
                        SKU: {item.sku} · Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-ws-text tabular-nums">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-ws-border pt-2 mt-2 flex justify-between text-sm font-semibold text-ws-text">
                <span>Item Total</span>
                <span className="tabular-nums">${itemTotal.toFixed(2)}</span>
              </div>
            </WsCardContent>
          </WsCard>

          {/* Reason */}
          <WsCard>
            <WsCardHeader>
              <WsCardTitle>Customer Reason</WsCardTitle>
            </WsCardHeader>
            <WsCardContent>
              <p className="text-sm text-ws-text">{ret.reason}</p>
            </WsCardContent>
          </WsCard>

          {/* Photos */}
          {ret.images && ret.images.length > 0 && (
            <WsCard>
              <WsCardHeader>
                <WsCardTitle>Photos</WsCardTitle>
              </WsCardHeader>
              <WsCardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ret.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Return photo ${i + 1}`}
                      className="rounded-md border border-ws-border object-cover aspect-square"
                    />
                  ))}
                </div>
              </WsCardContent>
            </WsCard>
          )}
        </div>

        {/* Right column — admin actions */}
        <div className="space-y-6">
          <WsCard>
            <WsCardHeader>
              <WsCardTitle>Update Return</WsCardTitle>
            </WsCardHeader>
            <WsCardContent className="space-y-4">
              <div>
                <WsLabel>Status</WsLabel>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-ws-border bg-white px-3 py-1 text-sm text-ws-text shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ws-blue"
                >
                  {["requested", "approved", "rejected", "received", "refunded"].map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <WsLabel>Refund Amount ($)</WsLabel>
                <WsInput
                  type="number"
                  step="0.01"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder={itemTotal.toFixed(2)}
                />
              </div>

              <div>
                <WsLabel>Admin Notes</WsLabel>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="flex w-full rounded-md border border-ws-border bg-white px-3 py-2 text-sm text-ws-text shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ws-blue"
                />
              </div>

              <WsButton
                variant="primary"
                className="w-full"
                onClick={handleUpdate}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-1" />
                {saving ? "Saving..." : saved ? "Saved!" : "Update Return"}
              </WsButton>

              {/* Quick action buttons */}
              {ret.status === "requested" && (
                <div className="flex gap-2">
                  <WsButton
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setStatus("approved");
                      setRefundAmount(itemTotal.toFixed(2));
                    }}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Approve
                  </WsButton>
                  <WsButton
                    variant="secondary"
                    size="sm"
                    className="flex-1 text-red-500"
                    onClick={() => setStatus("rejected")}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Reject
                  </WsButton>
                </div>
              )}
            </WsCardContent>
          </WsCard>
        </div>
      </div>
    </div>
  );
}
