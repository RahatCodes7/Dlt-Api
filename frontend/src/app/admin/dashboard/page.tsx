import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Server,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { RevenueBarChart } from "@/components/dashboard/charts";

const signups = [
  { name: "Maya Chen", email: "maya@acme.dev", plan: "Starter", time: "12 min ago" },
  { name: "Omar Haddad", email: "omar@ship.it", plan: "Free", time: "48 min ago" },
  { name: "Lena Fischer", email: "lena@studio.co", plan: "Pro", time: "2 hrs ago" },
  { name: "Diego Ruiz", email: "diego@north.io", plan: "Free", time: "4 hrs ago" },
  { name: "Priya Nair", email: "priya@build.dev", plan: "Starter", time: "6 hrs ago" },
];

const services = [
  { name: "API gateway", status: "Operational", latency: "42ms" },
  { name: "Download workers", status: "Operational", latency: "1.1s" },
  { name: "Redis / quota", status: "Operational", latency: "3ms" },
  { name: "Postgres primary", status: "Operational", latency: "6ms" },
];

export default function AdminDashboardPage() {
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
          value="2,847"
          hint="+128 this month"
          change={{ value: "4.7%", positive: true }}
          icon={Users}
          tone="primary"
        />
        <StatCard
          label="Active subscriptions"
          value="612"
          hint="Starter + Pro + Enterprise"
          change={{ value: "3.2%", positive: true }}
          icon={CreditCard}
          tone="accent"
        />
        <StatCard
          label="Monthly revenue"
          value="$8,640"
          hint="MRR, net of refunds"
          change={{ value: "19.8%", positive: true }}
          icon={DollarSign}
          tone="blue"
        />
        <StatCard
          label="Failed requests"
          value="1.2%"
          hint="last 24 hours"
          change={{ value: "0.4%", positive: false }}
          icon={AlertTriangle}
          tone="rose"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="surface p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Revenue trend</h2>
              <p className="text-xs text-muted-foreground">MRR over the last 6 months</p>
            </div>
            <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
              +34% YoY
            </span>
          </div>
          <RevenueBarChart />
        </div>

        <div className="surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">System health</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> All up
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {services.map((service) => (
              <div key={service.name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  <span className="text-sm">{service.name}</span>
                </div>
                <span className="font-mono text-xs text-muted-foreground">{service.latency}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <Server className="mb-1 h-3.5 w-3.5" />
            p95 latency is stable at 418ms. No incidents in the last 7 days.
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
                {signups.map((user) => (
                  <tr key={user.email} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          user.plan === "Free"
                            ? "bg-muted text-muted-foreground"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{user.time}</td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href="/admin/users/1"
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="surface p-5">
          <h2 className="font-semibold">Traffic at a glance</h2>
          <div className="mt-4 space-y-4">
            {[
              { label: "Requests today", value: "184,320", icon: Activity, tone: "text-primary" },
              { label: "Avg response", value: "142 ms", icon: Activity, tone: "text-accent" },
              { label: "Active API keys", value: "1,204", icon: CheckCircle2, tone: "text-blue-500" },
              { label: "Error rate", value: "1.2%", icon: AlertTriangle, tone: "text-rose-500" },
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
