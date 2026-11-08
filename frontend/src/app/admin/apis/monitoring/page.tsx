"use client";

import * as React from "react";
import { Activity, AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { apiFetch } from "@/lib/api";

interface MonitoringData {
  days: number;
  totals: { requests: number; errors: number; success_rate: number };
  by_platform: { platform: string; requests: number; errors: number; success_rate: number }[];
  series: { day: string; requests: number; errors: number }[];
}

export default function AdminApiMonitoringPage() {
  const [days, setDays] = React.useState(7);
  const [data, setData] = React.useState<MonitoringData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        setData(await apiFetch<MonitoringData>(`/v1/admin/apis/monitoring?days=${days}`));
      } catch (exc) {
        setError(exc instanceof Error ? exc.message : "Could not load monitoring data");
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [days]);

  const maxSeries = Math.max(1, ...(data?.series.map((row) => row.requests) ?? [1]));

  return (
    <div>
      <PageHeader
        eyebrow="Admin · APIs"
        title="API monitoring"
        description="Request volume and error rate across all services."
        actions={
          <select value={days} onChange={(event) => setDays(Number(event.target.value))} className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary">
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        }
      />

      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {loading || !data ? (
        <div className="flex min-h-[240px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label={`Requests (${data.days}d)`} value={data.totals.requests.toLocaleString()} icon={Activity} tone="primary" />
            <StatCard label={`Errors (${data.days}d)`} value={data.totals.errors.toLocaleString()} icon={AlertTriangle} tone={data.totals.errors > 0 ? "amber" : "primary"} />
            <StatCard label="Success rate" value={`${data.totals.success_rate}%`} icon={ShieldCheck} tone="accent" />
          </div>

          <div className="surface mt-5 p-5">
            <h2 className="font-semibold">Daily volume</h2>
            {data.series.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No traffic in this period.</p>
            ) : (
              <div className="mt-4 flex h-48 items-end gap-2">
                {data.series.map((row) => (
                  <div key={row.day} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
                    <span className="text-[10px] font-semibold tabular-nums">{row.requests}</span>
                    <div
                      className="w-full rounded-t bg-primary/80"
                      style={{ height: `${Math.max(4, (row.requests / maxSeries) * 140)}px` }}
                      title={`${row.day}: ${row.requests} requests · ${row.errors} errors`}
                    />
                    <span className="w-full truncate text-center text-[9px] text-muted-foreground">{row.day.slice(5)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Platform</th>
                  <th className="px-5 py-3 font-semibold text-right">Requests</th>
                  <th className="px-5 py-3 font-semibold text-right">Errors</th>
                  <th className="px-5 py-3 font-semibold text-right">Success rate</th>
                </tr>
              </thead>
              <tbody>
                {data.by_platform.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground">No platform traffic in this period.</td></tr>
                ) : data.by_platform.map((row) => (
                  <tr key={row.platform} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3 font-medium capitalize">{row.platform}</td>
                    <td className="px-5 py-3 text-right font-mono text-xs">{row.requests.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right font-mono text-xs">{row.errors.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right">{row.success_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
