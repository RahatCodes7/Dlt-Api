import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  KeyRound,
  Play,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { UsageAreaChart } from "@/components/dashboard/charts";

const activity: { platform: string; endpoint: string; status: number; time: string; latency: string }[] = [];

const platformMix = [
  { name: "YouTube", pct: 45, color: "bg-red-500" },
  { name: "Instagram", pct: 30, color: "bg-pink-500" },
  { name: "Facebook", pct: 15, color: "bg-blue-500" },
  { name: "TikTok", pct: 10, color: "bg-foreground" },
];

export default function OverviewPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Developer dashboard"
        title="Welcome back, Developer"
        description="Here is your API activity across all platforms for the current billing period."
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
          label="Total requests"
          value="12,450"
          hint="of 25,000 this period"
          change={{ value: "12.4%", positive: true }}
          icon={Activity}
          tone="primary"
        />
        <StatCard
          label="Successful"
          value="11,892"
          hint="95.5% success rate"
          change={{ value: "1.8%", positive: true }}
          icon={CheckCircle2}
          tone="accent"
        />
        <StatCard
          label="Failed"
          value="558"
          hint="mostly 429 rate limits"
          change={{ value: "0.6%", positive: false }}
          icon={XCircle}
          tone="rose"
        />
        <StatCard
          label="Remaining quota"
          value="87,550"
          hint="resets in 14 days"
          change={{ value: "health", positive: true }}
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
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
              <TrendingUp className="h-3.5 w-3.5" /> +12.4%
            </span>
          </div>
          <UsageAreaChart />
        </div>

        <div className="space-y-4">
          <div className="surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Current plan</h2>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                Starter
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">4,230 of 5,000 requests used</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[84%] rounded-full bg-gradient-to-r from-primary to-accent" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Resets Oct 15, 2026</p>
            <Link href="/dashboard/my-subscription" className="btn btn-outline mt-4 w-full">
              Manage plan
            </Link>
          </div>

          <div className="surface p-5">
            <h2 className="font-semibold">Quick actions</h2>
            <div className="mt-3 space-y-1">
              {[
                { href: "/dashboard/api-keys", icon: KeyRound, label: "Create an API key" },
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
            <table className="w-full min-w-[540px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Platform</th>
                  <th className="px-5 py-3 font-semibold">Endpoint</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Latency</th>
                  <th className="px-5 py-3 text-right font-semibold">When</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((row) => (
                  <tr
                    key={`${row.platform}-${row.time}`}
                    className="border-b border-border/70 last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-5 py-3 font-medium">{row.platform}</td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      {row.endpoint}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          row.status === 200
                            ? "bg-accent/10 text-accent"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      {row.latency}
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                      {row.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="surface p-5">
          <h2 className="font-semibold">Platform mix</h2>
          <p className="text-xs text-muted-foreground">Requests by source, last 30 days</p>
          <div className="mt-4 space-y-4">
            {platformMix.map((platform) => (
              <div key={platform.name}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium">{platform.name}</span>
                  <span className="text-muted-foreground">{platform.pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${platform.color}`}
                    style={{ width: `${platform.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            YouTube is your most-used platform. Consider caching info responses to cut
            request volume.
          </div>
        </div>
      </div>
    </div>
  );
}
