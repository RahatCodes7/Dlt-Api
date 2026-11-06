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

export default function AdminPlansEditPage() {
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [editing, setEditing] = React.useState<number | null>(null);
  const [edits, setEdits] = React.useState<Record<number, Partial<Plan>>>({});
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

  const startEdit = (id: number) => setEditing(id);
  const cancelEdit = () => setEditing(null);

  const saveEdit = async (id: number) => {
    const changes = edits[id];
    if (!changes || Object.keys(changes).length === 0) {
      setEditing(null);
      return;
    }
    try {
      await apiFetch<Plan>(`/v1/admin/plans/${id}`, {
        method: "PUT",
        body: JSON.stringify(changes),
      });
      setEditing(null);
      setEdits({});
      load();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not update plan");
    }
  };

  const confirmDeletePlan = (id: number) => setConfirmDelete(id);
  const cancelDelete = () => setConfirmDelete(null);

  const deletePlan = async (id: number) => {
    setDeleting(id);
    setConfirmDelete(null);
    try {
      await apiFetch(`/v1/admin/plans/${id}`, { method: "DELETE" });
      setPlans((prev) => prev.filter((p) => p.id !== id));
      if (editing === id) setEditing(null);
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
        title="Edit plans"
        description="Change pricing or allowances for existing tiers."
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
              plans.map((plan) => {
                const isEditing = editing === plan.id;
                return (
                  <tr key={plan.id} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3">
                      {isEditing ? (
                        <input
                          defaultValue={plan.name}
                          className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          onChange={(e) =>
                            setEdits((prev) => ({ ...prev, [plan.id]: { ...prev[plan.id], name: e.target.value } }))
                          }
                        />
                      ) : (
                        <span className="font-medium">{plan.name}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={plan.price ?? ""}
                          className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          onChange={(e) =>
                            setEdits((prev) => ({
                              ...prev,
                              [plan.id]: { ...prev[plan.id], price: e.target.value ? Number(e.target.value) : null },
                            }))
                          }
                        />
                      ) : (
                        plan.price != null ? `$${plan.price.toFixed(2)}/mo` : "Free"
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-xs">
                      {isEditing ? (
                        <input
                          type="number"
                          defaultValue={plan.monthly_requests}
                          className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          onChange={(e) =>
                            setEdits((prev) => ({
                              ...prev,
                              [plan.id]: { ...prev[plan.id], monthly_requests: Number(e.target.value) || 0 },
                            }))
                          }
                        />
                      ) : (
                        plan.monthly_requests.toLocaleString()
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {isEditing ? (
                        <select
                          defaultValue={String(plan.active)}
                          className="h-9 rounded-lg border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          onChange={(e) =>
                            setEdits((prev) => ({ ...prev, [plan.id]: { ...prev[plan.id], active: e.target.value === "true" } }))
                          }
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      ) : (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            plan.active ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {plan.active ? "Active" : "Inactive"}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => saveEdit(plan.id)}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-xs font-semibold text-muted-foreground hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => startEdit(plan.id)}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            Edit
                          </button>
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
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
