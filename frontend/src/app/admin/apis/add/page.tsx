"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { apiFetch } from "@/lib/api";

export default function AdminAddApiPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [created, setCreated] = React.useState<{ slug: string; name: string } | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload: Record<string, unknown> = { name: name.trim(), slug: slug.trim().toLowerCase() };
      if (price.trim()) payload.price_monthly = Number(price);
      const result = await apiFetch<{ slug: string; name: string }>("/v1/admin/apis", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setCreated(result);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not create API");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/apis/all" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to all APIs
      </Link>
      <PageHeader eyebrow="Admin · APIs" title="Add new API" description="Register a custom API product. Built-in engines (YouTube, Instagram, Facebook, TikTok) ship with the server." />

      {created ? (
        <div className="surface flex flex-col items-center gap-3 p-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-accent" />
          <h2 className="font-semibold">API created</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            <span className="font-mono">{created.slug}</span> is registered. Wire its engine in the platform registry to start serving traffic, then enable it on the All APIs page.
          </p>
          <button onClick={() => router.push("/admin/apis/all")} className="btn btn-primary mt-2">Go to All APIs</button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="surface space-y-5 p-6">
          {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <label className="block">
            <span className="text-sm font-semibold">Display name</span>
            <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="SoundCloud" className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Slug</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">Lowercase letters, numbers and hyphens. Used in URLs and logs.</span>
            <input required value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="soundcloud" pattern="[a-z0-9][a-z0-9-]{0,49}" className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Price per month (USD, optional)</span>
            <input type="number" min={0} step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="9.00" className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </label>
          <div className="flex justify-end border-t border-border pt-4">
            <button type="submit" disabled={busy} className="btn btn-primary">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create API
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
