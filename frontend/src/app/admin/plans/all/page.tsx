"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { apiFetch } from "@/lib/api";

interface Plan {
  id: number;
  name: string;
  monthly_requests: number;
  price: number | null;
  active: boolean;
}

export default function AdminPlansAllPage() {
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [deleting, setDeleting] = React.useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setPlans(await apiFetch<Plan[]>("/v1/admin/plans"));
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load plans");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const confirmDeletePlan = (id: number) => setConfirmDelete(id);
  const cancelDelete = () => setConfirmDelete(null);

  const deletePlan = async (id: number) => {
    setDeleting(id);
    setConfirmDelete(null);
    try {
      await apiFetch(`/v1/admin/plans/${id}`, { method: "DELETE" });
      setPlans((prev) => prev.filter((p) => p.id !== id));
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not delete plan");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading plans…
        </span>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Admin · Plans"
        title="All plans"
        description="Pricing tiers, monthly volume, and availability."
        actions={
          <>
            <Link href="/admin/plans/create" className="btn btn-primary">
              <Plus className="h-4 w-4" /> Create plan
            </Link>
          </>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3 font-semibold">Plan</th>
              <th className="px-5 py-3 font-semibold">Price</th>
              <th className="px-5 py-3 font-semibold text-right">Requests/mo</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {plans.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">
                  No plans found.
                </td>
              </tr>
            ) : (
              plans.map((plan) => (
                <tr key={plan.id} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                  <td className="px-5 py-3 font-medium">{plan.name}</td>
                  <td className="px-5 py-3">
                    {plan.price != null ? `$${plan.price.toFixed(2)}/mo` : "Free"}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-xs">
                    {plan.monthly_requests.toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        plan.active ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {plan.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/admin/plans/edit`}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Edit
                      </Link>
                      {confirmDelete === plan.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => deletePlan(plan.id)}
                            className="text-xs font-bold text-destructive"
                          >
                            Delete
                          </button>
                          <button
                            onClick={cancelDelete}
                            className="text-xs font-semibold text-muted-foreground hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => confirmDeletePlan(plan.id)}
                          disabled={deleting === plan.id}
                          className={`text-xs font-semibold ${
                            deleting === plan.id ? "text-muted-foreground" : "text-destructive"
                          } hover:underline`}
                        >
                          {deleting === plan.id ? "Deleting…" : "Delete"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
