"use client";

import * as React from "react";
import { Loader2, Megaphone, Send, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { apiFetch } from "@/lib/api";

interface Announcement {
  id: number;
  title: string;
  body: string;
  audience: string;
  sent_count: number;
  created_at: string | null;
}

const formatDateTime = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
};

export default function AdminAnnouncementsPage() {
  const [items, setItems] = React.useState<Announcement[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [audience, setAudience] = React.useState("all");
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const data = await apiFetch<{ items: Announcement[] }>("/v1/admin/announcements");
      setItems(data.items);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load announcements");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const publish = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const created = await apiFetch<Announcement>("/v1/admin/announcements", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), body: body.trim(), audience }),
      });
      setTitle("");
      setBody("");
      setNotice(`Published to ${created.sent_count} user${created.sent_count === 1 ? "" : "s"}.`);
      await load();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not publish announcement");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    setError("");
    try {
      await apiFetch(`/v1/admin/announcements/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not delete announcement");
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Admin · Support" title="Announcements" description="Broadcast product news and incident updates to in-app inboxes." />

      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {notice && <div className="mb-4 rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm text-accent">{notice}</div>}

      <div className="grid gap-6 lg:grid-cols-5">
        <form onSubmit={publish} className="surface space-y-4 p-6 lg:col-span-2">
          <h2 className="flex items-center gap-2 font-semibold"><Megaphone className="h-5 w-5 text-primary" /> New announcement</h2>
          <label className="block">
            <span className="text-sm font-semibold">Title</span>
            <input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Scheduled maintenance" className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Audience</span>
            <select value={audience} onChange={(event) => setAudience(event.target.value)} className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="all">All users</option>
              <option value="users">Regular users only</option>
              <option value="admins">Admins only</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Body</span>
            <textarea required rows={5} value={body} onChange={(event) => setBody(event.target.value)} placeholder="We will restart the API fleet tonight between 02:00–02:15 UTC…" className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </label>
          <div className="flex justify-end border-t border-border pt-4">
            <button type="submit" disabled={busy} className="btn btn-primary">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Publish announcement
            </button>
          </div>
        </form>

        <div className="lg:col-span-3">
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Recent broadcasts</h2>
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <div className="surface p-10 text-center text-sm text-muted-foreground">No announcements published yet.</div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="surface flex items-start justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{item.title}</h3>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{item.audience}</span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted-foreground">{item.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(item.created_at)} · delivered to {item.sent_count} user{item.sent_count === 1 ? "" : "s"}</p>
                  </div>
                  <button onClick={() => remove(item.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label="Delete announcement">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
