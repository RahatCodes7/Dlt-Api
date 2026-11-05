"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  KeyRound,
  Loader2,
  Play,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { UsageAreaChart } from "@/components/dashboard/charts";
import { apiFetch } from "@/lib/api";

interface UsageLogItem {
  id: number;
  platform: string;
  url: string | null;
  status: string;
  created_at: string | null;
}

interface OverviewData {
  user: {
    name: string | null;
    email: string;
    plan: string | null;
    role: string;
  };
  quota: {
    limit: number;
    used: number;
    remaining: number;
    reset_at: string | null;
  };
  keys: { total: number; active: number };
  usage: {
    total: number;
    errors: number;
    success_rate: number;
    last_7_days: number;
  };
  days: { date: string; day: string; requests: number; errors: number }[];
  platforms: { platform: string; requests: number; percentage: number }[];
  recent: UsageLogItem[];
}

const PLATFORM_STYLES: Record<string, { name: string; color: string }> = {
  youtube: { name: "YouTube", color: "bg-red-500" },
  instagram: { name: "Instagram", color: "bg-pink-500" },
  facebook: { name: "Facebook", color: "bg-blue-500" },
  tiktok: { name: "TikTok", color: "bg-foreground" },
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

export default function OverviewPage() {
  const [data, setData] = React.useState<OverviewData | null>(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const overview = await apiFetch<OverviewData>("/v1/session/account/overview");
      setData(overview);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load your dashboard");
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
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your overview…
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader eyebrow="Overview" title="Dashboard" />
        <div className="surface flex flex-col items-center p-10 text-center">
          <XCircle className="h-6 w-6 text-destructive" />
          <p className="mt-3 text-sm text-muted-foreground">{error || "Something went wrong."}</p>
          <button type="button" onClick={load} className="btn btn-primary mt-4">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const { user, quota, keys, usage, days, platforms, recent } = data;
  const firstName = (user.name || user.email.split("@")[0]).split(" ")[0];
  const successful = Math.max(usage.total - usage.errors, 0);
  const hasChartData = days.some((day) => day.requests > 0);
  const hasPlatformData = platforms.length > 0;
  const quotaPct =
    quota.limit > 0 ? Math.min(Math.round((quota.used / quota.limit) * 100), 100) : 0;

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${firstName}`}
        description="Your API activity, quota, and recent requests for the current billing period."
        actions={
          <>
            <Link href="/dashboard/quick-start" className="btn btn-outline">
              Quick start
            </Link>
            <Link href="/dashboard/api-playground" className="btn btn-primary">
              <Play className="h-4 w-4" /> Open playground
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Requests this period"
          value={quota.used.toLocaleString()}
          hint={`of ${quota.limit.toLocaleString()} allowed`}
          icon={Activity}
          tone="primary"
        />
        <StatCard
          label="Successful (7d)"
          value={successful.toLocaleString()}
          hint={`${usage.success_rate}% success rate`}
          icon={CheckCircle2}
          tone="accent"
        />
        <StatCard
          label="Failed (7d)"
          value={usage.errors.toLocaleString()}
          hint="last 7 days"
          icon={XCircle}
          tone="rose"
        />
        <StatCard
          label="Remaining quota"
          value={quota.remaining.toLocaleString()}
          hint={`resets ${formatDate(quota.reset_at)}`}
          icon={Zap}
          tone="amber"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="surface p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Request volume</h2>
              <p className="text-xs text-muted-foreground">Last 7 days · all platforms</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <TrendingUp className="h-3.5 w-3.5" /> {usage.last_7_days.toLocaleString()} requests
            </span>
          </div>
          {hasChartData ? (
            <UsageAreaChart data={days} />
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">No requests yet</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Send your first request from the playground and it will show up here.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Current plan</h2>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                {user.plan ?? "Free"}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {quota.used.toLocaleString()} of {quota.limit.toLocaleString()} requests used
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                style={{ width: `${quotaPct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Resets {formatDate(quota.reset_at)}
            </p>
            <Link href="/dashboard/my-subscription" className="btn btn-outline mt-4 w-full">
              Manage plan
            </Link>
          </div>

          <div className="surface p-5">
            <h2 className="font-semibold">Quick actions</h2>
            <div className="mt-3 space-y-1">
              {[
                { href: "/dashboard/api-keys", icon: KeyRound, label: `Create an API key (${keys.active} active)` },
                { href: "/dashboard/usage-analytics", icon: TrendingUp, label: "View analytics" },
                { href: "/dashboard/support-tickets", icon: Clock, label: "Open a support ticket" },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <action.icon className="h-4 w-4" /> {action.label}
                  <ArrowRight className="ml-auto h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="surface overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-semibold">Recent API activity</h2>
              <p className="text-xs text-muted-foreground">Latest requests from your keys</p>
            </div>
            <Link
              href="/dashboard/request-logs"
              className="text-xs font-semibold text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            {recent.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                No requests yet. Create a key, then call the API or use the playground.
              </div>
            ) : (
              <table className="w-full min-w-[540px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3 font-semibold">Platform</th>
                    <th className="px-5 py-3 font-semibold">URL</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">When</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-border/70 last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-5 py-3 font-medium capitalize">{row.platform}</td>
                      <td className="max-w-[220px] truncate px-5 py-3 font-mono text-xs text-muted-foreground">
                        {row.url || "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            row.status === "success"
                              ? "bg-accent/10 text-accent"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {row.status === "success" ? "Success" : "Error"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                        {formatTime(row.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="surface p-5">
          <h2 className="font-semibold">Platform mix</h2>
          <p className="text-xs text-muted-foreground">Requests by source, last 7 days</p>
          {hasPlatformData ? (
            <div className="mt-4 space-y-4">
              {platforms.map((platform) => {
                const style = PLATFORM_STYLES[platform.platform];
                return (
                  <div key={platform.platform}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-medium capitalize">
                        {style?.name ?? platform.platform}
                      </span>
                      <span className="text-muted-foreground">
                        {platform.requests.toLocaleString()} · {platform.percentage}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${style?.color ?? "bg-primary"}`}
                        style={{ width: `${platform.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">
              Platform usage will appear after your first request.
            </p>
          )}
          <div className="mt-5 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            {keys.total === 0
              ? "Create an API key to start sending requests."
              : `You have ${keys.active} active key${keys.active === 1 ? "" : "s"}. Rotate keys you no longer use.`}
          </div>
        </div>
      </div>
    </div>
  );
}
