"use client";

import * as React from "react";
import Link from "next/link";
import { Activity, BarChart3, CheckCircle2, Gauge, Loader2, Timer } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { UsageAreaChart } from "@/components/dashboard/charts";
import { apiFetch } from "@/lib/api";

interface UsageData {
  totals: {
    total: number;
    errors: number;
    success_rate: number;
    last_7_days: number;
  };
  days: { date: string; day: string; requests: number; errors: number }[];
  platforms: { platform: string; requests: number; percentage: number }[];
  recent_errors: {
    id: number;
    platform: string;
    url: string | null;
    status: string;
    created_at: string | null;
  }[];
  quota: {
    limit: number;
    used: number;
    remaining: number;
    reset_at: string | null;
  };
}

const platformNames: Record<string, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
};

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatTime = (value: string | null) => {
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

export default function UsageAnalyticsPage() {
  const [data, setData] = React.useState<UsageData | null>(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch<UsageData>("/v1/session/account/usage"));
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load usage analytics");
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
          <Loader2 className="h-4 w-4 animate-spin" /> Loading analytics…
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader eyebrow="Analytics" title="Usage analytics" />
        <div className="surface flex flex-col items-center p-10 text-center">
          <Timer className="h-6 w-6 text-destructive" />
          <p className="mt-3 text-sm text-muted-foreground">{error || "Something went wrong."}</p>
          <button type="button" onClick={load} className="btn btn-primary mt-4">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const { totals, days, platforms, recent_errors: recentErrors, quota } = data;
  const quotaPct =
    quota.limit > 0 ? Math.min(Math.round((quota.used / quota.limit) * 100), 100) : 0;
  const hasChartData = days.some((day) => day.requests > 0);

  return (
    <div>
      <PageHeader
        eyebrow="Analytics"
        title="Usage analytics"
        description="Request volume, success rate, and platform mix from your real API traffic."
        actions={
          <Link href="/dashboard/request-logs" className="btn btn-outline">
            View request logs
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Requests this week"
          value={totals.total.toLocaleString()}
          hint="last 7 days"
          icon={Activity}
          tone="primary"
        />
        <StatCard
          label="Success rate"
          value={`${totals.success_rate}%`}
          hint="last 7 days"
          icon={CheckCircle2}
          tone="accent"
        />
        <StatCard
          label="Failed requests"
          value={totals.errors.toLocaleString()}
          hint="last 7 days"
          icon={Timer}
          tone="rose"
        />
        <StatCard
          label="Quota used"
          value={`${quotaPct}%`}
          hint={`${quota.used.toLocaleString()} of ${quota.limit.toLocaleString()}`}
          icon={Gauge}
          tone="amber"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="surface p-5 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold">Daily requests</h2>
              <p className="text-xs text-muted-foreground">Requests and errors over the last 7 days</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" /> Requests
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-destructive" /> Errors
              </span>
            </div>
          </div>
          {hasChartData ? (
            <>
              <UsageAreaChart data={days} />
              <div className="mt-3 grid grid-cols-4 gap-1 text-center text-[11px] text-muted-foreground sm:grid-cols-7">
                {days.map((day) => (
                  <span key={day.date}>{day.day}</span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">No traffic in this period</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Analytics fill in as soon as you make requests with an API key.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="surface p-5">
            <h2 className="font-semibold">Platform mix</h2>
            {platforms.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No platform traffic yet.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {platforms.map((platform) => {
                  const name = platformNames[platform.platform] ?? platform.platform;
                  return (
                    <div key={platform.platform}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{name}</span>
                        <span className="font-mono text-muted-foreground">
                          {platform.requests.toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${platform.percentage}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs text-muted-foreground">
                          {platform.percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Quota</h2>
              <span className="text-xs text-muted-foreground">
                resets {formatDate(quota.reset_at)}
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold">{quota.used.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              of {quota.limit.toLocaleString()} requests used
            </p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${
                  quotaPct > 85 ? "bg-destructive" : quotaPct > 60 ? "bg-amber-500" : "bg-primary"
                }`}
                style={{ width: `${quotaPct}%` }}
              />
            </div>
            <Link href="/dashboard/my-subscription" className="btn btn-outline mt-4 w-full">
              Increase quota
            </Link>
          </div>
        </div>
      </div>

      <div className="surface mt-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              <BarChart3 className="h-4 w-4 text-primary" /> Recent errors
            </h2>
            <p className="text-xs text-muted-foreground">Requests that returned an error</p>
          </div>
          <Link
            href="/dashboard/error-logs"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Full error logs
          </Link>
        </div>
        <div className="overflow-x-auto">
          {recentErrors.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No errors recorded. Nice and clean.
            </div>
          ) : (
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Platform</th>
                  <th className="px-5 py-3 font-semibold">URL</th>
                  <th className="px-5 py-3 font-semibold">When</th>
                  <th className="px-5 py-3 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentErrors.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border/70 last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-5 py-3 font-medium capitalize">{item.platform}</td>
                    <td className="max-w-[320px] truncate px-5 py-3 font-mono text-xs text-muted-foreground">
                      {item.url || "—"}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {formatTime(item.created_at)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                        Error
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
