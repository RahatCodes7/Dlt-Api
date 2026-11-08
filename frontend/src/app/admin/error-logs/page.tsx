"use client";

import * as React from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { apiFetch } from "@/lib/api";

interface ErrorRow {
  id: number;
  user_email: string;
  platform: string;
  url: string | null;
  status: string;
  created_at: string | null;
}

interface ErrorsResponse {
  items: ErrorRow[];
  by_platform: { platform: string; count: number; last_seen: string | null }[];
  total: number;
  page: number;
  pages: number;
}

const formatDateTime = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

export default function AdminErrorLogsPage() {
  const [data, setData] = React.useState<ErrorsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [platform, setPlatform] = React.useState("");
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), page_size: "25" });
        if (platform) params.set("platform", platform);
        setData(await apiFetch<ErrorsResponse>(`/v1/admin/logs/errors?${params.toString()}`));
      } catch (exc) {
        setError(exc instanceof Error ? exc.message : "Could not load error logs");
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [platform, page]);

  return (
    <div>
      <PageHeader
        eyebrow="Admin · System"
        title="Error logs"
        description="Failed requests, grouped by platform, newest first."
        actions={
          <select value={platform} onChange={(event) => { setPlatform(event.target.value); setPage(1); }} className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary">
            <option value="">All platforms</option>
            {["youtube", "instagram", "facebook", "tiktok"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        }
      />

      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {loading && !data ? (
        <div className="flex min-h-[240px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Total errors" value={String(data?.total ?? 0)} icon={AlertTriangle} tone="rose" />
            {(data?.by_platform ?? []).slice(0, 4).map((row) => (
              <StatCard key={row.platform} label={row.platform} value={String(row.count)} hint={`Last: ${formatDateTime(row.last_seen)}`} icon={AlertTriangle} tone="amber" />
            ))}
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">#</th>
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-5 py-3 font-semibold">Platform</th>
                  <th className="px-5 py-3 font-semibold">URL</th>
                  <th className="px-5 py-3 font-semibold">When</th>
                </tr>
              </thead>
              <tbody>
                {!data || data.items.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">No errors recorded.</td></tr>
                ) : data.items.map((row) => (
                  <tr key={row.id} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{row.id}</td>
                    <td className="px-5 py-3">{row.user_email}</td>
                    <td className="px-5 py-3 font-medium capitalize">{row.platform}</td>
                    <td className="max-w-[300px] truncate px-5 py-3 text-xs text-muted-foreground" title={row.url ?? ""}>{row.url ?? "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDateTime(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>{data.total.toLocaleString()} error{data.total === 1 ? "" : "s"} · page {data.page} of {data.pages}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn btn-outline px-2 py-1.5 disabled:opacity-40" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page >= data.pages} className="btn btn-outline px-2 py-1.5 disabled:opacity-40" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
