"use client";

import * as React from "react";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ApiKeyRecord {
  id: number;
  name: string | null;
  platforms: string[];
  status: string;
  last_used: string | null;
  created_at: string;
}

interface ApiKeyCreated extends ApiKeyRecord {
  key: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
};

const formatDate = (value: string | null) => {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const formatPlatforms = (platforms: string[]) =>
  platforms.length
    ? platforms.map((p) => PLATFORM_LABELS[p] ?? p).join(" · ")
    : "All platforms";

export default function APIKeysPage() {
  const [keys, setKeys] = React.useState<ApiKeyRecord[]>([]);
  const [fresh, setFresh] = React.useState<Record<number, string>>({});
  const [revealed, setRevealed] = React.useState<number | null>(null);
  const [copied, setCopied] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const data = await apiFetch<ApiKeyRecord[]>("/v1/session/account/keys");
        if (!active) return;
        setKeys(data);
        setError("");
      } catch (exc) {
        if (!active) return;
        setError(exc instanceof Error ? exc.message : "Could not load API keys");
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, []);

  const createKey = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const created = await apiFetch<ApiKeyCreated>("/v1/session/account/keys", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), platforms: [] }),
      });
      setFresh((current) => ({ ...current, [created.id]: created.key }));
      setKeys((current) => [created, ...current]);
      setName("");
      setCreating(false);
      setRevealed(created.id);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not create key");
    } finally {
      setBusy(false);
    }
  };

  const copy = async (key: ApiKeyRecord) => {
    const value = fresh[key.id];
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key.id);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  const revoke = async (key: ApiKeyRecord) => {
    if (!window.confirm(`Revoke "${key.name || "this key"}"? This cannot be undone.`)) {
      return;
    }
    setBusy(true);
    try {
      await apiFetch(`/v1/session/account/keys/${key.id}`, { method: "DELETE" });
      setKeys((current) => current.filter((item) => item.id !== key.id));
      setFresh((current) => {
        const next = { ...current };
        delete next[key.id];
        return next;
      });
      setError("");
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not revoke key");
    } finally {
      setBusy(false);
    }
  };

  const activeCount = keys.filter((key) => key.status === "active").length;
  const lastCreated = keys.reduce<string | null>(
    (latest, key) => (!latest || key.created_at > latest ? key.created_at : latest),
    null,
  );

  return (
    <div>
      <PageHeader
        eyebrow="API access"
        title="API keys"
        description="Create scoped keys, rotate them on a schedule, and revoke access instantly."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setCreating((open) => !open)}>
            <Plus className="h-4 w-4" /> Create key
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active keys" value={String(activeCount)} hint={`${keys.length} total`} icon={KeyRound} tone="primary" />
        <StatCard label="Total keys" value={String(keys.length)} hint="active + revoked" icon={ShieldCheck} tone="blue" />
        <StatCard label="Coverage" value={keys.some((k) => k.platforms.length === 0) ? "All" : `${keys.length}`} hint="platform scope" icon={KeyRound} tone="accent" />
        <StatCard label="Last created" value={lastCreated ? formatDate(lastCreated) : "—"} hint="newest key" icon={ShieldCheck} tone="amber" />
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {creating && (
        <form onSubmit={createKey} className="surface mt-4 flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label htmlFor="key-name" className="text-sm font-medium">
              Key name
            </label>
            <input
              id="key-name"
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Production — web app"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <button type="submit" className="btn btn-primary h-10" disabled={!name.trim() || busy}>
            {busy ? "Generating…" : "Generate key"}
          </button>
          <button type="button" className="btn btn-outline h-10" onClick={() => setCreating(false)}>
            Cancel
          </button>
        </form>
      )}

      <div className="surface mt-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-semibold">Your keys</h2>
            <p className="text-xs text-muted-foreground">Keys are shown once at creation, then masked.</p>
          </div>
        </div>
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">Loading keys…</div>
        ) : keys.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No API keys yet. Create one to start calling the API.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {keys.map((key) => {
              const value = fresh[key.id];
              return (
                <div key={key.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{key.name || "Untitled key"}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          key.status === "active"
                            ? "bg-accent/10 text-accent"
                            : "bg-destructive/10 text-destructive",
                        )}
                      >
                        {key.status === "active" ? "Active" : "Revoked"}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <code className="rounded-md bg-muted px-2 py-1 font-mono text-xs">
                        {value && revealed === key.id ? value : "dl_live_••••••••••••"}
                      </code>
                      <span className="text-xs text-muted-foreground">
                        {formatPlatforms(key.platforms)} · created {formatDate(key.created_at)} · used {formatDate(key.last_used)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => value && setRevealed(revealed === key.id ? null : key.id)}
                      disabled={!value}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={revealed === key.id ? "Hide key" : "Reveal key"}
                    >
                      {revealed === key.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => copy(key)}
                      disabled={!value}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Copy key"
                    >
                      {copied === key.id ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => revoke(key)}
                      disabled={busy}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Revoke
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-medium">Keep keys out of the browser</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Call the API from your backend and keep keys in server-side environment variables.
            Rotate any key that has been exposed in logs, screenshots, or source control.
          </p>
        </div>
      </div>
    </div>
  );
}
