"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Play, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { apiFetch } from "@/lib/api";

interface Plan {
  id: number;
  name: string;
  monthly_requests: number;
  price: number | null;
  active: boolean;
}

interface Subscription {
  id: number;
  plan: Plan;
  status: string;
  start: string;
  end: string | null;
  auto_renew: boolean;
}

export default function PricingPlansPage() {
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [subscription, setSubscription] = React.useState<Subscription | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [updating, setUpdating] = React.useState(false);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [plansData, subData] = await Promise.all([
        apiFetch<Plan[]>("/v1/dlt/plans"),
        apiFetch<{ plan: Plan | null; subscription: Subscription | null }>("/v1/session/account/subscription"),
      ]);
      setPlans(plansData.filter((p) => p.active));
      setSubscription(subData.subscription ?? null);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load plans");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const currentPlan = subscription?.plan;
  const isCurrent = (plan: Plan) => currentPlan?.id === plan.id;

  const switchPlan = async (plan: Plan) => {
    if (isCurrent(plan)) return;
    setUpdating(true);
    try {
      await apiFetch(`/v1/session/account/subscription`, {
        method: "PATCH",
        body: JSON.stringify({ plan_id: plan.id }),
      });
      setSubscription((prev) => (prev ? { ...prev, plan } : prev));
      setError("");
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not change plan");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading plans…
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader eyebrow="Pricing" title="Pricing plans" />
        <div className="surface flex flex-col items-center p-10 text-center">
          <ShieldCheck className="h-6 w-6 text-destructive" />
          <p className="mt-3 text-sm text-muted-foreground">{error}</p>
          <button type="button" onClick={loadData} className="btn btn-primary mt-4">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Billing"
        title="Pricing plans"
        description="Compare allowances and change your subscription tier."
        actions={
          <Link href="/dashboard/quick-start" className="btn btn-outline">
            Quick start
          </Link>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const active = isCurrent(plan);
          const monthly = plan.price != null ? `$${plan.price.toFixed(2)}/mo` : "Free";
          return (
            <div
              key={plan.id}
              className={`surface rounded-xl border p-6 relative transition-all hover:border-primary/50 ${active ? "border-primary bg-primary/5" : "border-border"}`}
            >
              {active && (
                <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary">
                  <ShieldCheck className="h-3 w-3" /> Current plan
                </div>
              )}
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="font-semibold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {plan.monthly_requests.toLocaleString()} requests/month
                  </p>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-xl font-bold">{monthly}</span>
                </div>
                <div className="mt-auto">
                  {active ? (
                    <button
                      disabled
                      className="btn btn-outline w-full text-sm text-muted-foreground hover:bg-transparent"
                    >
                      Current plan
                    </button>
                  ) : (
                    <button
                      onClick={() => switchPlan(plan)}
                      disabled={updating}
                      className={`btn w-full text-sm ${active ? "btn-primary" : "btn-outline"}`}
                    >
                      {updating ? "Switching…" : `Switch to ${plan.name}`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-xl border border-border bg-muted/40 p-6">
        <h3 className="font-semibold mb-2">Your current subscription</h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Plan</p>
            <p className="font-medium">{currentPlan?.name ?? "Free"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className={`font-medium ${subscription?.status === "active" ? "text-accent" : "text-muted-foreground"}`}>
              {subscription?.status ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Renews</p>
            <p className="font-medium">
              {subscription?.end ? new Date(subscription.end).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Play className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Need a custom plan? <Link href="/dashboard/support-tickets" className="underline">Contact support</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
