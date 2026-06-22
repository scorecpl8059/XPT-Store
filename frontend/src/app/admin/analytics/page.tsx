"use client";

import { useState, useEffect } from "react";
import {
  WsCard,
  WsCardContent,
  WsCardHeader,
  WsCardTitle,
} from "@/components/ui/cyber-card";
import { api } from "@/lib/api";
import { BarChart3, Search, TrendingUp } from "lucide-react";

interface SearchLog {
  query: string;
  count: number;
  resultsCount: number;
}

export default function AdminAnalyticsPage() {
  const [searchLogs, setSearchLogs] = useState<SearchLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Analytics data would come from search logs and order aggregations
    // For now, show placeholder structure
    setLoading(false);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ws-text">Analytics</h1>
        <p className="text-sm text-ws-text-muted">
          Search trends and customer insights
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Search Queries */}
        <WsCard>
          <WsCardHeader>
            <WsCardTitle className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Top Search Queries
            </WsCardTitle>
          </WsCardHeader>
          <WsCardContent>
            <p className="text-sm text-ws-text-muted">
              Search analytics will appear here once search data is collected.
            </p>
          </WsCardContent>
        </WsCard>

        {/* Searches with No Results */}
        <WsCard>
          <WsCardHeader>
            <WsCardTitle className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Searches with No Results
            </WsCardTitle>
          </WsCardHeader>
          <WsCardContent>
            <p className="text-sm text-ws-text-muted">
              Queries that returned no results will appear here.
            </p>
          </WsCardContent>
        </WsCard>

        {/* Revenue Trends */}
        <WsCard>
          <WsCardHeader>
            <WsCardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Revenue Trends
            </WsCardTitle>
          </WsCardHeader>
          <WsCardContent>
            <p className="text-sm text-ws-text-muted">
              Revenue charts will appear here. Connect Google Analytics 4 for detailed insights.
            </p>
          </WsCardContent>
        </WsCard>

        {/* Conversion Funnel */}
        <WsCard>
          <WsCardHeader>
            <WsCardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Conversion Funnel
            </WsCardTitle>
          </WsCardHeader>
          <WsCardContent>
            <p className="text-sm text-ws-text-muted">
              Funnel metrics (visitors → cart → checkout → purchase) available via GA4.
            </p>
          </WsCardContent>
        </WsCard>
      </div>
    </div>
  );
}
