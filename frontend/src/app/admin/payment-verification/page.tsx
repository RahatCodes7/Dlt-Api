"use client";

import * as React from "react";
import { CheckCircle2, Loader2, ShieldQuestion, XCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { apiFetch } from "@/lib/api";

interface PendingTx {
  id: number;
  user_email: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  ref: string | null;
  created_at: string | null;
}

const formatDateTime = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

export default function AdminPaymentVerificationPage() {
  const [items, setItems] = React.useState<PendingTx[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    try {
      const data = await apiFetch<{ items: PendingTx[] }>("/v1/admin/transactions?status=pending&page=1&page_size=50");
      setItems(data.items);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load pending payments");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const decide = async (id: number, next: "completed" | "failed") => {
    setBusy(id);
    setError("");
    try {
      await apiFetch(`/v1/admin/transactions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not update payment");
    } finally {
      setBusy(null);
    }
  };

  const pendingTotal = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div>
      <PageHeader eyebrow="Admin · Finance" title="Payment verification" description="Manually review bank transfers and flagged payments before marking them completed." />

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <StatCard label="Pending payments" value={String(items.length)} hint="Awaiting manual verification" icon={ShieldQuestion} tone="amber" />
        <StatCard label="Pending volume" value={`$${pendingTotal.toFixed(2)}`} hint="Sum of pending transactions" icon={ShieldQuestion} tone="blue" />
      </div>

      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="surface flex flex-col items-center justify-center gap-2 p-12 text-center">
          <CheckCircle2 className="h-10 w-10 text-accent" />
          <h2 className="font-semibold">All caught up</h2>
          <p className="max-w-md text-sm text-muted-foreground">There are no pending payments awaiting verification.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Reference</th>
                <th className="px-5 py-3 font-semibold">Customer</th>
                <th className="px-5 py-3 font-semibold text-right">Amount</th>
                <th className="px-5 py-3 font-semibold">Method</th>
                <th className="px-5 py-3 font-semibold">Received</th>
                <th className="px-5 py-3 font-semibold text-right">Decision</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                  <td className="px-5 py-3 font-mono text-xs">{item.ref ?? `#${item.id}`}</td>
                  <td className="px-5 py-3">{item.user_email}</td>
                  <td className="px-5 py-3 text-right font-mono text-xs">{item.currency} {item.amount.toFixed(2)}</td>
                  <td className="px-5 py-3">{item.method}</td>
                  <td className="px-5 py-3 text-muted-foreground">{formatDateTime(item.created_at)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => decide(item.id, "completed")} disabled={busy === item.id} className="inline-flex items-center gap-1 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/20 disabled:opacity-50">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button onClick={() => decide(item.id, "failed")} disabled={busy === item.id} className="inline-flex items-center gap-1 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 disabled:opacity-50">
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
