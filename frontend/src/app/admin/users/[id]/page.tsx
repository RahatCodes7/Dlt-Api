"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, KeyRound, Loader2, Monitor, Receipt, ShieldBan, ShieldCheck, Wallet } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { apiFetch } from "@/lib/api";

interface UserDetail {
  id: number;
  email: string;
  name: string | null;
  role: string;
  status: string;
  email_verified: boolean;
  plan: string | null;
  google_id: boolean;
  created_at: string | null;
  stats: {
    total_requests: number;
    error_requests: number;
    last_30d_requests: number;
    active_keys: number;
    active_sessions: number;
  };
  quota: { plan: string | null; limit: number; used: number; remaining: number };
  transactions: { id: number; amount: number; currency: string; method: string; status: string; ref: string | null; created_at: string | null }[];
  recent_logs: { id: number; platform: string; url: string | null; status: string; created_at: string | null }[];
}

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = Number(params?.id);
  const [data, setData] = React.useState<UserDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!Number.isFinite(userId)) {
      setError("Invalid user id");
      setLoading(false);
      return;
    }
    try {
      setData(await apiFetch<UserDetail>(`/v1/admin/users/${userId}`));
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load user");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const toggleStatus = async () => {
    if (!data) return;
    const next = data.status === "active" ? "suspended" : "active";
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/v1/admin/users/${data.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      await load();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not update user");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-[300px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (error && !data) {
    return (
      <div>
        <PageHeader eyebrow="Admin · Users" title="User details" />
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
        <button onClick={() => router.push("/admin/users/all")} className="btn btn-outline mt-4"><ArrowLeft className="h-4 w-4" /> Back to users</button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <PageHeader
        eyebrow="Admin · Users"
        title={data.email}
        description={`Joined ${formatDate(data.created_at)}${data.google_id ? " · Google account" : ""}${data.email_verified ? " · email verified" : ""}`}
        actions={
          <button onClick={toggleStatus} disabled={busy} className={data.status === "active" ? "btn btn-outline border-destructive/40 text-destructive" : "btn btn-primary"}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : data.status === "active" ? <ShieldBan className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            {data.status === "active" ? "Suspend user" : "Reactivate user"}
          </button>
        }
      />

      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Requests (30d)" value={data.stats.last_30d_requests.toLocaleString()} hint={`${data.stats.total_requests.toLocaleString()} all-time · ${data.stats.error_requests} errors`} icon={Wallet} tone="primary" />
        <StatCard label="Quota used (month)" value={`${data.quota.used.toLocaleString()} / ${data.quota.limit.toLocaleString()}`} hint={`${data.quota.remaining.toLocaleString()} remaining on ${data.quota.plan ?? "no plan"}`} icon={Wallet} tone="blue" />
        <StatCard label="Active API keys" value={String(data.stats.active_keys)} icon={KeyRound} tone="amber" />
        <StatCard label="Active sessions" value={String(data.stats.active_sessions)} icon={Monitor} tone="primary" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="surface p-5">
          <h2 className="flex items-center gap-2 font-semibold"><Receipt className="h-4 w-4 text-primary" /> Billing history</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-3 font-semibold">Amount</th>
                  <th className="py-2 pr-3 font-semibold">Method</th>
                  <th className="py-2 pr-3 font-semibold">Status</th>
                  <th className="py-2 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.length === 0 ? (
                  <tr><td colSpan={4} className="py-6 text-center text-sm text-muted-foreground">No transactions yet.</td></tr>
                ) : data.transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-border/70 last:border-0">
                    <td className="py-2 pr-3 font-mono text-xs">{tx.currency} {tx.amount.toFixed(2)}</td>
                    <td className="py-2 pr-3">{tx.method}</td>
                    <td className="py-2 pr-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tx.status === "completed" ? "bg-accent/10 text-accent" : tx.status === "pending" ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground"}`}>{tx.status}</span></td>
                    <td className="py-2 text-muted-foreground">{formatDate(tx.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="surface p-5">
          <h2 className="font-semibold">Recent API activity</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-3 font-semibold">Platform</th>
                  <th className="py-2 pr-3 font-semibold">Status</th>
                  <th className="py-2 font-semibold">When</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_logs.length === 0 ? (
                  <tr><td colSpan={3} className="py-6 text-center text-sm text-muted-foreground">No requests yet.</td></tr>
                ) : data.recent_logs.map((log) => (
                  <tr key={log.id} className="border-b border-border/70 last:border-0">
                    <td className="py-2 pr-3 font-medium">{log.platform}</td>
                    <td className="py-2 pr-3"><span className={log.status === "success" ? "text-accent" : "text-destructive"}>{log.status}</span></td>
                    <td className="py-2 text-muted-foreground">{formatDate(log.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Link href="/admin/users/all" className="btn btn-outline"><ArrowLeft className="h-4 w-4" /> Back to all users</Link>
      </div>
    </div>
  );
}
