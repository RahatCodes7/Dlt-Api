"use client";

import * as React from "react";
import { Activity, CheckCircle2, AlertTriangle, Loader2, RefreshCw, Server } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface PlatformStatus {
  slug: string;
  name: string;
  status: string;
  requests_24h: number;
  errors_24h: number;
  success_rate: number | null;
}

interface StatusResponse {
  status: string;
  checked_at: string;
  platforms: PlatformStatus[];
}

export default function ApiStatusPage() {
  const [data, setData] = React.useState<StatusResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch<StatusResponse>("/v1/session/account/api-status"));
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load API status");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const platforms = data?.platforms ?? [];
  const operational = platforms.filter((item) => item.status === "operational").length;
  const requests = platforms.reduce((sum, item) => sum + item.requests_24h, 0);
  const errors = platforms.reduce((sum, item) => sum + item.errors_24h, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Developer"
        title="API status"
        description="Current health of every platform you depend on."
        actions={
          <button type="button" onClick={load} className="btn btn-outline">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Overall status"
          value={data ? (data.status === "operational" ? "Operational" : "Degraded") : "—"}
          hint="last 24 hours"
          icon={Activity}
          tone={data?.status === "operational" ? "accent" : "amber"}
        />
        <StatCard label="Platforms" value={`${operational}/${platforms.length || 0}`} hint="operational" icon={Server} tone="primary" />
        <StatCard label="Requests" value={requests.toLocaleString()} hint="last 24 hours" icon={Activity} tone="blue" />
        <StatCard label="Errors" value={errors.toLocaleString()} hint="last 24 hours" icon={AlertTriangle} tone="rose" />
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-4 flex min-h-[30vh] items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking platform health…
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {platforms.map((platform) => {
            const healthy = platform.status === "operational";
            return (
              <div key={platform.slug} className="surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold capitalize">{platform.name}</h2>
                    <p className="text-xs text-muted-foreground">24-hour rolling window</p>
                  </div>
                  <span
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      healthy ? "bg-accent/10 text-accent" : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    )}
                  >
                    {healthy ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                    {healthy ? "Operational" : "Degraded"}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-muted/50 px-2 py-2">
                    <p className="text-lg font-bold">{platform.requests_24h.toLocaleString()}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Requests</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-2 py-2">
                    <p className="text-lg font-bold">{platform.errors_24h.toLocaleString()}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Errors</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-2 py-2">
                    <p className="text-lg font-bold">
                      {platform.success_rate === null ? "—" : `${platform.success_rate}%`}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Success</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data && (
        <p className="mt-4 text-xs text-muted-foreground">
          Last checked {new Date(data.checked_at).toLocaleString("en-US")}.
        </p>
      )}
    </div>
  );
}
