"use client";

import * as React from "react";
import { Gauge, Loader2, Save } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { apiFetch } from "@/lib/api";

interface RateLimits {
  info_per_minute: number;
  download_per_minute: number;
  defaults: { info_per_minute: number; download_per_minute: number };
  plans: { id: number; name: string; per_minute: number | null }[];
}

export default function AdminRateLimitsPage() {
  const [data, setData] = React.useState<RateLimits | null>(null);
  const [infoDraft, setInfoDraft] = React.useState(0);
  const [downloadDraft, setDownloadDraft] = React.useState(0);
  const [planDrafts, setPlanDrafts] = React.useState<Record<number, string>>({});
  const [loading, setLoading] = React.useState(true);
  const [savingGateway, setSavingGateway] = React.useState(false);
  const [savingPlan, setSavingPlan] = React.useState<number | null>(null);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");

  const apply = React.useCallback((payload: RateLimits) => {
    setData(payload);
    setInfoDraft(payload.info_per_minute);
    setDownloadDraft(payload.download_per_minute);
    setPlanDrafts(Object.fromEntries(payload.plans.map((plan) => [plan.id, plan.per_minute == null ? "" : String(plan.per_minute)])));
  }, []);

  React.useEffect(() => {
    const load = async () => {
      try {
        apply(await apiFetch<RateLimits>("/v1/admin/rate-limits"));
      } catch (exc) {
        setError(exc instanceof Error ? exc.message : "Could not load rate limits");
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [apply]);

  const flash = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 2400);
  };

  const saveGateway = async () => {
    setSavingGateway(true);
    setError("");
    try {
      apply(await apiFetch<RateLimits>("/v1/admin/rate-limits", {
        method: "PUT",
        body: JSON.stringify({ info_per_minute: Number(infoDraft), download_per_minute: Number(downloadDraft) }),
      }));
      flash("Gateway limits saved.");
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not save gateway limits");
    } finally {
      setSavingGateway(false);
    }
  };

  const savePlan = async (planId: number) => {
    setSavingPlan(planId);
    setError("");
    try {
      const raw = planDrafts[planId]?.trim() ?? "";
      const perMinute = raw === "" ? null : Number(raw);
      const result = await apiFetch<{ id: number; per_minute: number | null }>(`/v1/admin/rate-limits/plans/${planId}`, {
        method: "PUT",
        body: JSON.stringify({ per_minute: perMinute }),
      });
      setData((prev) => (prev ? { ...prev, plans: prev.plans.map((plan) => (plan.id === planId ? { ...plan, per_minute: result.per_minute } : plan)) } : prev));
      setPlanDrafts((prev) => ({ ...prev, [planId]: result.per_minute == null ? "" : String(result.per_minute) }));
      flash(result.per_minute == null ? "Plan override cleared." : `Plan override saved at ${result.per_minute} req/min.`);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not save plan override");
    } finally {
      setSavingPlan(null);
    }
  };

  const gatewayDirty = data !== null && (data.info_per_minute !== infoDraft || data.download_per_minute !== downloadDraft);

  return (
    <div>
      <PageHeader eyebrow="Admin · System" title="Rate limits" description="Gateway-wide per-minute throttling for the info and download endpoints, plus optional per-plan overrides (overrides win when lower)." />

      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {notice && <div className="mb-4 rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm text-accent">{notice}</div>}

      {loading || !data ? (
        <div className="flex min-h-[240px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="surface p-6 lg:col-span-2">
            <h2 className="flex items-center gap-2 font-semibold"><Gauge className="h-5 w-5 text-primary" /> Gateway default</h2>
            <p className="mt-1 text-xs text-muted-foreground">Hard caps applied before any plan override. Factory defaults: {data.defaults.info_per_minute} / {data.defaults.download_per_minute} req/min.</p>
            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold">Info endpoint (req/min)</span>
                <input type="number" min={1} max={100000} value={infoDraft} onChange={(event) => setInfoDraft(Number(event.target.value))} className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Download endpoint (req/min)</span>
                <input type="number" min={1} max={100000} value={downloadDraft} onChange={(event) => setDownloadDraft(Number(event.target.value))} className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              </label>
            </div>
            <div className="mt-5 flex justify-end border-t border-border pt-4">
              <button onClick={saveGateway} disabled={!gatewayDirty || savingGateway} className="btn btn-primary disabled:opacity-50">
                {savingGateway ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save gateway limits
              </button>
            </div>
          </div>

          <div className="surface p-6 lg:col-span-3">
            <h2 className="font-semibold">Per-plan overrides</h2>
            <p className="mt-1 text-xs text-muted-foreground">Requests per minute. Leave blank to inherit the gateway default; the lower of the two applies.</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 pr-4 font-semibold">Plan</th>
                    <th className="py-2 pr-4 font-semibold">Req / min</th>
                    <th className="py-2 font-semibold text-right">Save</th>
                  </tr>
                </thead>
                <tbody>
                  {data.plans.map((plan) => (
                    <tr key={plan.id} className="border-b border-border/70 last:border-0">
                      <td className="py-3 pr-4 font-medium">{plan.name}</td>
                      <td className="py-3 pr-4">
                        <input
                          type="number"
                          min={1}
                          max={100000}
                          placeholder="inherit"
                          value={planDrafts[plan.id] ?? ""}
                          onChange={(event) => setPlanDrafts((prev) => ({ ...prev, [plan.id]: event.target.value }))}
                          className="w-28 rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
                        />
                      </td>
                      <td className="py-3 text-right">
                        <button onClick={() => savePlan(plan.id)} disabled={savingPlan === plan.id} className="btn btn-outline" aria-label={`Save ${plan.name} override`}>
                          {savingPlan === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
