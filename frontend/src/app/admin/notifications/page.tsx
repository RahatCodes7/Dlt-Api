"use client";

import * as React from "react";
import { Bell, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { apiFetch } from "@/lib/api";

interface NotificationRow {
  id: number;
  user_email: string;
  title: string;
  body: string | null;
  type: string;
  read: boolean;
  created_at: string | null;
}

interface NotificationsResponse {
  items: NotificationRow[];
  total: number;
  page: number;
  pages: number;
}

const formatDateTime = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

export default function AdminNotificationsPage() {
  const [data, setData] = React.useState<NotificationsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [type, setType] = React.useState("");
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), page_size: "25" });
        if (type) params.set("type", type);
        setData(await apiFetch<NotificationsResponse>(`/v1/admin/notifications?${params.toString()}`));
      } catch (exc) {
        setError(exc instanceof Error ? exc.message : "Could not load notifications");
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [type, page]);

  return (
    <div>
      <PageHeader
        eyebrow="Admin · Support"
        title="Notifications"
        description="Delivery log of in-app notifications sent to user inboxes."
        actions={
          <select value={type} onChange={(event) => { setType(event.target.value); setPage(1); }} className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary">
            <option value="">All types</option>
            <option value="announcement">announcement</option>
            <option value="info">info</option>
            <option value="warning">warning</option>
          </select>
        }
      />

      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {loading && !data ? (
        <div className="flex min-h-[240px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Title</th>
                  <th className="px-5 py-3 font-semibold">Recipient</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Read</th>
                  <th className="px-5 py-3 font-semibold">Sent</th>
                </tr>
              </thead>
              <tbody>
                {!data || data.items.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground"><Bell className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />No notifications recorded.</td></tr>
                ) : data.items.map((row) => (
                  <tr key={row.id} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <span className="font-medium">{row.title}</span>
                      {row.body && <span className="block max-w-[320px] truncate text-xs text-muted-foreground" title={row.body}>{row.body}</span>}
                    </td>
                    <td className="px-5 py-3">{row.user_email}</td>
                    <td className="px-5 py-3"><span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold">{row.type}</span></td>
                    <td className="px-5 py-3">{row.read ? "Yes" : "No"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDateTime(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>{data.total.toLocaleString()} · page {data.page} of {data.pages}</span>
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
