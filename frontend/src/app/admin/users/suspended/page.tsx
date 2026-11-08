"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { apiFetch } from "@/lib/api";

interface SuspendedUser {
  id: number;
  email: string;
  name: string | null;
  status: string;
  plan: string | null;
  created_at: string | null;
}

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function AdminSuspendedUsersPage() {
  const [items, setItems] = React.useState<SuspendedUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    try {
      const data = await apiFetch<{ items: SuspendedUser[] }>("/v1/admin/users/suspended");
      setItems(data.items);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load suspended users");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const reactivate = async (id: number) => {
    setBusy(id);
    setError("");
    try {
      await apiFetch(`/v1/admin/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "active" }),
      });
      await load();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not reactivate user");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Admin · Users" title="Suspended users" description="Accounts restricted for policy, billing, or abuse reasons." />

      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Plan</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
                <th className="px-5 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">No suspended accounts.</td></tr>
              ) : items.map((row) => (
                <tr key={row.id} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                  <td className="px-5 py-3">
                    <Link href={`/admin/users/${row.id}`} className="font-medium text-primary hover:underline">{row.email}</Link>
                    {row.name && <span className="block text-xs text-muted-foreground">{row.name}</span>}
                  </td>
                  <td className="px-5 py-3">{row.plan ?? "—"}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-500">{row.status}</span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{formatDate(row.created_at)}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => reactivate(row.id)} disabled={busy === row.id} className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline disabled:opacity-50">
                      {busy === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                      Reactivate
                    </button>
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
