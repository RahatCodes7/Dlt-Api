"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { apiFetch } from "@/lib/api";

interface LogRow {
  id: number;
  user_email: string;
  platform: string;
  url: string | null;
  status: string;
  created_at: string | null;
}

interface LogsResponse {
  items: LogRow[];
  total: number;
  page: number;
  pages: number;
}

const formatDateTime = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

export default function AdminApiLogsPage() {
  const [data, setData] = React.useState<LogsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [platform, setPlatform] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), page_size: "25" });
        if (search.trim()) params.set("search", search.trim());
        if (platform) params.set("platform", platform);
        if (status) params.set("status", status);
        setData(await apiFetch<LogsResponse>(`/v1/admin/logs?${params.toString()}`));
      } catch (exc) {
        setError(exc instanceof Error ? exc.message : "Could not load logs");
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [search, platform, status, page]);

  return (
    <div>
      <PageHeader eyebrow="Admin · System" title="API logs" description="A searchable stream of every request handled by the gateway." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Search by URL or user email…"
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <select value={platform} onChange={(event) => { setPlatform(event.target.value); setPage(1); }} className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary">
          <option value="">All platforms</option>
          {["youtube", "instagram", "facebook", "tiktok"].map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary">
          <option value="">All statuses</option>
          <option value="success">success</option>
          <option value="error">error</option>
        </select>
      </div>

      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {loading && !data ? (
        <div className="flex min-h-[240px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">#</th>
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-5 py-3 font-semibold">Platform</th>
                  <th className="px-5 py-3 font-semibold">URL</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">When</th>
                </tr>
              </thead>
              <tbody>
                {!data || data.items.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">No log entries match.</td></tr>
                ) : data.items.map((row) => (
                  <tr key={row.id} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{row.id}</td>
                    <td className="px-5 py-3">{row.user_email}</td>
                    <td className="px-5 py-3 font-medium capitalize">{row.platform}</td>
                    <td className="max-w-[280px] truncate px-5 py-3 text-xs text-muted-foreground" title={row.url ?? ""}>{row.url ?? "—"}</td>
                    <td className="px-5 py-3"><span className={row.status === "success" ? "text-accent" : "text-destructive"}>{row.status}</span></td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDateTime(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>{data.total.toLocaleString()} entr{data.total === 1 ? "y" : "ies"} · page {data.page} of {data.pages}</span>
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
