"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Save,
  Settings2,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { apiFetch } from "@/lib/api";

interface WorkspacePreferences {
  timezone: string;
  locale: string;
  date_format: string;
}

interface NotificationPreferences {
  email_quota: boolean;
  email_incidents: boolean;
  email_product: boolean;
}

interface AccountSummary {
  id: number;
  email: string;
  name: string | null;
  plan: string | null;
  role: string;
}

interface PreferencesResponse {
  workspace: WorkspacePreferences;
  notifications: NotificationPreferences;
  account: AccountSummary;
}

const TIMEZONES = ["UTC", "Asia/Dhaka", "Asia/Kolkata", "Europe/London", "Europe/Berlin", "America/New_York", "America/Los_Angeles", "Asia/Singapore"];
const LOCALES = ["en-US", "en-GB", "bn-BD", "hi-IN", "de-DE", "fr-FR", "es-ES"];
const DATE_FORMATS = ["MMM d, yyyy", "dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd"];

export default function SettingsPage() {
  const router = useRouter();
  const [workspace, setWorkspace] = React.useState<WorkspacePreferences | null>(null);
  const [notifications, setNotifications] = React.useState<NotificationPreferences | null>(null);
  const [account, setAccount] = React.useState<AccountSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [confirmText, setConfirmText] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [deactivating, setDeactivating] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<PreferencesResponse>("/v1/session/account/preferences");
      setWorkspace(data.workspace);
      setNotifications(data.notifications);
      setAccount(data.account);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load settings");
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
    setTimeout(() => setNotice(""), 2400);
  };

  const saveWorkspace = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!workspace || busy) return;
    setBusy(true);
    setError("");
    try {
      setWorkspace(
        await apiFetch<WorkspacePreferences>("/v1/session/account/preferences", {
          method: "PUT",
          body: JSON.stringify(workspace),
        }),
      );
      flash("Workspace preferences saved.");
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not save preferences");
    } finally {
      setBusy(false);
    }
  };

  const saveNotifications = async () => {
    if (!notifications || busy) return;
    setBusy(true);
    setError("");
    try {
      setNotifications(
        await apiFetch<NotificationPreferences>(
          "/v1/session/account/notification-preferences",
          { method: "PUT", body: JSON.stringify(notifications) },
        ),
      );
      flash("Notification preferences saved.");
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not save notifications");
    } finally {
      setBusy(false);
    }
  };

  const deactivate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || deactivating) return;
    if (confirmText !== "DELETE") {
      setError('Type "DELETE" to confirm.');
      return;
    }
    if (!window.confirm("Deactivate your account? You will be signed out immediately.")) return;
    setDeactivating(true);
    setError("");
    try {
      await apiFetch("/v1/session/account", {
        method: "DELETE",
        body: JSON.stringify({ password }),
      });
      router.replace("/login");
      router.refresh();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not deactivate account");
      setDeactivating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading settings…
        </span>
      </div>
    );
  }

  if (!workspace || !notifications || !account) {
    return (
      <div>
        <PageHeader eyebrow="Account" title="Settings" />
        <div className="surface p-10 text-center text-sm text-muted-foreground">
          {error || "Could not load settings."}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Workspace preferences, notifications, and danger zone."
      />

      {notice && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm text-accent">
          <CheckCircle2 className="h-4 w-4" /> {notice}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <form onSubmit={saveWorkspace} className="surface p-6">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Workspace preferences</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Used for dashboard dates, reports, and exports.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Timezone</span>
                <select
                  value={workspace.timezone}
                  onChange={(event) => setWorkspace({ ...workspace, timezone: event.target.value })}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  {TIMEZONES.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Locale</span>
                <select
                  value={workspace.locale}
                  onChange={(event) => setWorkspace({ ...workspace, locale: event.target.value })}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  {LOCALES.map((locale) => (
                    <option key={locale} value={locale}>
                      {locale}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Date format</span>
                <select
                  value={workspace.date_format}
                  onChange={(event) => setWorkspace({ ...workspace, date_format: event.target.value })}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  {DATE_FORMATS.map((format) => (
                    <option key={format} value={format}>
                      {format}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button type="submit" className="btn btn-primary mt-4" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save preferences
            </button>
          </form>

          <div className="surface p-6">
            <h2 className="font-semibold">Email notifications</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose which account events should reach your inbox.
            </p>
            <div className="mt-4 space-y-3">
              {(
                [
                  ["email_quota", "Quota warnings", "Alert before you reach your monthly request limit."],
                  ["email_incidents", "Incident updates", "Outages and scheduled maintenance."],
                  ["email_product", "Product news", "New platforms, endpoints, and releases."],
                ] as [keyof NotificationPreferences, string, string][]
              ).map(([key, label, hint]) => (
                <label key={key} className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={notifications[key]}
                    onChange={(event) =>
                      setNotifications({ ...notifications, [key]: event.target.checked })
                    }
                    className="mt-0.5 h-4 w-4 rounded border-input"
                  />
                  <span>
                    <span className="font-medium">{label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>
                  </span>
                </label>
              ))}
            </div>
            <button type="button" onClick={saveNotifications} className="btn btn-outline mt-4" disabled={busy}>
              Save notifications
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="surface p-5">
            <h2 className="font-semibold">Account</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="truncate font-medium">{account.name || "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="truncate">{account.email}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Plan</dt>
                <dd className="font-medium">{account.plan ?? "Free"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Role</dt>
                <dd className="font-medium capitalize">{account.role}</dd>
              </div>
            </dl>
          </div>

          <form onSubmit={deactivate} className="surface border-destructive/40 p-5">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="font-semibold">Danger zone</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Deactivating signs you out everywhere and blocks future sign-ins. This cannot be
              undone from the dashboard.
            </p>
            <label className="mt-3 block space-y-1.5">
              <span className="text-sm font-medium">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Current password (or DELETE for social accounts)"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </label>
            <label className="mt-3 block space-y-1.5">
              <span className="text-sm font-medium">Type DELETE to confirm</span>
              <input
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                placeholder="DELETE"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </label>
            <button
              type="submit"
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-destructive px-3 py-2 text-sm font-semibold text-white hover:bg-destructive/90 disabled:opacity-50"
              disabled={deactivating || confirmText !== "DELETE"}
            >
              {deactivating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Deactivate account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
