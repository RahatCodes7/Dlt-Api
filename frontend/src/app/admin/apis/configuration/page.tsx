"use client";

import * as React from "react";
import { Loader2, Save } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { apiFetch } from "@/lib/api";

interface PlatformConfig {
  enabled: boolean;
  timeout_seconds: number;
  retries: number;
  requests_per_minute: number;
}

export default function AdminApiConfigurationPage() {
  const [platforms, setPlatforms] = React.useState<Record<string, PlatformConfig>>({});
  const [drafts, setDrafts] = React.useState<Record<string, PlatformConfig>>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      const data = await apiFetch<{ platforms: Record<string, PlatformConfig> }>("/v1/admin/apis/config");
      setPlatforms(data.platforms);
      setDrafts(data.platforms);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load configuration");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const update = (slug: string, patch: Partial<PlatformConfig>) =>
    setDrafts((prev) => ({ ...prev, [slug]: { ...prev[slug], ...patch } }));

  const save = async (slug: string) => {
    setSaving(slug);
    setError("");
    setNotice("");
    try {
      const draft = drafts[slug];
      const data = await apiFetch<{ platform: string; config: PlatformConfig }>("/v1/admin/apis/config", {
        method: "PUT",
        body: JSON.stringify({
          platform: slug,
          enabled: draft.enabled,
          timeout_seconds: Number(draft.timeout_seconds),
          retries: Number(draft.retries),
          requests_per_minute: Number(draft.requests_per_minute),
        }),
      });
      setPlatforms((prev) => ({ ...prev, [slug]: data.config }));
      setDrafts((prev) => ({ ...prev, [slug]: data.config }));
      setNotice(`${slug} saved.`);
      setTimeout(() => setNotice(""), 2200);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not save configuration");
    } finally {
      setSaving(null);
    }
  };

  const dirty = (slug: string) => JSON.stringify(platforms[slug]) !== JSON.stringify(drafts[slug]);

  return (
    <div>
      <PageHeader eyebrow="Admin · APIs" title="API configuration" description="Per-platform timeouts, retries, rate limits, and availability. Enforced by the API gateway." />

      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {notice && <div className="mb-4 rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm text-accent">{notice}</div>}

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {Object.entries(drafts).map(([slug, config]) => (
            <div key={slug} className="surface space-y-4 p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold capitalize">{slug}</h2>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(event) => update(slug, { enabled: event.target.checked })}
                    className="h-4 w-4 accent-[var(--color-primary)]"
                  />
                  Enabled
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className="text-xs font-semibold text-muted-foreground">Timeout (s)</span>
                  <input
                    type="number"
                    min={10}
                    max={3600}
                    value={config.timeout_seconds}
                    onChange={(event) => update(slug, { timeout_seconds: Number(event.target.value) })}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-muted-foreground">Retries (1–5)</span>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={config.retries}
                    onChange={(event) => update(slug, { retries: Number(event.target.value) })}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-muted-foreground">Req/min (0 = gateway default)</span>
                  <input
                    type="number"
                    min={0}
                    value={config.requests_per_minute}
                    onChange={(event) => update(slug, { requests_per_minute: Number(event.target.value) })}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </label>
              </div>
              <div className="flex justify-end border-t border-border pt-3">
                <button onClick={() => save(slug)} disabled={!dirty(slug) || saving === slug} className="btn btn-primary disabled:opacity-50">
                  {saving === slug ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save {slug}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
