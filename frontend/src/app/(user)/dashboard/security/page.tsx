"use client";

import * as React from "react";
import {
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Monitor,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SessionRecord {
  id: number;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string | null;
  last_seen: string | null;
  current: boolean;
}

interface SecurityState {
  email: string;
  email_verified: boolean;
  password_set: boolean;
  two_factor_enabled: boolean;
  two_factor_pending: boolean;
  sessions: SessionRecord[];
  current_session_id: string | null;
}

interface SetupState {
  secret: string;
  otpauth_uri: string;
}

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const deviceLabel = (userAgent: string | null) => {
  if (!userAgent) return "Unknown device";
  if (/mobile|android|iphone/i.test(userAgent)) return "Mobile browser";
  if (/edg\//i.test(userAgent)) return "Microsoft Edge";
  if (/chrome\//i.test(userAgent)) return "Chrome";
  if (/firefox\//i.test(userAgent)) return "Firefox";
  if (/safari\//i.test(userAgent)) return "Safari";
  return "Browser";
};

export default function SecurityPage() {
  const [state, setState] = React.useState<SecurityState | null>(null);
  const [setup, setSetup] = React.useState<SetupState | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [code, setCode] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setState(await apiFetch<SecurityState>("/v1/session/account/security"));
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load security settings");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const flash = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 2600);
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!state || busy) return;
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await apiFetch("/v1/session/account/security/password", {
        method: "POST",
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      flash("Password updated.");
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  };

  const startTwoFactor = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      setSetup(
        await apiFetch<SetupState>("/v1/session/account/security/2fa/setup", {
          method: "POST",
        }),
      );
      setCode("");
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not start two-factor setup");
    } finally {
      setBusy(false);
    }
  };

  const enableTwoFactor = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await apiFetch("/v1/session/account/security/2fa/enable", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      setSetup(null);
      setCode("");
      await load();
      flash("Two-factor authentication enabled.");
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not enable two-factor");
    } finally {
      setBusy(false);
    }
  };

  const disableTwoFactor = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await apiFetch("/v1/session/account/security/2fa/disable", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      setCode("");
      await load();
      flash("Two-factor authentication disabled.");
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not disable two-factor");
    } finally {
      setBusy(false);
    }
  };

  const revokeSession = async (id: number) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/v1/session/account/security/sessions/${id}`, { method: "DELETE" });
      await load();
      flash("Session revoked.");
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not revoke session");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading security settings…
        </span>
      </div>
    );
  }

  if (!state) {
    return (
      <div>
        <PageHeader eyebrow="Account" title="Security" />
        <div className="surface p-10 text-center text-sm text-muted-foreground">
          {error || "Could not load security settings."}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Security"
        description="Password, two-factor authentication, and active sessions."
        actions={
          <button type="button" onClick={load} className="btn btn-outline">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Email"
          value={state.email_verified ? "Verified" : "Unverified"}
          hint={state.email}
          icon={CheckCircle2}
          tone={state.email_verified ? "accent" : "amber"}
        />
        <StatCard
          label="Two-factor"
          value={state.two_factor_enabled ? "Enabled" : "Disabled"}
          hint={state.two_factor_enabled ? "TOTP required at sign-in" : "Add an extra layer"}
          icon={state.two_factor_enabled ? ShieldCheck : ShieldOff}
          tone={state.two_factor_enabled ? "primary" : "amber"}
        />
        <StatCard label="Active sessions" value={String(state.sessions.length)} hint="signed-in browsers" icon={Monitor} tone="blue" />
      </div>

      {notice && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm text-accent">
          <CheckCircle2 className="h-4 w-4" /> {notice}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="surface p-6">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Change password</h2>
          </div>
          {state.password_set ? (
            <form onSubmit={changePassword} className="mt-4 space-y-3">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Current password</span>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">New password</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Confirm new password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                />
              </label>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={busy || !currentPassword || newPassword.length < 8}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Update password
              </button>
            </form>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              This account signs in with Google, so there is no password to change.
            </p>
          )}
        </div>

        <div className="surface p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Two-factor authentication</h2>
          </div>

          {state.two_factor_enabled ? (
            <form onSubmit={disableTwoFactor} className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Two-factor is active. Enter a current code from your authenticator app to disable it.
              </p>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm tracking-[0.3em]"
              />
              <button type="submit" className="btn btn-outline" disabled={busy || code.length < 6}>
                <ShieldOff className="h-4 w-4" /> Disable two-factor
              </button>
            </form>
          ) : setup ? (
            <form onSubmit={enableTwoFactor} className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Add this secret to your authenticator app, then enter the 6-digit code it shows.
              </p>
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Setup key
                </p>
                <code className="mt-1 block break-all font-mono text-sm">{setup.secret}</code>
              </div>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm tracking-[0.3em]"
              />
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary" disabled={busy || code.length < 6}>
                  <ShieldCheck className="h-4 w-4" /> Enable two-factor
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setSetup(null)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Protect your account with a time-based one-time code from any authenticator app.
              </p>
              <button
                type="button"
                onClick={startTwoFactor}
                disabled={busy}
                className="btn btn-primary"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Set up two-factor
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="surface mt-4 overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold">Active sessions</h2>
          <p className="text-xs text-muted-foreground">Browsers currently signed in to your account.</p>
        </div>
        {state.sessions.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            No tracked sessions yet. Sign in again from a browser to create one.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {state.sessions.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Monitor className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {deviceLabel(item.user_agent)}
                    {item.current && (
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                        This device
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.ip_address || "Unknown IP"} · started {formatDate(item.created_at)} · last seen{" "}
                    {formatDate(item.last_seen)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => revokeSession(item.id)}
                  disabled={busy}
                  className={cn(
                    "flex w-fit items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors",
                    item.current
                      ? "text-muted-foreground hover:bg-muted"
                      : "text-destructive hover:bg-destructive/10",
                  )}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {item.current ? "Sign out" : "Revoke"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
