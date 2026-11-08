"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Loader2, Search, Wallet } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { apiFetch } from "@/lib/api";

interface TransactionRow {
  id: number;
  user_id: number;
  user_email: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  ref: string | null;
  created_at: string | null;
}

interface TransactionsResponse {
  items: TransactionRow[];
  total: number;
  page: number;
  pages: number;
  summary: { completed_sum: number; completed_count: number; pending_count: number };
}

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function AdminTransactionsPage() {
  const [data, setData] = React.useState<TransactionsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [method, setMethod] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [updating, setUpdating] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), page_size: "20" });
      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);
      if (method) params.set("method", method);
      setData(await apiFetch<TransactionsResponse>(`/v1/admin/transactions?${params.toString()}`));
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load transactions");
    } finally {
      setLoading(false);
    }
  }, [search, status, method, page]);

  React.useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const setStatusFor = async (id: number, next: string) => {
    setUpdating(id);
    setError("");
    try {
      await apiFetch(`/v1/admin/transactions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      await load();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not update transaction");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Admin · Finance" title="Transactions" description="Payments, refunds, and failed charges across all providers." />

      {data && (
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <StatCard label="Completed volume" value={`$${data.summary.completed_sum.toFixed(2)}`} hint={`${data.summary.completed_count} transactions`} icon={Wallet} tone="primary" />
          <StatCard label="Pending review" value={String(data.summary.pending_count)} hint="Awaiting verification" icon={Wallet} tone="amber" />
          <StatCard label="Matching filters" value={String(data.total)} hint="Current page filter" icon={Wallet} tone="blue" />
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Search by reference or customer email…"
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary">
          <option value="">All statuses</option>
          {["pending", "completed", "failed", "refunded"].map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input value={method} onChange={(event) => { setMethod(event.target.value); setPage(1); }} placeholder="Method (e.g. bkash)" className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
      </div>

      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {loading && !data ? (
        <div className="flex min-h-[240px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Reference</th>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold text-right">Amount</th>
                  <th className="px-5 py-3 font-semibold">Method</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold text-right">Review</th>
                </tr>
              </thead>
              <tbody>
                {!data || data.items.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">No transactions match.</td></tr>
                ) : data.items.map((row) => (
                  <tr key={row.id} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3 font-mono text-xs">{row.ref ?? `#${row.id}`}</td>
                    <td className="px-5 py-3">{row.user_email}</td>
                    <td className="px-5 py-3 text-right font-mono text-xs">{row.currency} {row.amount.toFixed(2)}</td>
                    <td className="px-5 py-3">{row.method}</td>
                    <td className="px-5 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${row.status === "completed" ? "bg-accent/10 text-accent" : row.status === "pending" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : row.status === "failed" ? "bg-rose-500/10 text-rose-500" : "bg-muted text-muted-foreground"}`}>{row.status}</span></td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDate(row.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      {row.status === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setStatusFor(row.id, "completed")} disabled={updating === row.id} className="text-xs font-semibold text-accent hover:underline disabled:opacity-50">Approve</button>
                          <button onClick={() => setStatusFor(row.id, "failed")} disabled={updating === row.id} className="text-xs font-semibold text-destructive hover:underline disabled:opacity-50">Reject</button>
                        </div>
                      ) : (
                        <button onClick={() => setStatusFor(row.id, "refunded")} disabled={updating === row.id || row.status === "refunded"} className="text-xs font-semibold text-muted-foreground hover:underline disabled:opacity-40">Refund</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>{data.total.toLocaleString()} · page {data.page} of {data.pages}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn btn-outline px-2 py-1.5 disabled:opacity-40" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page >= data.pages} className="btn btn-outline px-2 py-1.5 disabled:opacity-40" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
