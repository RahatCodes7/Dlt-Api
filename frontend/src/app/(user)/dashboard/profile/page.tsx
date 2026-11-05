"use client";

import * as React from "react";
import { CheckCircle2, Loader2, Mail, ShieldCheck, User } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { apiFetch } from "@/lib/api";

interface Profile {
  id: number;
  email: string;
  name: string | null;
  role: string;
  plan: string | null;
  email_verified: boolean;
  created_at: string | null;
}

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

export default function ProfilePage() {
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [saved, setSaved] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<Profile>("/v1/auth/me");
      setProfile(data);
      setName(data.name ?? "");
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load your profile");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const updated = await apiFetch<Profile>("/v1/session/account/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim() }),
      });
      setProfile((current) => (current ? { ...current, ...updated } : updated));
      setSaved(true);
      setTimeout(() => setSaved(false), 2400);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not save your profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your profile…
        </span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        <PageHeader eyebrow="Account" title="Profile" />
        <div className="surface flex flex-col items-center p-10 text-center">
          <p className="text-sm text-muted-foreground">{error || "Something went wrong."}</p>
          <button type="button" onClick={load} className="btn btn-primary mt-4">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const displayName = profile.name || profile.email.split("@")[0];
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Your account details and public display name."
      />

      {saved && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm text-accent">
          <CheckCircle2 className="h-4 w-4" /> Profile updated.
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface p-6 lg:col-span-2">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-xl font-bold text-white">
              {initials || "U"}
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{displayName}</h2>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-semibold text-accent">
                  {profile.email_verified ? "Verified" : "Unverified"}
                </span>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  {profile.plan ?? "Free"}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold capitalize text-muted-foreground">
                  {profile.role}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={save} className="mt-6 space-y-4 border-t border-border pt-5">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium">
                Display name
              </label>
              <input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                maxLength={255}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                Email address
              </label>
              <input
                id="email"
                value={profile.email}
                readOnly
                className="h-10 w-full cursor-not-allowed rounded-lg border border-input bg-muted px-3 text-sm text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Email changes are not available yet. Contact support if you need to move accounts.
              </p>
            </div>
            <button type="submit" className="btn btn-primary" disabled={!name.trim() || saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                "Save changes"
              )}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="surface p-5">
            <h2 className="font-semibold">Account</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" /> Account ID
                </dt>
                <dd className="font-mono text-xs">{profile.id}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" /> Email
                </dt>
                <dd className="truncate text-xs">{profile.email}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="h-4 w-4" /> Verified
                </dt>
                <dd className="text-xs">{profile.email_verified ? "Yes" : "No"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Member since</dt>
                <dd className="text-xs">{formatDate(profile.created_at)}</dd>
              </div>
            </dl>
          </div>

          <div className="surface p-5">
            <h2 className="font-semibold">Password</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Reset your password from the sign-in page if you cannot access your account.
            </p>
            <a href="/forgot-password" className="btn btn-outline mt-4 w-full">
              Reset password
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
