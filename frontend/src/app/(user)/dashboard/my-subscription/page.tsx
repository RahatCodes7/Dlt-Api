"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, CreditCard, Gauge, Loader2, Receipt, Zap } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { plans } from "@/lib/content";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SubscriptionData {
  user: { email: string; plan: string | null };
  plan: { id: number; name: string; monthly_requests: number; price: number | null } | null;
  quota: {
    limit: number;
    used: number;
    remaining: number;
    reset_at: string | null;
  };
  subscription: {
    status: string;
    start: string | null;
    end: string | null;
    auto_renew: boolean;
  } | null;
  transactions: {
    id: number;
    amount: number;
    currency: string;
    method: string;
    status: string;
    ref: string | null;
    created_at: string | null;
  }[];
}

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
};

export default function MySubscriptionPage() {
  const [data, setData] = React.useState<SubscriptionData | null>(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch<SubscriptionData>("/v1/session/account/subscription"));
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load your subscription");
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
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your subscription…
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader eyebrow="Billing" title="My subscription" />
        <div className="surface flex flex-col items-center p-10 text-center">
          <p className="text-sm text-muted-foreground">{error || "Something went wrong."}</p>
          <button type="button" onClick={load} className="btn btn-primary mt-4">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const plan = data.plan;
  const { quota, subscription, transactions } = data;
  const planName = plan?.name ?? data.user.plan ?? "Free";
  const price = plan?.price ?? 0;
  const pct = quota.limit > 0 ? Math.min(Math.round((quota.used / quota.limit) * 100), 100) : 0;
  const status = subscription?.status ?? "active";

  return (
    <div>
      <PageHeader
        eyebrow="Billing"
        title="My subscription"
        description="Your current plan, quota, and payment history."
        actions={
          <Link href="/dashboard/pricing-plans" className="btn btn-primary">
            <Zap className="h-4 w-4" /> Compare plans
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Current plan"
          value={planName}
          hint={price > 0 ? `$${price} / month` : "No charge"}
          icon={CreditCard}
          tone="primary"
        />
        <StatCard
          label="Requests used"
          value={quota.used.toLocaleString()}
          hint={`of ${quota.limit.toLocaleString()}`}
          icon={Gauge}
          tone="amber"
        />
        <StatCard
          label="Quota resets"
          value={formatDate(quota.reset_at)}
          hint={`${quota.remaining.toLocaleString()} remaining`}
          icon={Receipt}
          tone="blue"
        />
        <StatCard
          label="Status"
          value={status.charAt(0).toUpperCase() + status.slice(1)}
          hint={subscription?.auto_renew ? "auto-renews" : "manual renewal"}
          icon={CheckCircle2}
          tone="accent"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="surface p-6 lg:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                {planName.charAt(0).toUpperCase()}
              </span>
              <div>
                <h2 className="text-lg font-bold">{planName} plan</h2>
                <p className="text-sm text-muted-foreground">
                  {price > 0 ? `$${price} / month` : "Free"} ·{" "}
                  {subscription?.end ? `renews ${formatDate(subscription.end)}` : "no renewal date"}
                </p>
              </div>
            </div>
            <span className="w-fit rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold capitalize text-accent">
              {status}
            </span>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Monthly request allowance</span>
              <span className="font-semibold">
                {quota.used.toLocaleString()} / {quota.limit.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", pct > 85 ? "bg-destructive" : "bg-primary")}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {pct}% used · resets {formatDate(quota.reset_at)}. Overages are never billed silently.
            </p>
          </div>

          <dl className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            {[
              ["Billing email", data.user.email],
              ["Billing cycle", "Monthly"],
              ["Started", subscription ? formatDate(subscription.start) : "—"],
              ["Auto renew", subscription?.auto_renew ? "On" : "Off"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-5">
            <Link href="/dashboard/pricing-plans" className="btn btn-outline">
              View available plans
            </Link>
            <Link href="/contact" className="btn btn-ghost">
              Contact billing
            </Link>
          </div>
        </div>

        <div className="surface p-6">
          <h2 className="font-semibold">Included in {planName}</h2>
          <ul className="mt-4 space-y-2.5">
            {[
              "All 4 platforms",
              `${quota.limit.toLocaleString()} requests per month`,
              "Usage analytics and logs",
              "Email support",
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {feature}
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            Need more volume? Compare plans to see higher request allowances.
          </div>
          <Link href="/dashboard/pricing-plans" className="btn btn-primary mt-4 w-full">
            Compare plans
          </Link>
        </div>
      </div>

      <div className="surface mt-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-semibold">Payment history</h2>
            <p className="text-xs text-muted-foreground">Transactions recorded on your account.</p>
          </div>
          <Link
            href="/dashboard/transactions"
            className="text-xs font-semibold text-primary hover:underline"
          >
            All transactions
          </Link>
        </div>
        {transactions.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No payments recorded yet. Your plan does not require a payment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Reference</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Method</th>
                  <th className="px-5 py-3 font-semibold">Total</th>
                  <th className="px-5 py-3 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-border/70 last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-5 py-3 font-mono text-xs">{tx.ref || `#${tx.id}`}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {formatDate(tx.created_at)}
                    </td>
                    <td className="px-5 py-3 capitalize">{tx.method}</td>
                    <td className="px-5 py-3 font-medium">
                      {formatMoney(tx.amount, tx.currency)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          tx.status === "completed"
                            ? "bg-accent/10 text-accent"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                        )}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold">Available plans</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Compare request allowances before choosing a plan.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((item) => {
            const current = item.name.toLowerCase() === planName.toLowerCase();
            return (
              <div
                key={item.name}
                className={cn(
                  "surface flex flex-col p-5",
                  current && "border-primary ring-1 ring-primary",
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{item.name}</h3>
                  {current && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                      Current
                    </span>
                  )}
                </div>
                <p className="mt-2 text-2xl font-bold">
                  {item.price === null ? "Custom" : `$${item.price}`}
                  {item.price !== null && (
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{item.requests}</p>
                <Link
                  href={item.href}
                  className={cn(
                    "btn mt-4 w-full",
                    item.featured ? "btn-primary" : "btn-outline",
                  )}
                >
                  {current ? "View plan" : item.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
