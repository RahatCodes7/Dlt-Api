"use client";

import * as React from "react";
import Link from "next/link";
import { Layers, Loader2, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { apiFetch } from "@/lib/api";

interface ApiItem {
  product_id: number | null;
  slug: string;
  name: string;
  source: "built-in" | "custom";
  active: boolean;
  price_monthly: number | null;
  requests_30d: number;
  errors_30d: number;
}

export default function AdminAllApisPage() {
  const [items, setItems] = React.useState<ApiItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      const data = await apiFetch<{ items: ApiItem[] }>("/v1/admin/apis");
      setItems(data.items);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load APIs");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const toggle = async (item: ApiItem) => {
    setError("");
    try {
      if (item.source === "built-in") {
        await apiFetch("/v1/admin/apis/config", {
          method: "PUT",
          body: JSON.stringify({ platform: item.slug, enabled: !item.active }),
        });
      } else if (item.product_id != null) {
        await apiFetch(`/v1/admin/apis/${item.product_id}/toggle`, { method: "PATCH" });
      }
      await load();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not update API");
    }
  };

  const remove = async (item: ApiItem) => {
    if (item.product_id == null) return;
    setError("");
    try {
      await apiFetch(`/v1/admin/apis/${item.product_id}`, { method: "DELETE" });
      await load();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not delete API");
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Admin · APIs"
        title="All APIs"
        description="Built-in platform engines and custom API products, with 30-day traffic."
        actions={
          <Link href="/admin/apis/add" className="btn btn-primary"><Plus className="h-4 w-4" /> Add API</Link>
        }
      />

      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-semibold">API</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold text-right">Req. (30d)</th>
                <th className="px-5 py-3 font-semibold text-right">Errors (30d)</th>
                <th className="px-5 py-3 font-semibold text-right">Price</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">No APIs registered yet.</td></tr>
              ) : items.map((item) => (
                <tr key={`${item.source}-${item.slug}-${item.product_id ?? "builtin"}`} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2 font-medium"><Layers className="h-4 w-4 text-muted-foreground" />{item.name}</span>
                    <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">{item.slug}</span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{item.source}</td>
                  <td className="px-5 py-3 text-right font-mono text-xs">{item.requests_30d.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right font-mono text-xs">{item.errors_30d.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right">{item.price_monthly != null ? `$${item.price_monthly.toFixed(2)}` : "—"}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => toggle(item)} className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${item.active ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`} title="Click to toggle">
                      {item.active ? "Active" : "Disabled"}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {item.source === "custom" && (
                      <button onClick={() => remove(item)} className="text-destructive hover:underline" aria-label={`Delete ${item.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
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
