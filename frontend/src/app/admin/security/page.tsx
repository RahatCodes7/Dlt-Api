"use client";

import * as React from "react";
import { Loader2, ShieldCheck, ShieldQuestion, UserCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { apiFetch } from "@/lib/api";

interface SecurityOverview {
  total_users: number;
  two_factor_users: number;
  two_factor_coverage: number;
  active_sessions: number;
  verified_users: number;
}

export default function AdminSecurityPage() {
  const [data, setData] = React.useState<SecurityOverview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const load = async () => {
      try {
        setData(await apiFetch<SecurityOverview>("/v1/admin/security/overview"));
      } catch (exc) {
        setError(exc instanceof Error ? exc.message : "Could not load security overview");
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      <PageHeader eyebrow="Admin · System" title="Security center" description="Account verification, second-factor adoption, and session posture across the platform." />

      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {loading || !data ? (
        <div className="flex min-h-[240px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total users" value={String(data.total_users)} hint={`${data.verified_users} verified emails`} icon={Users} tone="primary" />
            <StatCard label="Verified users" value={String(data.verified_users)} hint={data.total_users ? `${Math.round((data.verified_users / data.total_users) * 100)}% of all accounts` : "—"} icon={UserCheck} tone="blue" />
            <StatCard label="Two-factor enabled" value={String(data.two_factor_users)} hint={`${data.two_factor_coverage}% 2FA coverage`} icon={ShieldCheck} tone="accent" />
            <StatCard label="Active sessions" value={String(data.active_sessions)} hint="Unexpired, unrevoked sign-ins" icon={ShieldQuestion} tone="amber" />
          </div>

          <div className="surface mt-5 p-6 text-sm text-muted-foreground">
            <h2 className="font-semibold text-foreground">Hardening checklist</h2>
            <p className="mt-1 text-xs">For per-account actions (suspend, reactivate) see Users · Suspended; for signup and maintenance policy see System configuration.</p>
            <ul className="mt-3 list-inside list-disc space-y-1">
              <li>Admin routes require the admin role; non-admins receive 403 FORBIDDEN.</li>
              <li>Every mutating admin action is recorded in the admin audit log.</li>
              <li>Maintenance mode returns 503 MAINTENANCE for public downloads.</li>
              <li>API keys authenticate /v1/dlt endpoints only — never /v1/admin.</li>
              <li>Suspended accounts keep their history but cannot sign in or call the API.</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
