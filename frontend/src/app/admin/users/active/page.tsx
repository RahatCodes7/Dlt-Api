"use client";

import * as React from "react";
import Link from "next/link";
import { Activity, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { apiFetch } from "@/lib/api";

interface ActiveUser {
  id: number;
  email: string;
  name: string | null;
  plan: string | null;
  status: string;
  requests: number;
  last_request: string | null;
}

const formatDateTime = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

export default function AdminActiveUsersPage() {
  const [items, setItems] = React.useState<ActiveUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch<{ items: ActiveUser[]; days: number }>("/v1/admin/users/active?days=30");
        setItems(data.items);
      } catch (exc) {
        setError(exc instanceof Error ? exc.message : "Could not load active users");
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, []);

  const totalRequests = items.reduce((sum, item) => sum + item.requests, 0);

  return (
    <div>
      <PageHeader eyebrow="Admin · Users" title="Active users" description="Accounts with API activity in the last 30 days." />
      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <StatCard label="Active users (30d)" value={String(items.length)} hint="Made at least one API request" icon={Activity} tone="primary" />
        <StatCard label="Requests (30d)" value={totalRequests.toLocaleString()} hint="Across active accounts" icon={Activity} tone="blue" />
      </div>

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
                <th className="px-5 py-3 font-semibold text-right">Requests</th>
                <th className="px-5 py-3 font-semibold">Last active</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">No API activity in the last 30 days.</td></tr>
              ) : items.map((row) => (
                <tr key={row.id} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                  <td className="px-5 py-3">
                    <Link href={`/admin/users/${row.id}`} className="font-medium text-primary hover:underline">{row.email}</Link>
                    {row.name && <span className="block text-xs text-muted-foreground">{row.name}</span>}
                  </td>
                  <td className="px-5 py-3">{row.plan ?? "—"}</td>
                  <td className="px-5 py-3 text-right font-mono text-xs">{row.requests.toLocaleString()}</td>
                  <td className="px-5 py-3 text-muted-foreground">{formatDateTime(row.last_request)}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${row.status === "active" ? "bg-accent/10 text-accent" : "bg-rose-500/10 text-rose-500"}`}>
                      {row.status}
                    </span>
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
