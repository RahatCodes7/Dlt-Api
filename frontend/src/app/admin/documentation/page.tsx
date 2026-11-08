"use client";

import * as React from "react";
import { Check, FileText, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { apiFetch } from "@/lib/api";

interface DocSummary {
  id: number;
  title: string;
  section: string;
  slug: string;
  status: "draft" | "published";
  updated_at: string | null;
  created_at: string | null;
}

interface DocDetail extends DocSummary {
  body: string;
}

const EMPTY = { title: "", section: "Guides", slug: "", body: "", status: "draft" as "draft" | "published" };

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function AdminDocumentationPage() {
  const [items, setItems] = React.useState<DocSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [editing, setEditing] = React.useState<number | "new" | null>(null);
  const [draft, setDraft] = React.useState(EMPTY);
  const [busy, setBusy] = React.useState(false);
  const [openingId, setOpeningId] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    try {
      const data = await apiFetch<{ items: DocSummary[] }>("/v1/admin/docs");
      setItems(data.items);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load documentation");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const startNew = () => { setDraft(EMPTY); setEditing("new"); setError(""); };

  const startEdit = async (item: DocSummary) => {
    setOpeningId(item.id);
    setError("");
    try {
      const detail = await apiFetch<DocDetail>(`/v1/admin/docs/${item.id}`);
      setDraft({ title: detail.title, section: detail.section, slug: detail.slug, body: detail.body, status: detail.status });
      setEditing(item.id);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load the document body");
    } finally {
      setOpeningId(null);
    }
  };

  const cancel = () => setEditing(null);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = { ...draft, slug: draft.slug.trim().toLowerCase() };
      if (editing === "new") {
        await apiFetch("/v1/admin/docs", { method: "POST", body: JSON.stringify(payload) });
      } else if (typeof editing === "number") {
        await apiFetch(`/v1/admin/docs/${editing}`, { method: "PUT", body: JSON.stringify(payload) });
      }
      setEditing(null);
      await load();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not save document");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    setError("");
    try {
      await apiFetch(`/v1/admin/docs/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not delete document");
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Admin · Content"
        title="Documentation"
        description="Markdown guides served by the public docs site. Slugs must be unique and lowercase."
        actions={<button onClick={startNew} className="btn btn-primary"><Plus className="h-4 w-4" /> New page</button>}
      />

      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {editing !== null && (
        <form onSubmit={save} className="surface mb-5 space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{editing === "new" ? "New page" : `Edit page #${editing}`}</h2>
            <button type="button" onClick={cancel} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Close editor"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold">Title</span>
              <input required value={draft.title} onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Slug</span>
              <input required value={draft.slug} onChange={(event) => setDraft((prev) => ({ ...prev, slug: event.target.value }))} placeholder="getting-started" pattern="[a-z0-9][a-z0-9-]{0,254}" className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Section</span>
              <input value={draft.section} onChange={(event) => setDraft((prev) => ({ ...prev, section: event.target.value }))} placeholder="Guides" className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Status</span>
              <select value={draft.status} onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value as "draft" | "published" }))} className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary">
                <option value="draft">draft</option>
                <option value="published">published</option>
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold">Body (Markdown)</span>
              <textarea rows={14} value={draft.body} onChange={(event) => setDraft((prev) => ({ ...prev, body: event.target.value }))} placeholder="# Getting started&#10;&#10;Create an API key…" className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs outline-none focus:border-primary" />
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={cancel} className="btn btn-outline">Cancel</button>
            <button type="submit" disabled={busy} className="btn btn-primary">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save page</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="surface flex flex-col items-center justify-center gap-2 p-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No docs pages yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Page</th>
                <th className="px-5 py-3 font-semibold">Section</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Updated</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                  <td className="px-5 py-3">
                    <span className="font-medium">{item.title}</span>
                    <span className="block font-mono text-[11px] text-muted-foreground">/{item.slug}</span>
                  </td>
                  <td className="px-5 py-3"><span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold">{item.section}</span></td>
                  <td className="px-5 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.status === "published" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>{item.status}</span></td>
                  <td className="px-5 py-3 text-muted-foreground">{formatDate(item.updated_at ?? item.created_at)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => startEdit(item)} disabled={openingId === item.id} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50" aria-label="Edit">
                        {openingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                      </button>
                      <button onClick={() => remove(item.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
