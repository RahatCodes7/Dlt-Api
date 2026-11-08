"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Loader2, MessageSquare, Send, X } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { apiFetch } from "@/lib/api";

interface TicketRow {
  id: number;
  user_id: number;
  user_email: string | null;
  subject: string;
  priority: string;
  status: string;
  message_count: number;
  created_at: string | null;
  updated_at: string | null;
}

interface TicketDetail extends TicketRow {
  customer_name: string | null;
  messages: { id: number; author: string; body: string; created_at: string | null }[];
}

const formatDateTime = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

export default function AdminSupportTicketsPage() {
  const [items, setItems] = React.useState<TicketRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [pages, setPages] = React.useState(1);
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [ticket, setTicket] = React.useState<TicketDetail | null>(null);
  const [reply, setReply] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), page_size: "20" });
      if (status) params.set("status", status);
      const data = await apiFetch<{ items: TicketRow[]; total: number; pages: number }>(`/v1/admin/support-tickets?${params.toString()}`);
      setItems(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load tickets");
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  React.useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const openTicket = async (id: number) => {
    setError("");
    try {
      setTicket(await apiFetch<TicketDetail>(`/v1/admin/support-tickets/${id}`));
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load ticket");
    }
  };

  const sendReply = async () => {
    if (!ticket || !reply.trim()) return;
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/v1/admin/support-tickets/${ticket.id}/replies`, {
        method: "POST",
        body: JSON.stringify({ body: reply.trim() }),
      });
      setReply("");
      setTicket(await apiFetch<TicketDetail>(`/v1/admin/support-tickets/${ticket.id}`));
      load();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not send reply");
    } finally {
      setBusy(false);
    }
  };

  const setTicketStatus = async (next: string) => {
    if (!ticket) return;
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/v1/admin/support-tickets/${ticket.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      setTicket(await apiFetch<TicketDetail>(`/v1/admin/support-tickets/${ticket.id}`));
      load();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not update ticket");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Admin · Support"
        title="Support tickets"
        description="Open conversations from developers, sorted by newest first."
        actions={
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary">
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
          </select>
        }
      />

      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {loading && items.length === 0 ? (
        <div className="flex min-h-[240px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Subject</th>
                  <th className="px-5 py-3 font-semibold">Requester</th>
                  <th className="px-5 py-3 font-semibold">Priority</th>
                  <th className="px-5 py-3 font-semibold">Updated</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">No tickets found.</td></tr>
                ) : items.map((row) => (
                  <tr key={row.id} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <button onClick={() => openTicket(row.id)} className="font-medium text-primary hover:underline">{row.subject}</button>
                      <span className="block text-xs text-muted-foreground">{row.message_count} message{row.message_count === 1 ? "" : "s"}</span>
                    </td>
                    <td className="px-5 py-3">{row.user_email ?? `user #${row.user_id}`}</td>
                    <td className="px-5 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${row.priority === "urgent" || row.priority === "high" ? "bg-rose-500/10 text-rose-500" : "bg-muted text-muted-foreground"}`}>{row.priority}</span></td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDateTime(row.updated_at ?? row.created_at)}</td>
                    <td className="px-5 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${row.status === "open" ? "bg-blue-500/10 text-blue-600" : row.status === "pending" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-muted text-muted-foreground"}`}>{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>{total.toLocaleString()} ticket{total === 1 ? "" : "s"} · page {page} of {pages}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn btn-outline px-2 py-1.5 disabled:opacity-40" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages} className="btn btn-outline px-2 py-1.5 disabled:opacity-40" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </>
      )}

      {ticket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="flex max-h-[88vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-border p-5">
              <div>
                <h2 className="font-semibold">{ticket.subject}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{ticket.user_email} · opened {formatDateTime(ticket.created_at)} · priority {ticket.priority}</p>
              </div>
              <button onClick={() => setTicket(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Close"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {ticket.messages.map((message) => (
                <div key={message.id} className={`max-w-[85%] rounded-2xl border px-4 py-2.5 text-sm ${message.author === "admin" || message.author === "support" ? "ml-auto border-primary/30 bg-primary/10" : "border-border bg-muted/50"}`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{message.author === "user" ? ticket.customer_name ?? "Customer" : "Support"}</p>
                  <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">{formatDateTime(message.created_at)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-border p-4">
              <div className="flex items-center gap-2">
                <input
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") sendReply(); }}
                  placeholder="Write a reply…"
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <button onClick={sendReply} disabled={busy || !reply.trim()} className="btn btn-primary" aria-label="Send reply"><Send className="h-4 w-4" /></button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Set status:</span>
                {["open", "pending", "closed"].map((next) => (
                  <button key={next} onClick={() => setTicketStatus(next)} disabled={busy || ticket.status === next} className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ticket.status === next ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"} disabled:cursor-default`}>
                    {next}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
