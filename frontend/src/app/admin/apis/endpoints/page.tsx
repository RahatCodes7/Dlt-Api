"use client";

import * as React from "react";
import { Loader2, Search } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { apiFetch } from "@/lib/api";

interface EndpointRow {
  method: string;
  path: string;
  auth: string;
  description: string;
  platform: string | null;
}

const METHOD_TONE: Record<string, string> = {
  GET: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  POST: "bg-accent/10 text-accent",
  PATCH: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  PUT: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  DELETE: "bg-rose-500/10 text-rose-500",
};

export default function AdminApiEndpointsPage() {
  const [items, setItems] = React.useState<EndpointRow[]>([]);
  const [filter, setFilter] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch<{ items: EndpointRow[] }>("/v1/admin/apis/endpoints");
        setItems(data.items);
      } catch (exc) {
        setError(exc instanceof Error ? exc.message : "Could not load endpoints");
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, []);

  const visible = items.filter((item) =>
    `${item.method} ${item.path} ${item.description}`.toLowerCase().includes(filter.trim().toLowerCase()),
  );

  return (
    <div>
      <PageHeader eyebrow="Admin · APIs" title="API endpoints" description="The request contract exposed to every developer, per built-in platform." />

      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter by method, path or description…"
          className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
        />
      </div>

      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Method</th>
                <th className="px-5 py-3 font-semibold">Path</th>
                <th className="px-5 py-3 font-semibold">Auth</th>
                <th className="px-5 py-3 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground">No endpoints match that filter.</td></tr>
              ) : visible.map((item, index) => (
                <tr key={`${item.method}-${item.path}-${index}`} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                  <td className="px-5 py-3"><span className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-bold ${METHOD_TONE[item.method] ?? "bg-muted text-muted-foreground"}`}>{item.method}</span></td>
                  <td className="px-5 py-3 font-mono text-xs">{item.path}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{item.auth}</td>
                  <td className="px-5 py-3 text-muted-foreground">{item.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
