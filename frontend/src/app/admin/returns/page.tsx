"use client";

import { useState, useEffect } from "react";
import {
  WsCard,
  WsCardContent,
} from "@/components/ui/cyber-card";
import { WsBadge } from "@/components/ui/cyber-badge";
import { api } from "@/lib/api";
import type { Return } from "@/types/return";
import { RotateCcw } from "lucide-react";

const statuses = ["all", "requested", "approved", "rejected", "received", "refunded"] as const;

const statusColorMap: Record<string, string> = {
  requested: "amber",
  approved: "blue",
  rejected: "red",
  received: "purple",
  refunded: "green",
};

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<string>("requested");

  const fetchReturns = async (status?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (status && status !== "all") params.status = status;
      const res = await api.get<{ returns: Return[] }>("/returns", params);
      setReturns(res.returns ?? []);
    } catch {
      setReturns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns(activeStatus);
  }, [activeStatus]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ws-text">Returns</h1>
        <p className="text-sm text-ws-text-muted">
          {returns.length} return request{returns.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1">
        {statuses.map((status) => (
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
      ) : returns.length === 0 ? (
        <WsCard>
          <WsCardContent className="flex flex-col items-center py-12">
            <RotateCcw className="h-12 w-12 text-ws-text-muted/30 mb-3" />
            <p className="text-sm text-ws-text-muted">No return requests</p>
          </WsCardContent>
        </WsCard>
      ) : (
        <div className="border border-ws-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ws-surface">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-ws-text-muted">Return ID</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-ws-text-muted">Date</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-ws-text-muted">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-ws-text-muted">Items</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-ws-text-muted">Reason</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-ws-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((ret) => (
                <tr key={ret.returnId} className="border-t border-ws-border hover:bg-ws-surface/50">
                  <td className="px-4 py-3">
                    <a
                      href={`/admin/returns/${ret.returnId}`}
                      className="text-ws-blue hover:underline font-medium"
                    >
                      {ret.returnId.slice(0, 12)}...
                    </a>
                  </td>
                  <td className="px-4 py-3 text-ws-text-muted">
                    {new Date(ret.requestedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <WsBadge variant={(statusColorMap[ret.status] ?? "muted") as any}>
                      {ret.status}
                    </WsBadge>
                  </td>
                  <td className="px-4 py-3 text-ws-text">{ret.items.length}</td>
                  <td className="px-4 py-3 text-ws-text-muted truncate max-w-[200px]">
                    {ret.reason}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={`/admin/returns/${ret.returnId}`}
                      className="text-xs text-ws-blue hover:underline"
                    >
                      Review
                    </a>
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
