"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  WsCard,
  WsCardContent,
} from "@/components/ui/cyber-card";
import { WsBadge } from "@/components/ui/cyber-badge";
import { WsButton } from "@/components/ui/cyber-button";
import { api } from "@/lib/api";
import type { Return } from "@/types/return";
import { RotateCcw, Plus } from "lucide-react";

const statusColorMap: Record<string, string> = {
  requested: "amber",
  approved: "blue",
  rejected: "red",
  received: "purple",
  refunded: "green",
};

export default function ReturnsPage() {
  const t = useTranslations("account");
  const tc = useTranslations("common");

  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReturns() {
      try {
        const res = await api.get<{ returns: Return[] }>("/returns");
        setReturns(res.returns ?? []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchReturns();
  }, []);

  if (loading) {
    return <p className="text-sm text-ws-text-muted">{tc("loading")}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-ws-text">{t("returns")}</h2>
        <Link href="/account/returns/new" as={"/account/returns/new" as any}>
          <WsButton variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Request Return
          </WsButton>
        </Link>
      </div>

      {returns.length === 0 ? (
        <WsCard>
          <WsCardContent className="flex flex-col items-center py-12">
            <RotateCcw className="h-12 w-12 text-ws-text-muted/30 mb-3" />
            <p className="text-sm text-ws-text-muted">No return requests</p>
          </WsCardContent>
        </WsCard>
      ) : (
        <div className="space-y-3">
          {returns.map((ret) => (
            <WsCard key={ret.returnId}>
              <WsCardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-ws-text">
                    Return for Order #{ret.orderId.slice(0, 8)}...
                  </p>
                  <p className="text-xs text-ws-text-muted">
                    {new Date(ret.requestedAt).toLocaleDateString()} · {ret.items.length} item
                    {ret.items.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-ws-text-muted">{ret.reason}</p>
                </div>
                <div className="flex items-center gap-3">
                  <WsBadge variant={(statusColorMap[ret.status] ?? "muted") as any}>
                    {ret.status}
                  </WsBadge>
                  {ret.refundAmount && (
                    <span className="text-sm font-medium text-ws-green tabular-nums">
                      ${ret.refundAmount.toFixed(2)}
                    </span>
                  )}
                </div>
              </WsCardContent>
            </WsCard>
          ))}
        </div>
      )}
    </div>
  );
}
