"use client";

import * as React from "react";
import { Download, FileText, Loader2, Receipt, RefreshCw, X } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Invoice {
  id: string;
  transaction_id: number;
  amount: number;
  currency: string;
  method: string;
  status: string;
  ref: string | null;
  created_at: string;
  pdf_url: string;
}

interface InvoiceDetail extends Invoice {
  user_email: string;
  user_name: string | null;
}

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
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

export default function InvoicesPage() {
  const [items, setItems] = React.useState<Invoice[]>([]);
  const [detail, setDetail] = React.useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await apiFetch<Invoice[]>("/v1/session/account/invoices"));
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load invoices");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const openInvoice = async (invoice: Invoice) => {
    setDetailLoading(true);
    setError("");
    try {
      setDetail(
        await apiFetch<InvoiceDetail>(
          `/v1/session/account/invoices/${invoice.transaction_id}`,
        ),
      );
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load invoice");
    } finally {
      setDetailLoading(false);
    }
  };

  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const currency = items[0]?.currency ?? "USD";

  return (
    <div>
      <PageHeader
        eyebrow="Billing"
        title="Invoices"
        description="Download receipts and review billing history."
        actions={
          <button type="button" onClick={load} className="btn btn-outline">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Invoices" value={String(items.length)} hint="completed payments" icon={FileText} tone="primary" />
        <StatCard label="Total billed" value={formatMoney(total, currency)} hint="all time" icon={Receipt} tone="accent" />
        <StatCard
          label="Latest invoice"
          value={items[0] ? formatDate(items[0].created_at) : "—"}
          hint="most recent receipt"
          icon={Receipt}
          tone="blue"
        />
        <StatCard label="Currency" value={currency} hint="billing currency" icon={FileText} tone="amber" />
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="surface mt-4 overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold">Receipts</h2>
          <p className="text-xs text-muted-foreground">
            Every completed payment produces an invoice you can review and print.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading invoices…
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No invoices yet. A receipt is generated when a payment completes.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Invoice</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Method</th>
                  <th className="px-5 py-3 font-semibold">Total</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3 font-mono text-xs">{item.id}</td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDate(item.created_at)}</td>
                    <td className="px-5 py-3 capitalize">{item.method}</td>
                    <td className="px-5 py-3 font-medium">{formatMoney(item.amount, item.currency)}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openInvoice(item)}
                        disabled={detailLoading}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                      >
                        <Download className="h-3.5 w-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="surface w-full max-w-lg p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Invoice</p>
                <h2 className="mt-1 text-xl font-bold">{detail.id}</h2>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close invoice"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <dl className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
              {[
                ["Billed to", detail.user_name || detail.user_email],
                ["Email", detail.user_email],
                ["Date", formatDate(detail.created_at)],
                ["Method", detail.method],
                ["Reference", detail.ref || `#${detail.transaction_id}`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="truncate font-medium capitalize">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-lg font-bold">{formatMoney(detail.amount, detail.currency)}</span>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => window.print()} className="btn btn-outline">
                Print receipt
              </button>
              <button type="button" onClick={() => setDetail(null)} className="btn btn-primary">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <p className={cn("mt-4 text-xs text-muted-foreground", detail && "sr-only")}>
        Invoices are available for completed transactions only.
      </p>
    </div>
  );
}
