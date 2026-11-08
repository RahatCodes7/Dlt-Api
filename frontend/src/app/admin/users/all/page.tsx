"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { apiFetch } from "@/lib/api";

interface UserRow {
  id: number;
  email: string;
  name: string | null;
  role: string;
  status: string;
  plan: string | null;
  requests_this_month: number;
  created_at: string | null;
}

interface UsersResponse {
  items: UserRow[];
  total: number;
  page: number;
  pages: number;
}

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function AdminAllUsersPage() {
  const [data, setData] = React.useState<UsersResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [page, setPage] = React.useState(1);

  const load = React.useCallback(async (query: string, statusFilter: string, pageNumber: number) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(pageNumber), page_size: "20" });
      if (query.trim()) params.set("search", query.trim());
      if (statusFilter) params.set("status", statusFilter);
      setData(await apiFetch<UsersResponse>(`/v1/admin/users?${params.toString()}`));
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load users");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => load(search, status, page), 250);
    return () => clearTimeout(timer);
  }, [load, search, status, page]);

  const toggleStatus = async (row: UserRow) => {
    const next = row.status === "active" ? "suspended" : "active";
    try {
      await apiFetch(`/v1/admin/users/${row.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      load(search, status, page);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not update user");
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Admin · Users" title="All users" description="Search, filter, and manage every account on the platform." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Search by email or name…"
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <select
          value={status}
          onChange={(event) => { setStatus(event.target.value); setPage(1); }}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {loading && !data ? (
        <div className="flex min-h-[240px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-5 py-3 font-semibold">Plan</th>
                  <th className="px-5 py-3 font-semibold text-right">Req. (mo)</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Joined</th>
                  <th className="px-5 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {!data || data.items.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">No users found.</td></tr>
                ) : (
                  data.items.map((row) => (
                    <tr key={row.id} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                      <td className="px-5 py-3">
                        <Link href={`/admin/users/${row.id}`} className="font-medium text-primary hover:underline">
                          {row.email}
                        </Link>
                        {row.name && <span className="block text-xs text-muted-foreground">{row.name}{row.role === "admin" ? " · admin" : ""}</span>}
                      </td>
                      <td className="px-5 py-3">{row.plan ?? "—"}</td>
                      <td className="px-5 py-3 text-right font-mono text-xs">{row.requests_this_month.toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${row.status === "active" ? "bg-accent/10 text-accent" : "bg-rose-500/10 text-rose-500"}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{formatDate(row.created_at)}</td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => toggleStatus(row)} className={`text-xs font-semibold hover:underline ${row.status === "active" ? "text-destructive" : "text-accent"}`}>
                          {row.status === "active" ? "Suspend" : "Reactivate"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {data && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>{data.total.toLocaleString()} user{data.total === 1 ? "" : "s"} · page {data.page} of {data.pages}</span>
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
