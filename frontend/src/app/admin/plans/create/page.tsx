"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { apiFetch } from "@/lib/api";

interface PlanCreate {
  name: string;
  monthly_requests: number;
  price: number | null;
  active: boolean;
}

export default function AdminPlansCreatePage() {
  const [form, setForm] = React.useState<PlanCreate>({
    name: "",
    monthly_requests: 0,
    price: null,
    active: true,
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleChange = (key: keyof PlanCreate, value: string | boolean | number | null) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiFetch<PlanCreate>("/v1/admin/plans", {
        method: "POST",
        body: JSON.stringify(form),
      });
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not create plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Admin · Plans"
        title="Create plan"
        description="Define a new pricing tier and its request allowance."
        actions={
          <Link href="/admin/plans/all" className="btn btn-outline">
            <ArrowRight className="h-4 w-4" /> Back to all plans
          </Link>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="surface p-6 max-w-lg space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium block">Plan name</label>
          <input
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="e.g. Scale"
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium block">Monthly requests</label>
          <input
            type="number"
            value={form.monthly_requests}
            onChange={(e) => handleChange("monthly_requests", Number(e.target.value) || 0)}
            placeholder="e.g. 100000"
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium block">Price (USD/month)</label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-muted-foreground">$</span>
            <input
              type="number"
              step="0.01"
              value={form.price ?? ""}
              onChange={(e) => handleChange("price", e.target.value ? Number(e.target.value) : null)}
              placeholder="0.00"
              className="h-10 w-full pl-8 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="active"
            checked={form.active}
            onChange={(e) => handleChange("active", e.target.checked)}
            className="rounded border-input bg-background hover:bg-accent/50 focus-visible:ring-ring focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 print:hidden peer data-[state=checked]:bg-accent data-[state=unchecked]:border-input"
          />
          <label htmlFor="active" className="text-sm font-medium">
            Active
          </label>
        </div>
        <div className="pt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-3 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create plan
          </button>
          <Link href="/admin/plans/all" className="btn btn-outline w-full py-3">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
