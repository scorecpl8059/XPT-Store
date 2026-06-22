"use client";

import { useState, useEffect } from "react";
import {
  WsCard,
  WsCardContent,
} from "@/components/ui/cyber-card";
import { WsBadge } from "@/components/ui/cyber-badge";
import { WsButton } from "@/components/ui/cyber-button";
import { api } from "@/lib/api";
import { FileQuestion } from "lucide-react";

interface RfqItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
}

interface Rfq {
  rfqId: string;
  userId: string;
  companyName?: string;
  items: RfqItem[];
  message?: string;
  status: "pending" | "quoted" | "accepted" | "rejected" | "expired";
  createdAt: string;
}

const statusColorMap: Record<string, string> = {
  pending: "amber",
  quoted: "blue",
  accepted: "green",
  rejected: "red",
  expired: "muted",
};

const rfqStatuses = ["all", "pending", "quoted", "accepted", "rejected", "expired"] as const;

export default function AdminRfqPage() {
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<string>("pending");

  const fetchRfqs = async (status?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (status && status !== "all") params.status = status;
      const res = await api.get<{ rfqs: Rfq[] }>("/rfq", params);
      setRfqs(res.rfqs ?? []);
    } catch {
      setRfqs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqs(activeStatus);
  }, [activeStatus]);

  const updateStatus = async (rfqId: string, status: string) => {
    try {
      await api.put(`/rfq/${rfqId}`, { status });
      await fetchRfqs(activeStatus);
    } catch {
      // handle error
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ws-text">Quote Requests</h1>
        <p className="text-sm text-ws-text-muted">{rfqs.length} requests</p>
      </div>

      <div className="flex flex-wrap gap-1">
        {rfqStatuses.map((status) => (
          <button
            key={status}
            onClick={() => setActiveStatus(status)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
              activeStatus === status
                ? "bg-ws-blue/10 text-ws-blue border border-ws-blue/20"
                : "text-ws-text-muted hover:text-ws-text hover:bg-ws-surface border border-transparent"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-ws-text-muted">Loading...</p>
      ) : rfqs.length === 0 ? (
        <WsCard>
          <WsCardContent className="flex flex-col items-center py-12">
            <FileQuestion className="h-12 w-12 text-ws-text-muted/30 mb-3" />
            <p className="text-sm text-ws-text-muted">No quote requests</p>
          </WsCardContent>
        </WsCard>
      ) : (
        <div className="space-y-3">
          {rfqs.map((rfq) => (
            <WsCard key={rfq.rfqId}>
              <WsCardContent className="py-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-ws-text">
                      {rfq.companyName || `User ${rfq.userId.slice(0, 8)}...`}
                    </p>
                    <p className="text-xs text-ws-text-muted">
                      {new Date(rfq.createdAt).toLocaleDateString()} · {rfq.items.length} item
                      {rfq.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <WsBadge variant={(statusColorMap[rfq.status] ?? "muted") as any}>
                    {rfq.status}
                  </WsBadge>
                </div>

                {/* Items summary */}
                <div className="bg-ws-surface rounded-md p-3 mb-3">
                  {rfq.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs py-0.5">
                      <span className="text-ws-text">
                        {item.name || item.productId} ({item.sku || "N/A"})
                      </span>
                      <span className="text-ws-text-muted">× {item.quantity}</span>
                    </div>
                  ))}
                </div>

                {rfq.message && (
                  <p className="text-xs text-ws-text-muted mb-3">{rfq.message}</p>
                )}

                {rfq.status === "pending" && (
                  <div className="flex gap-2">
                    <WsButton
                      variant="primary"
                      size="sm"
                      onClick={() => updateStatus(rfq.rfqId, "quoted")}
                    >
                      Mark as Quoted
                    </WsButton>
                    <WsButton
                      variant="secondary"
                      size="sm"
                      onClick={() => updateStatus(rfq.rfqId, "rejected")}
                    >
                      Reject
                    </WsButton>
                  </div>
                )}
              </WsCardContent>
            </WsCard>
          ))}
        </div>
      )}
    </div>
  );
}
