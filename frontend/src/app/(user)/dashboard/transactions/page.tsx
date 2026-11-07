"use client";

import * as React from "react";
import Link from "next/link";
import { CreditCard, DollarSign, Loader2, Receipt, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Transaction {
  id: number;
  amount: number;
  currency: string;
  method: string;
  status: string;
  ref: string | null;
  created_at: string;
}

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};

const formatMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(
      amount,
    );
  } catch {
    return `${amount} ${currency}`;
  }
};

const statusClass = (status: string) => {
  if (status === "completed") return "bg-accent/10 text-accent";
  if (status === "failed") return "bg-destructive/10 text-destructive";
  return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
};

export default function TransactionsPage() {
  const [items, setItems] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await apiFetch<Transaction[]>("/v1/session/account/transactions?limit=200"));
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const completed = items.filter((item) => item.status === "completed");
  const pending = items.filter((item) => item.status === "pending");
  const total = completed.reduce((sum, item) => sum + item.amount, 0);
  const currency = completed[0]?.currency ?? items[0]?.currency ?? "USD";

  return (
    <div>
      <PageHeader
        eyebrow="Billing"
        title="Transactions"
        description="Payments and refunds associated with your account."
        actions={
          <button type="button" onClick={load} className="btn btn-outline">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total paid"
          value={formatMoney(total, currency)}
          hint={`${completed.length} completed`}
          icon={DollarSign}
          tone="primary"
        />
        <StatCard
          label="Transactions"
          value={String(items.length)}
          hint="all time"
          icon={Receipt}
          tone="blue"
        />
        <StatCard
          label="Pending"
          value={String(pending.length)}
          hint="awaiting confirmation"
          icon={CreditCard}
          tone="amber"
        />
        <StatCard
          label="Methods"
          value={String(new Set(items.map((item) => item.method)).size)}
          hint="payment channels used"
          icon={CreditCard}
          tone="accent"
        />
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="surface mt-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-semibold">Payment history</h2>
            <p className="text-xs text-muted-foreground">Payments and refunds on your account.</p>
          </div>
          <Link href="/dashboard/invoices" className="text-xs font-semibold text-primary hover:underline">
            View invoices
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading transactions…
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No transactions yet. Payments will appear here after your first purchase.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Reference</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Method</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3 font-mono text-xs">{item.ref || `#${item.id}`}</td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDate(item.created_at)}</td>
                    <td className="px-5 py-3 capitalize">{item.method}</td>
                    <td className="px-5 py-3 font-medium">{formatMoney(item.amount, item.currency)}</td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                          statusClass(item.status),
                        )}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
