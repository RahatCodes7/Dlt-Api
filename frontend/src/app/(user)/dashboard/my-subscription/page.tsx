import Link from "next/link";
import { CheckCircle2, CreditCard, Download, Gauge, Receipt, Zap } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { plans } from "@/lib/content";
import { cn } from "@/lib/utils";

const invoices = [
  { id: "INV-2026-0912", period: "Sep 15 – Oct 14, 2026", total: "$9.00", status: "Paid" },
  { id: "INV-2026-0812", period: "Aug 15 – Sep 14, 2026", total: "$9.00", status: "Paid" },
  { id: "INV-2026-0712", period: "Jul 15 – Aug 14, 2026", total: "$9.00", status: "Paid" },
];

export default function MySubscriptionPage() {
  const used = 4230;
  const quota = 5000;
  const pct = Math.round((used / quota) * 100);

  return (
    <div>
      <PageHeader
        eyebrow="Billing"
        title="My subscription"
        description="Review your plan, usage, and billing history — upgrade or cancel at any time."
        actions={
          <Link href="/dashboard/pricing-plans" className="btn btn-primary">
            <Zap className="h-4 w-4" /> Change plan
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Current plan" value="Starter" hint="$9 / month" icon={CreditCard} tone="primary" />
        <StatCard label="Requests used" value={`${used.toLocaleString()}`} hint={`of ${quota.toLocaleString()}`} icon={Gauge} tone="amber" />
        <StatCard label="Next invoice" value="$9.00" hint="Oct 15, 2026" icon={Receipt} tone="blue" />
        <StatCard label="Status" value="Active" hint="auto-renews" icon={CheckCircle2} tone="accent" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="surface p-6 lg:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                S
              </span>
              <div>
                <h2 className="text-lg font-bold">Starter plan</h2>
                <p className="text-sm text-muted-foreground">$9 / month · renews Oct 15, 2026</p>
              </div>
            </div>
            <span className="w-fit rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              Active
            </span>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Monthly request allowance</span>
              <span className="font-semibold">
                {used.toLocaleString()} / {quota.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", pct > 85 ? "bg-destructive" : "bg-primary")}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {pct}% used · resets in 12 days. Overages are never billed silently.
            </p>
          </div>

          <dl className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            {[
              ["Billing email", "dev@example.com"],
              ["Payment method", "Visa ending 4242"],
              ["Billing cycle", "Monthly"],
              ["Member since", "Jul 15, 2026"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-5">
            <button type="button" className="btn btn-outline">
              Update payment method
            </button>
            <button type="button" className="btn btn-ghost text-destructive hover:bg-destructive/10">
              Cancel subscription
            </button>
          </div>
        </div>

        <div className="surface p-6">
          <h2 className="font-semibold">Included in Starter</h2>
          <ul className="mt-4 space-y-2.5">
            {["All 4 platforms", "Priority rate limits", "Usage analytics", "Email support"].map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {feature}
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            Need more volume? Pro includes 25,000 requests, proxy rotation, and priority support.
          </div>
          <Link href="/dashboard/pricing-plans" className="btn btn-primary mt-4 w-full">
            Compare plans
          </Link>
        </div>
      </div>

      <div className="surface mt-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-semibold">Billing history</h2>
            <p className="text-xs text-muted-foreground">Receipts for every charge.</p>
          </div>
          <Link href="/dashboard/invoices" className="text-xs font-semibold text-primary hover:underline">
            All invoices
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Invoice</th>
                <th className="px-5 py-3 font-semibold">Period</th>
                <th className="px-5 py-3 font-semibold">Total</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                  <td className="px-5 py-3 font-mono text-xs">{invoice.id}</td>
                  <td className="px-5 py-3 text-muted-foreground">{invoice.period}</td>
                  <td className="px-5 py-3 font-medium">{invoice.total}</td>
                  <td className="px-5 py-3 text-xs font-semibold text-accent">{invoice.status}</td>
                  <td className="px-5 py-3 text-right">
                    <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                      <Download className="h-3.5 w-3.5" /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold">Switch plan</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Changes apply immediately and are prorated against your current cycle.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const current = plan.name === "Starter";
            return (
              <div
                key={plan.name}
                className={cn(
                  "surface flex flex-col p-5",
                  current && "border-primary ring-1 ring-primary",
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{plan.name}</h3>
                  {current && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                      Current
                    </span>
                  )}
                </div>
                <p className="mt-2 text-2xl font-bold">
                  {plan.price === null ? "Custom" : `$${plan.price}`}
                  {plan.price !== null && (
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{plan.requests}</p>
                <Link
                  href={current ? "/dashboard/pricing-plans" : plan.href}
                  className={cn(
                    "btn mt-4 w-full",
                    current ? "btn-outline" : plan.featured ? "btn-primary" : "btn-outline",
                  )}
                >
                  {current ? "Manage" : plan.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
