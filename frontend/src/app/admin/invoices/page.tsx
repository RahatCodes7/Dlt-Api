"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, FileText, Loader2, Printer, X } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { apiFetch } from "@/lib/api";

interface InvoiceRow {
  id: number;
  invoice_number: string;
  customer_email: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  issued_at: string | null;
}

interface InvoiceDetail extends InvoiceRow {
  customer_name: string | null;
  ref: string | null;
  line_items: { description: string; quantity: number; unit_price: number; amount: number }[];
}

interface InvoicesResponse {
  items: InvoiceRow[];
  total: number;
  page: number;
  pages: number;
}

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function AdminInvoicesPage() {
  const [data, setData] = React.useState<InvoicesResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [detail, setDetail] = React.useState<InvoiceDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        setData(await apiFetch<InvoicesResponse>(`/v1/admin/invoices?page=${page}&page_size=20`));
      } catch (exc) {
        setError(exc instanceof Error ? exc.message : "Could not load invoices");
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [page]);

  const openInvoice = async (id: number) => {
    setDetailLoading(true);
    setError("");
    try {
      setDetail(await apiFetch<InvoiceDetail>(`/v1/admin/invoices/${id}`));
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load invoice");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Admin · Finance" title="Invoices" description="Generated invoices from completed payments and their settlement status." />

      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {loading && !data ? (
        <div className="flex min-h-[240px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Invoice</th>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold text-right">Total</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Issued</th>
                  <th className="px-5 py-3 font-semibold text-right">View</th>
                </tr>
              </thead>
              <tbody>
                {!data || data.items.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">No invoices yet.</td></tr>
                ) : data.items.map((row) => (
                  <tr key={row.id} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3 font-mono text-xs font-semibold">{row.invoice_number}</td>
                    <td className="px-5 py-3">{row.customer_email}</td>
                    <td className="px-5 py-3 text-right font-mono text-xs">{row.currency} {row.amount.toFixed(2)}</td>
                    <td className="px-5 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${row.status === "paid" ? "bg-accent/10 text-accent" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>{row.status}</span></td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDate(row.issued_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => openInvoice(row.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                        <FileText className="h-3.5 w-3.5" /> Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>{data.total.toLocaleString()} invoice{data.total === 1 ? "" : "s"} · page {data.page} of {data.pages}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn btn-outline px-2 py-1.5 disabled:opacity-40" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page >= data.pages} className="btn btn-outline px-2 py-1.5 disabled:opacity-40" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}
        </>
      )}

      {(detail || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-semibold"><FileText className="h-5 w-5 text-primary" />{detail?.invoice_number ?? "Loading…"}</h2>
              <div className="flex items-center gap-1">
                <button onClick={() => window.print()} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Print invoice"><Printer className="h-4 w-4" /></button>
                <button onClick={() => setDetail(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Close"><X className="h-4 w-4" /></button>
              </div>
            </div>
            {detailLoading && <div className="flex min-h-[160px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
            {detail && (
              <div className="mt-4 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">Billed to</p>
                    <p className="text-muted-foreground">{detail.customer_name ?? detail.customer_email}</p>
                    <p className="text-muted-foreground">{detail.customer_email}</p>
                  </div>
                  <div className="text-right text-muted-foreground">
                    <p>Issued {formatDate(detail.issued_at)}</p>
                    <p>Method: {detail.method}{detail.ref ? ` · Ref ${detail.ref}` : ""}</p>
                  </div>
                </div>
                <table className="mt-4 w-full text-left">
                  <thead><tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground"><th className="py-2 font-semibold">Item</th><th className="py-2 text-right font-semibold">Amount</th></tr></thead>
                  <tbody>
                    {detail.line_items.map((item, index) => (
                      <tr key={index} className="border-b border-border/70 last:border-0">
                        <td className="py-2">{item.description}</td>
                        <td className="py-2 text-right font-mono text-xs">{detail.currency} {item.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr><td className="py-3 font-semibold">Total</td><td className="py-3 text-right font-mono font-bold">{detail.currency} {detail.amount.toFixed(2)}</td></tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
