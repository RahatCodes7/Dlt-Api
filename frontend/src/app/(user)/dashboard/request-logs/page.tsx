"use client";

import * as React from "react";
import { FileText, Loader2, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

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

type Filter = "all" | "success" | "error";

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

export default function RequestLogsPage() {
  const [filter, setFilter] = React.useState<Filter>("all");
  const [data, setData] = React.useState<LogsResponse | null>(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = filter === "all" ? "" : `&status_filter=${filter}`;
      setData(await apiFetch<LogsResponse>(`/v1/session/account/logs?limit=100${query}`));
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load request logs");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        eyebrow="Analytics"
        title="Request logs"
        description="Every request made with your API keys, newest first."
        actions={
          <button type="button" onClick={load} className="btn btn-outline">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(
          [
            { key: "all", label: "All requests" },
            { key: "success", label: "Successful" },
            { key: "error", label: "Errors" },
          ] as { key: Filter; label: string }[]
        ).map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              filter === item.key
                ? "bg-primary text-white"
                : "border border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
        {data && (
          <span className="ml-auto text-xs text-muted-foreground">
            {data.total.toLocaleString()} record{data.total === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="surface overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <FileText className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Log entries</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading logs…
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
            <p className="text-sm font-medium">No log entries</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Requests appear here after you use an API key.
            </p>
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
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          item.status === "success"
                            ? "bg-accent/10 text-accent"
                            : "bg-destructive/10 text-destructive",
                        )}
                      >
                        {item.status === "success" ? "Success" : "Error"}
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
