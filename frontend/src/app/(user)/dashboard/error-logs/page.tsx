"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { apiFetch } from "@/lib/api";

interface LogItem {
  id: number;
  platform: string;
  url: string | null;
  status: string;
  created_at: string | null;
}

interface LogsResponse {
  total: number;
  items: LogItem[];
}

const formatTime = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export default function ErrorLogsPage() {
  const [data, setData] = React.useState<LogsResponse | null>(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(
        await apiFetch<LogsResponse>("/v1/session/account/logs?limit=100&status_filter=error"),
      );
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load error logs");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        eyebrow="Analytics"
        title="Error logs"
        description="Requests from your keys that returned an error."
        actions={
          <button type="button" onClick={load} className="btn btn-outline">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        }
      />

      <div className="surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h2 className="font-semibold">Failed requests</h2>
          </div>
          {data && (
            <span className="text-xs text-muted-foreground">
              {data.total.toLocaleString()} record{data.total === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading errors…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center px-5 py-12 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <button type="button" onClick={load} className="btn btn-outline mt-4">
              Try again
            </button>
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium">No errors recorded</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Failed requests will appear here with the URL and time.
            </p>
            <Link href="/dashboard/request-logs" className="btn btn-outline mt-4">
              View all requests
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">When</th>
                  <th className="px-5 py-3 font-semibold">Platform</th>
                  <th className="px-5 py-3 font-semibold">URL</th>
                  <th className="px-5 py-3 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border/70 last:border-0 hover:bg-muted/40"
                  >
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-muted-foreground">
                      {formatTime(item.created_at)}
                    </td>
                    <td className="px-5 py-3 font-medium capitalize">{item.platform}</td>
                    <td className="max-w-[360px] truncate px-5 py-3 font-mono text-xs text-muted-foreground">
                      {item.url || "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                        Error
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
