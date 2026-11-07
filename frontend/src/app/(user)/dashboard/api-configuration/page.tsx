"use client";

import * as React from "react";
import { CheckCircle2, Loader2, Save, Settings2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { apiFetch } from "@/lib/api";

interface ApiConfiguration {
  default_format: string;
  default_quality: string;
  default_platform: string | null;
  timeout_seconds: number;
  include_metadata: boolean;
  retry_failed: boolean;
}

const FORMATS = ["mp4", "mp3", "m4a"];
const QUALITIES = ["best", "2160p", "1080p", "720p", "480p", "360p"];
const PLATFORMS = ["", "youtube", "instagram", "facebook", "tiktok"];

export default function ApiConfigurationPage() {
  const [config, setConfig] = React.useState<ApiConfiguration | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    apiFetch<ApiConfiguration>("/v1/session/account/api-configuration")
      .then((data) => {
        if (active) setConfig(data);
      })
      .catch((exc) => {
        if (active) setError(exc instanceof Error ? exc.message : "Could not load configuration");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const update = <K extends keyof ApiConfiguration>(key: K, value: ApiConfiguration[K]) => {
    setConfig((current) => (current ? { ...current, [key]: value } : current));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!config || saving) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const updated = await apiFetch<ApiConfiguration>(
        "/v1/session/account/api-configuration",
        { method: "PUT", body: JSON.stringify(config) },
      );
      setConfig(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2400);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not save configuration");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading configuration…
        </span>
      </div>
    );
  }

  if (!config) {
    return (
      <div>
        <PageHeader eyebrow="API" title="API configuration" />
        <div className="surface p-10 text-center text-sm text-muted-foreground">
          {error || "Could not load configuration."}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="API"
        title="API configuration"
        description="Defaults applied to every request made with your keys."
        actions={
          <button type="submit" form="api-config-form" className="btn btn-primary" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save configuration"}
          </button>
        }
      />

      {saved && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm text-accent">
          <CheckCircle2 className="h-4 w-4" /> Configuration saved.
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <form id="api-config-form" onSubmit={save} className="grid gap-4 lg:grid-cols-3">
        <div className="surface space-y-5 p-6 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Request defaults</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Default format</span>
              <select
                value={config.default_format}
                onChange={(event) => update("default_format", event.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                {FORMATS.map((format) => (
                  <option key={format} value={format}>
                    {format}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium">Default quality</span>
              <select
                value={config.default_quality}
                onChange={(event) => update("default_quality", event.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                {QUALITIES.map((quality) => (
                  <option key={quality} value={quality}>
                    {quality}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium">Default platform</span>
              <select
                value={config.default_platform ?? ""}
                onChange={(event) => update("default_platform", event.target.value || null)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                {PLATFORMS.map((platform) => (
                  <option key={platform || "auto"} value={platform}>
                    {platform ? platform : "Auto-detect"}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium">Upstream timeout (seconds)</span>
              <input
                type="number"
                min={10}
                max={600}
                value={config.timeout_seconds}
                onChange={(event) => update("timeout_seconds", Number(event.target.value))}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </label>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={config.include_metadata}
                onChange={(event) => update("include_metadata", event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input"
              />
              <span>
                <span className="font-medium">Include metadata in responses</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Return title, duration, and author fields alongside download URLs.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={config.retry_failed}
                onChange={(event) => update("retry_failed", event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input"
              />
              <span>
                <span className="font-medium">Retry failed upstream fetches</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Retry once through a proxy when the primary request fails.
                </span>
              </span>
            </label>
          </div>
        </div>

        <div className="surface p-6">
          <h2 className="font-semibold">How these defaults work</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Applied when a request omits its own format or quality.</li>
            <li>Explicit values in a request always win over these defaults.</li>
            <li>Saved to your account and used by the playground.</li>
          </ul>
        </div>
      </form>
    </div>
  );
}
