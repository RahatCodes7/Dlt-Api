import Link from "next/link";
import { Activity, BarChart3, CheckCircle2, Gauge, Timer } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { UsageAreaChart } from "@/components/dashboard/charts";
import { usageData } from "@/lib/usage";

const platformUsage = [
  { name: "YouTube", requests: 1940, pct: 45, bar: "bg-red-500" },
  { name: "Instagram", requests: 1294, pct: 30, bar: "bg-pink-500" },
  { name: "Facebook", requests: 647, pct: 15, bar: "bg-blue-500" },
  { name: "TikTok", requests: 431, pct: 10, bar: "bg-foreground" },
];

const endpoints = [
  { path: "/v1/dlt/youtube/download", calls: 1820, latency: "912ms", success: "97.4%" },
  { path: "/v1/dlt/instagram/info", calls: 1104, latency: "184ms", success: "99.1%" },
  { path: "/v1/dlt/youtube/info", calls: 842, latency: "142ms", success: "99.6%" },
  { path: "/v1/dlt/tiktok/download", calls: 431, latency: "1.2s", success: "94.8%" },
  { path: "/v1/dlt/facebook/info", calls: 115, latency: "368ms", success: "98.2%" },
];

const weekdays = usageData.map((day) => day.day);
const weekTotal = usageData.reduce((sum, day) => sum + day.requests, 0);

export default function UsageAnalyticsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Analytics"
        title="Usage analytics"
        description="Request volume, latency, and success rate across every platform you use."
        actions={
          <Link href="/dashboard/request-logs" className="btn btn-outline">
            View request logs
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Requests this week" value={weekTotal.toLocaleString()} hint="+18.2% vs last week" change={{ value: "18.2%", positive: true }} icon={Activity} tone="primary" />
        <StatCard label="Success rate" value="98.4%" hint="last 30 days" change={{ value: "0.6%", positive: true }} icon={CheckCircle2} tone="accent" />
        <StatCard label="Median latency" value="186ms" hint="info endpoints" change={{ value: "12ms", positive: true }} icon={Timer} tone="blue" />
        <StatCard label="Quota used" value="84%" hint="4,230 of 5,000" icon={Gauge} tone="amber" />
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
          <UsageAreaChart />
          <div className="mt-3 grid grid-cols-4 gap-1 text-center text-[11px] text-muted-foreground sm:grid-cols-7">
            {weekdays.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="surface p-5">
            <h2 className="font-semibold">Platform mix</h2>
            <div className="mt-4 space-y-4">
              {platformUsage.map((platform) => (
                <div key={platform.name}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{platform.name}</span>
                    <span className="font-mono text-muted-foreground">{platform.requests.toLocaleString()}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${platform.bar}`} style={{ width: `${platform.pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-xs text-muted-foreground">{platform.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Quota</h2>
              <span className="text-xs text-muted-foreground">resets in 12 days</span>
            </div>
            <p className="mt-3 text-3xl font-bold">4,230</p>
            <p className="text-xs text-muted-foreground">of 5,000 requests used</p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[84%] rounded-full bg-amber-500" />
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
              <BarChart3 className="h-4 w-4 text-primary" /> Top endpoints
            </h2>
            <p className="text-xs text-muted-foreground">Volume, latency, and success rate this month</p>
          </div>
          <Link href="/dashboard/request-logs" className="text-xs font-semibold text-primary hover:underline">
            Full logs
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Endpoint</th>
                <th className="px-5 py-3 font-semibold">Calls</th>
                <th className="px-5 py-3 font-semibold">Avg latency</th>
                <th className="px-5 py-3 font-semibold">Success</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {endpoints.map((endpoint) => (
                <tr key={endpoint.path} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                  <td className="px-5 py-3 font-mono text-xs">{endpoint.path}</td>
                  <td className="px-5 py-3 font-mono text-xs">{endpoint.calls.toLocaleString()}</td>
                  <td className="px-5 py-3 text-muted-foreground">{endpoint.latency}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
                      {endpoint.success}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/dashboard/api-playground?endpoint=${encodeURIComponent(endpoint.path)}`}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Test
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
