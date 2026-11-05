"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Clock, Layers, Link as LinkIcon, Loader2, Zap } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { platforms } from "@/lib/content";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface OverviewData {
  user: { plan: string | null };
  quota: { limit: number; used: number; remaining: number; reset_at: string | null };
  usage: { total: number; errors: number; success_rate: number; last_7_days: number };
  platforms: { platform: string; requests: number; percentage: number }[];
}

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function MyAPIsPage() {
  const [data, setData] = React.useState<OverviewData | null>(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch<OverviewData>("/v1/session/account/overview"));
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load your APIs");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your APIs…
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader eyebrow="Integrations" title="My APIs" />
        <div className="surface flex flex-col items-center p-10 text-center">
          <p className="text-sm text-muted-foreground">{error || "Something went wrong."}</p>
          <button type="button" onClick={load} className="btn btn-primary mt-4">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const { quota, usage, platforms: usageByPlatform } = data;
  const quotaPct =
    quota.limit > 0 ? Math.min(Math.round((quota.used / quota.limit) * 100), 100) : 0;
  const usageMap = new Map(usageByPlatform.map((item) => [item.platform, item]));
  const enabled = quota.limit > 0;

  return (
    <div>
      <PageHeader
        eyebrow="Integrations"
        title="My APIs"
        description="Every platform available on your plan, with live usage for this billing period."
        actions={
          <Link href="/dashboard/pricing-plans" className="btn btn-primary">
            <Zap className="h-4 w-4" /> Upgrade plan
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Enabled APIs"
          value={enabled ? String(platforms.length) : "0"}
          hint={data.user.plan ?? "Free"}
          icon={Layers}
          tone="primary"
        />
        <StatCard
          label="Requests this period"
          value={quota.used.toLocaleString()}
          hint={`of ${quota.limit.toLocaleString()}`}
          icon={Zap}
          tone="blue"
        />
        <StatCard
          label="Success rate"
          value={`${usage.success_rate}%`}
          hint="last 7 days"
          icon={CheckCircle2}
          tone="accent"
        />
        <StatCard
          label="Quota resets"
          value={formatDate(quota.reset_at)}
          hint={`${quota.remaining.toLocaleString()} remaining`}
          icon={Clock}
          tone="amber"
        />
      </div>

      <div className="surface mt-4 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Monthly quota</span>
          <span className="font-semibold">
            {quota.used.toLocaleString()} / {quota.limit.toLocaleString()}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full",
              quotaPct > 85 ? "bg-destructive" : quotaPct > 60 ? "bg-amber-500" : "bg-primary",
            )}
            style={{ width: `${quotaPct}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {platforms.map((platform) => {
          const used = usageMap.get(platform.slug)?.requests ?? 0;
          return (
            <div key={platform.slug} className="surface flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${platform.chip}`}>
                    <platform.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-semibold">{platform.name}</h2>
                    <p className="text-xs text-muted-foreground">{platform.description}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    enabled
                      ? "bg-accent/10 text-accent"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {enabled ? "Active" : "No plan"}
                </span>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{data.user.plan ?? "Free"} plan</span>
                  <span className="font-mono">{used.toLocaleString()} requests (7d)</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-4">
                <Link
                  href={`/apis/${platform.slug}`}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  View endpoints
                </Link>
                <Link
                  href="/dashboard/api-keys"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  <LinkIcon className="h-3.5 w-3.5" /> Manage key
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="surface mt-4 overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold">Platform usage</h2>
          <p className="text-xs text-muted-foreground">
            Requests per platform over the last 7 days.
          </p>
        </div>
        {usageByPlatform.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No requests yet. Create an API key and send your first request.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">API</th>
                  <th className="px-5 py-3 font-semibold">Requests</th>
                  <th className="px-5 py-3 font-semibold">Share</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {usageByPlatform.map((row) => {
                  const meta = platforms.find((platform) => platform.slug === row.platform);
                  return (
                    <tr
                      key={row.platform}
                      className="border-b border-border/70 last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-5 py-3 font-medium">{meta?.name ?? row.platform}</td>
                      <td className="px-5 py-3 font-mono text-xs">
                        {row.requests.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{row.percentage}%</td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href="/dashboard/usage-analytics"
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Analytics
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
