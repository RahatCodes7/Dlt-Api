"use client";

import * as React from "react";
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface TicketSummary {
  id: number;
  subject: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string | null;
  message_count: number;
}

interface TicketMessage {
  id: number;
  author: string;
  body: string;
  created_at: string;
}

interface TicketDetail extends TicketSummary {
  messages: TicketMessage[];
}

const PRIORITIES = ["low", "normal", "high", "urgent"];

const formatDate = (value: string | null) => {
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

const statusClass = (status: string) => {
  if (status === "closed") return "bg-muted text-muted-foreground";
  if (status === "pending") return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  return "bg-accent/10 text-accent";
};

const priorityClass = (priority: string) => {
  if (priority === "urgent") return "bg-destructive/10 text-destructive";
  if (priority === "high") return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  return "bg-muted text-muted-foreground";
};

export default function SupportTicketsPage() {
  const [tickets, setTickets] = React.useState<TicketSummary[]>([]);
  const [selected, setSelected] = React.useState<TicketDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [subject, setSubject] = React.useState("");
  const [priority, setPriority] = React.useState("normal");
  const [message, setMessage] = React.useState("");
  const [reply, setReply] = React.useState("");
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setTickets(await apiFetch<TicketSummary[]>("/v1/session/account/support-tickets"));
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load tickets");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const openTicket = async (id: number) => {
    setDetailLoading(true);
    setError("");
    try {
      setSelected(await apiFetch<TicketDetail>(`/v1/session/account/support-tickets/${id}`));
      setReply("");
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load ticket");
    } finally {
      setDetailLoading(false);
    }
  };

  const createTicket = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!subject.trim() || !message.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const created = await apiFetch<TicketSummary>("/v1/session/account/support-tickets", {
        method: "POST",
        body: JSON.stringify({ subject: subject.trim(), message: message.trim(), priority }),
      });
      setSubject("");
      setMessage("");
      setPriority("normal");
      setShowForm(false);
      await load();
      await openTicket(created.id);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not create ticket");
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !reply.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/v1/session/account/support-tickets/${selected.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: reply.trim() }),
      });
      setReply("");
      await openTicket(selected.id);
      await load();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not send reply");
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (status: "open" | "closed") => {
    if (!selected || busy) return;
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/v1/session/account/support-tickets/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await openTicket(selected.id);
      await load();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not update ticket");
    } finally {
      setBusy(false);
    }
  };

  const openCount = tickets.filter((ticket) => ticket.status === "open").length;
  const closedCount = tickets.filter((ticket) => ticket.status === "closed").length;

  return (
    <div>
      <PageHeader
        eyebrow="Developer"
        title="Support tickets"
        description="Ask a question and track replies from the team."
        actions={
          <>
            <button type="button" onClick={load} className="btn btn-outline">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button type="button" onClick={() => setShowForm((open) => !open)} className="btn btn-primary">
              <Plus className="h-4 w-4" /> New ticket
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Open" value={String(openCount)} hint="awaiting reply" icon={HelpCircle} tone="primary" />
        <StatCard label="Closed" value={String(closedCount)} hint="resolved" icon={CheckCircle2} tone="accent" />
        <StatCard label="Total" value={String(tickets.length)} hint="all conversations" icon={MessageSquare} tone="blue" />
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={createTicket} className="surface mt-4 space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">New ticket</h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-sm font-medium">Subject</span>
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Short summary of your issue"
                maxLength={255}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Priority</span>
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                {PRIORITIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Message</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={5}
              placeholder="Describe the issue, include request IDs and URLs if relevant."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={busy || !subject.trim() || !message.trim()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {busy ? "Creating…" : "Create ticket"}
          </button>
        </form>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="surface overflow-hidden lg:col-span-1">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold">Your tickets</h2>
            <p className="text-xs text-muted-foreground">{tickets.length} conversation(s)</p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : tickets.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No tickets yet. Create one to reach the team.
            </div>
          ) : (
            <div className="max-h-[520px] divide-y divide-border overflow-y-auto">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => openTicket(ticket.id)}
                  className={cn(
                    "flex w-full flex-col gap-1.5 px-5 py-3.5 text-left transition-colors hover:bg-muted/50",
                    selected?.id === ticket.id && "bg-muted/70",
                  )}
                >
                  <span className="truncate text-sm font-medium">{ticket.subject}</span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", statusClass(ticket.status))}>
                      {ticket.status}
                    </span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", priorityClass(ticket.priority))}>
                      {ticket.priority}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{formatDate(ticket.updated_at ?? ticket.created_at)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="surface p-6 lg:col-span-2">
          {!selected ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <MessageSquare className="h-6 w-6" />
              </span>
              <h2 className="mt-4 font-semibold">Select a ticket</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Choose a conversation on the left to read the thread and reply.
              </p>
            </div>
          ) : detailLoading ? (
            <div className="flex min-h-[300px] items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading conversation…
            </div>
          ) : (
            <div>
              <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-semibold">{selected.subject}</h2>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span>#{selected.id}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatDate(selected.created_at)}
                    </span>
                    <span className={cn("rounded-full px-2 py-0.5 font-semibold capitalize", statusClass(selected.status))}>
                      {selected.status}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStatus(selected.status === "closed" ? "open" : "closed")}
                  disabled={busy}
                  className="btn btn-outline h-9"
                >
                  {selected.status === "closed" ? "Reopen" : "Close ticket"}
                </button>
              </div>

              <div className="mt-4 max-h-[340px] space-y-3 overflow-y-auto pr-1">
                {selected.messages.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-xl px-4 py-3 text-sm",
                      item.author === "user"
                        ? "ml-auto max-w-[85%] bg-primary/10"
                        : "mr-auto max-w-[85%] bg-muted",
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between gap-3 text-[10px] uppercase tracking-wide text-muted-foreground">
                      <span>{item.author === "user" ? "You" : "Support"}</span>
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{item.body}</p>
                  </div>
                ))}
              </div>

              {selected.status === "closed" ? (
                <p className="mt-4 rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                  This ticket is closed. Reopen it to send another message.
                </p>
              ) : (
                <form onSubmit={sendReply} className="mt-4 flex items-end gap-2 border-t border-border pt-4">
                  <textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    rows={2}
                    placeholder="Write a reply…"
                    className="min-h-[44px] flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                  <button type="submit" className="btn btn-primary h-10" disabled={busy || !reply.trim()}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
