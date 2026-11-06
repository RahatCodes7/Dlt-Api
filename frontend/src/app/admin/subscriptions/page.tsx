"use client";

import * as React from "react";
import { Loader2, User } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { apiFetch } from "@/lib/api";

interface Subscription {
  id: number;
  user_id: number;
  user_email: string;
  plan: { id: number; name: string; monthly_requests: number; price: number | null };
  status: string;
  start: string;
  end: string | null;
  auto_renew: boolean;
}

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSubscriptions(await apiFetch<Subscription[]>("/v1/admin/subscriptions"));
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load subscriptions");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading subscriptions…
        </span>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Admin · Billing"
        title="Subscriptions"
        description="Every active, pending, and cancelled subscription."
      />

      {error && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3 font-semibold">Customer</th>
              <th className="px-5 py-3 font-semibold">Plan</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Starts</th>
              <th className="px-5 py-3 font-semibold text-right">Renews</th>
              <th className="px-5 py-3 font-semibold text-right">Auto-renew</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                  No subscriptions found.
                </td>
              </tr>
            ) : (
              subscriptions.map((sub) => (
                <tr key={sub.id} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{sub.user_email}</p>
                        <p className="text-xs text-muted-foreground">ID #{sub.user_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium">{sub.plan.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {sub.plan.monthly_requests.toLocaleString()} requests/mo
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        sub.status === "active" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {formatDate(sub.start)}
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                    {formatDate(sub.end)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className={`text-xs font-semibold ${sub.auto_renew ? "text-accent" : "text-muted-foreground"}`}>
                      {sub.auto_renew ? "On" : "Off"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
