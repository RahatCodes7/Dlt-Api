import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Clock, Layers, Link as LinkIcon, Zap } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { platforms } from "@/lib/content";

const entitlements: Record<string, { plan: string; used: number; quota: number; status: "Active" | "Expired" }> = {
  youtube: { plan: "Starter", used: 4230, quota: 5000, status: "Active" },
  instagram: { plan: "Free", used: 89, quota: 100, status: "Active" },
  facebook: { plan: "Starter", used: 0, quota: 5000, status: "Expired" },
  tiktok: { plan: "Free", used: 12, quota: 100, status: "Active" },
};

export default function MyAPIsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Integrations"
        title="My APIs"
        description="Every platform you have access to, with live quota and subscription state."
        actions={
          <Link href="/dashboard/pricing-plans" className="btn btn-primary">
            <Zap className="h-4 w-4" /> Upgrade plan
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Enabled APIs" value="4" hint="all platforms" icon={Layers} tone="primary" />
        <StatCard label="Active subscriptions" value="3" hint="1 expired" icon={CheckCircle2} tone="accent" />
        <StatCard label="Requests this month" value="4,331" hint="of 10,200" icon={Zap} tone="blue" />
        <StatCard label="Next renewal" value="Oct 15" hint="Starter plan" icon={Clock} tone="amber" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {platforms.map((platform) => {
          const ent = entitlements[platform.slug];
          const pct = Math.round((ent.used / ent.quota) * 100);
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
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    ent.status === "Active"
                      ? "bg-accent/10 text-accent"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {ent.status}
                </span>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{ent.plan} plan</span>
                  <span className="font-mono">
                    {ent.used.toLocaleString()} / {ent.quota.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${
                      pct > 85 ? "bg-destructive" : pct > 60 ? "bg-amber-500" : "bg-primary"
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
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
          <h2 className="font-semibold">All subscriptions</h2>
          <p className="text-xs text-muted-foreground">Platform, plan, usage, and renewal date.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-semibold">API</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Plan</th>
                <th className="px-5 py-3 font-semibold">Requests</th>
                <th className="px-5 py-3 font-semibold">Renews</th>
                <th className="px-5 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {platforms.map((platform) => {
                const ent = entitlements[platform.slug];
                return (
                  <tr key={platform.slug} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3 font-medium">{platform.name}</td>
                    <td className={`px-5 py-3 text-xs font-semibold ${ent.status === "Active" ? "text-accent" : "text-destructive"}`}>
                      {ent.status}
                    </td>
                    <td className="px-5 py-3">{ent.plan}</td>
                    <td className="px-5 py-3 font-mono text-xs">{ent.used.toLocaleString()}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {ent.status === "Active" ? "Oct 15, 2026" : "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={ent.status === "Active" ? "/dashboard/api-keys" : "/dashboard/pricing-plans"}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        {ent.status === "Active" ? "Manage" : "Renew"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
