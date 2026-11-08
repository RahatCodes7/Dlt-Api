"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Loader2,
  Server,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { UsageAreaChart } from "@/components/dashboard/charts";
import { apiFetch } from "@/lib/api";

interface AdminOverview {
  users: { total: number; new_this_month: number };
  subscriptions: { active: number };
  revenue: { month: number };
  requests: {
    today: number;
    last_24h: number;
    failed_24h: number;
    total_logged: number;
    error_rate: number;
  };
  keys: { active: number };
  signups: {
    id: number;
    name: string | null;
    email: string;
    plan: string | null;
    created_at: string | null;
  }[];
  days: { date: string; day: string; requests: number; errors: number }[];
  platforms: string[];
}

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

export default function AdminDashboardPage() {
  const [data, setData] = React.useState<AdminOverview | null>(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch<AdminOverview>("/v1/admin/overview"));
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load the admin overview");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading platform overview…
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader eyebrow="Control center" title="Platform overview" />
        <div className="surface flex flex-col items-center p-10 text-center">
          <p className="text-sm text-muted-foreground">{error || "Something went wrong."}</p>
          <button type="button" onClick={load} className="btn btn-primary mt-4">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const hasChartData = data.days.some((day) => day.requests > 0);

  return (
    <div>
      <PageHeader
        eyebrow="Control center"
        title="Platform overview"
        description="Live snapshot of users, revenue, API traffic, and infrastructure health."
        actions={
          <>
            <Link href="/admin/revenue-analytics" className="btn btn-outline">
              Revenue report
            </Link>
            <Link href="/admin/users/all" className="btn btn-primary">
              <Users className="h-4 w-4" /> Manage users
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total users"
          value={data.users.total.toLocaleString()}
          hint={`+${data.users.new_this_month.toLocaleString()} this month`}
          icon={Users}
          tone="primary"
        />
        <StatCard
          label="Active subscriptions"
          value={data.subscriptions.active.toLocaleString()}
          hint="active plans"
          icon={CreditCard}
          tone="accent"
        />
        <StatCard
          label="Monthly revenue"
          value={money(data.revenue.month)}
          hint="completed payments this month"
          icon={DollarSign}
          tone="blue"
        />
        <StatCard
          label="Failed requests"
          value={`${data.requests.error_rate}%`}
          hint="last 24 hours"
          icon={AlertTriangle}
          tone="rose"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="surface p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Request volume</h2>
              <p className="text-xs text-muted-foreground">All users · last 7 days</p>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {data.requests.total_logged.toLocaleString()} logged
            </span>
          </div>
          {hasChartData ? (
            <UsageAreaChart data={data.days} />
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">No traffic logged yet</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Requests appear here once users start calling the API.
              </p>
            </div>
          )}
        </div>

        <div className="surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Platform engines</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Loaded
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {data.platforms.length === 0 ? (
              <p className="text-sm text-muted-foreground">No platform engines loaded.</p>
            ) : (
              data.platforms.map((platform) => (
                <div key={platform} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <span className="text-sm capitalize">{platform}</span>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">ready</span>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <Server className="mb-1 h-3.5 w-3.5" />
            Engine status is reported by the running API process.
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="surface overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-semibold">New signups</h2>
              <p className="text-xs text-muted-foreground">Most recent accounts</p>
            </div>
            <Link href="/admin/users/all" className="text-xs font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            {data.signups.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                No accounts yet.
              </div>
            ) : (
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3 font-semibold">User</th>
                    <th className="px-5 py-3 font-semibold">Plan</th>
                    <th className="px-5 py-3 font-semibold">Joined</th>
                    <th className="px-5 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.signups.map((item) => (
                    <tr key={item.id} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                      <td className="px-5 py-3">
                        <p className="font-medium">{item.name || item.email.split("@")[0]}</p>
                        <p className="text-xs text-muted-foreground">{item.email}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            item.plan === "Free"
                              ? "bg-muted text-muted-foreground"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {item.plan ?? "Free"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/admin/users/${item.id}`}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="surface p-5">
          <h2 className="font-semibold">Traffic at a glance</h2>
          <div className="mt-4 space-y-4">
            {[
              { label: "Requests today", value: data.requests.today.toLocaleString(), icon: Activity, tone: "text-primary" },
              { label: "Requests (24h)", value: data.requests.last_24h.toLocaleString(), icon: Activity, tone: "text-accent" },
              { label: "Active API keys", value: data.keys.active.toLocaleString(), icon: CheckCircle2, tone: "text-blue-500" },
              { label: "Errors (24h)", value: data.requests.failed_24h.toLocaleString(), icon: AlertTriangle, tone: "text-rose-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className={`h-4 w-4 ${item.tone}`} />
                  {item.label}
                </span>
                <span className="text-sm font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
          <Link href="/admin/apis/monitoring" className="btn btn-outline mt-5 w-full">
            API monitoring <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
