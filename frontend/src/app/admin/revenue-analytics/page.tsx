"use client";

import * as React from "react";
import { BarChart3, Loader2, Wallet } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { apiFetch } from "@/lib/api";

interface RevenueData {
  mrr: number;
  arr: number;
  total_revenue: number;
  total_transactions: number;
  avg_transaction: number;
  series: { month: string; revenue: number; transactions: number }[];
}

export default function AdminRevenueAnalyticsPage() {
  const [data, setData] = React.useState<RevenueData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const load = async () => {
      try {
        setData(await apiFetch<RevenueData>("/v1/admin/revenue?months=12"));
      } catch (exc) {
        setError(exc instanceof Error ? exc.message : "Could not load revenue analytics");
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, []);

  const maxRevenue = Math.max(1, ...(data?.series.map((row) => row.revenue) ?? [1]));

  return (
    <div>
      <PageHeader eyebrow="Admin · Finance" title="Revenue analytics" description="MRR, ARR, and monthly revenue from completed transactions." />

      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {loading || !data ? (
        <div className="flex min-h-[240px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="MRR (this month)" value={`$${data.mrr.toFixed(2)}`} icon={Wallet} tone="primary" />
            <StatCard label="ARR (projected)" value={`$${data.arr.toFixed(2)}`} icon={Wallet} tone="blue" />
            <StatCard label="Total revenue" value={`$${data.total_revenue.toFixed(2)}`} hint={`${data.total_transactions} completed transactions`} icon={BarChart3} tone="accent" />
            <StatCard label="Avg. transaction" value={`$${data.avg_transaction.toFixed(2)}`} icon={BarChart3} tone="amber" />
          </div>

          <div className="surface mt-5 p-5">
            <h2 className="font-semibold">Monthly revenue</h2>
            <div className="mt-4 flex h-56 items-end gap-2">
              {data.series.map((row) => (
                <div key={row.month} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-[10px] font-semibold tabular-nums">{row.revenue > 0 ? `$${Math.round(row.revenue)}` : ""}</span>
                  <div
                    className="w-full rounded-t bg-primary/80"
                    style={{ height: `${Math.max(row.revenue > 0 ? 6 : 2, (row.revenue / maxRevenue) * 170)}px` }}
                    title={`${row.month}: $${row.revenue.toFixed(2)} · ${row.transactions} transactions`}
                  />
                  <span className="w-full truncate text-center text-[9px] text-muted-foreground">{row.month.slice(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
