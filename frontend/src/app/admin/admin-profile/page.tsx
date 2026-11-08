"use client";

import * as React from "react";
import { KeyRound, Loader2, Mail, ShieldCheck, User } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { apiFetch } from "@/lib/api";

interface Profile {
  id: number;
  email: string;
  name: string | null;
  role: string;
  plan: string | null;
  created_at: string | null;
}

export default function AdminProfilePage() {
  const [user, setUser] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const load = async () => {
      try {
        setUser(await apiFetch<Profile>("/v1/auth/me"));
      } catch (exc) {
        setError(exc instanceof Error ? exc.message : "Could not load your profile");
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, []);

  const joined = user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;

  return (
    <div>
      <PageHeader eyebrow="Admin · Account" title="Admin profile" description="Your administrator identity on this deployment." />

      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {loading || !user ? (
        <div className="flex min-h-[240px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Name" value={user.name ?? "—"} hint="Administrator" icon={User} tone="primary" />
            <StatCard label="Email" value={user.email} hint="Used for sign-in and alerts" icon={Mail} tone="blue" />
            <StatCard label="Role" value={user.role} hint="Full /v1/admin access" icon={ShieldCheck} tone="accent" />
            <StatCard label="Member since" value={joined ?? "—"} hint={user.plan ? `Plan: ${user.plan}` : "No active plan"} icon={KeyRound} tone="amber" />
          </div>

          <div className="surface mt-5 p-6 text-sm text-muted-foreground">
            <h2 className="font-semibold text-foreground">About your access</h2>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Every admin action is recorded in the audit log with your user ID.</li>
              <li>Changes to site settings, rate limits, and platform toggles take effect immediately.</li>
              <li>API keys issued to this account inherit your plan and are not affected by admin role.</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
