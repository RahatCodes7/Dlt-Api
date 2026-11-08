"use client";

import * as React from "react";
import { Check, HelpCircle, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { apiFetch } from "@/lib/api";

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  position: number;
  published: boolean;
}

const EMPTY: Omit<FaqItem, "id"> = { question: "", answer: "", category: "General", position: 0, published: true };

export default function AdminFaqManagementPage() {
  const [items, setItems] = React.useState<FaqItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [editing, setEditing] = React.useState<number | "new" | null>(null);
  const [draft, setDraft] = React.useState<Omit<FaqItem, "id">>(EMPTY);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const data = await apiFetch<{ items: FaqItem[] }>("/v1/admin/faq");
      setItems(data.items);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load FAQ entries");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const startNew = () => { setDraft(EMPTY); setEditing("new"); setError(""); };
  const startEdit = (item: FaqItem) => { const { id, ...rest } = item; void id; setDraft(rest); setEditing(item.id); setError(""); };
  const cancel = () => setEditing(null);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (editing === "new") {
        await apiFetch("/v1/admin/faq", { method: "POST", body: JSON.stringify(draft) });
      } else if (typeof editing === "number") {
        await apiFetch(`/v1/admin/faq/${editing}`, { method: "PUT", body: JSON.stringify(draft) });
      }
      setEditing(null);
      await load();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not save FAQ entry");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    setError("");
    try {
      await apiFetch(`/v1/admin/faq/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not delete FAQ entry");
    }
  };

  const togglePublished = async (item: FaqItem) => {
    setError("");
    try {
      await apiFetch(`/v1/admin/faq/${item.id}`, {
        method: "PUT",
        body: JSON.stringify({ question: item.question, answer: item.answer, category: item.category, position: item.position, published: !item.published }),
      });
      await load();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not update FAQ entry");
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Admin · Content"
        title="FAQ management"
        description="Answers shown in the public docs. Unpublished items are hidden from the site."
        actions={<button onClick={startNew} className="btn btn-primary"><Plus className="h-4 w-4" /> Add question</button>}
      />

      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {editing !== null && (
        <form onSubmit={save} className="surface mb-5 space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{editing === "new" ? "New FAQ entry" : `Edit entry #${editing}`}</h2>
            <button type="button" onClick={cancel} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Close editor"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold">Question</span>
              <input required value={draft.question} onChange={(event) => setDraft((prev) => ({ ...prev, question: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold">Answer</span>
              <textarea required rows={4} value={draft.answer} onChange={(event) => setDraft((prev) => ({ ...prev, answer: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Category</span>
              <input required value={draft.category} onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))} placeholder="billing" className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Position</span>
              <input type="number" min={0} value={draft.position} onChange={(event) => setDraft((prev) => ({ ...prev, position: Number(event.target.value) }))} className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm md:col-span-2">
              <input type="checkbox" checked={draft.published} onChange={(event) => setDraft((prev) => ({ ...prev, published: event.target.checked }))} className="h-4 w-4 accent-[var(--color-primary)]" />
              Published on the public site
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={cancel} className="btn btn-outline">Cancel</button>
            <button type="submit" disabled={busy} className="btn btn-primary">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save entry</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="surface flex flex-col items-center justify-center gap-2 p-12 text-center">
          <HelpCircle className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No questions yet. Add the first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="surface flex items-start justify-between gap-4 p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{item.question}</h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{item.category}</span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{item.answer}</p>
                <p className="mt-2 text-xs text-muted-foreground">Position #{item.position}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <button onClick={() => togglePublished(item)} className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${item.published ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>
                  {item.published ? "Published" : "Draft"}
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(item)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(item.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
