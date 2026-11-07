"use client";

import * as React from "react";
import { Bell, CheckCheck, Loader2, RefreshCw, Save } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Notification {
  id: number;
  title: string;
  body: string | null;
  type: string;
  read: boolean;
  created_at: string;
}

interface Preferences {
  email_quota: boolean;
  email_incidents: boolean;
  email_product: boolean;
}

interface NotificationsResponse {
  items: Notification[];
  unread: number;
  preferences: Preferences;
}

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const typeClass = (type: string) => {
  if (type === "incident") return "bg-destructive/10 text-destructive";
  if (type === "quota") return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  return "bg-primary/10 text-primary";
};

export default function NotificationsPage() {
  const [data, setData] = React.useState<NotificationsResponse | null>(null);
  const [preferences, setPreferences] = React.useState<Preferences | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [saved, setSaved] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch<NotificationsResponse>(
        "/v1/session/account/notifications",
      );
      setData(response);
      setPreferences(response.preferences);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const markRead = async (id: number) => {
    try {
      await apiFetch(`/v1/session/account/notifications/${id}/read`, { method: "POST" });
      setData((current) =>
        current
          ? {
              ...current,
              unread: Math.max(0, current.unread - (current.items.find((item) => item.id === id)?.read ? 0 : 1)),
              items: current.items.map((item) => (item.id === id ? { ...item, read: true } : item)),
            }
          : current,
      );
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not mark notification as read");
    }
  };

  const markAll = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await apiFetch("/v1/session/account/notifications/read-all", { method: "POST" });
      setData((current) =>
        current
          ? { ...current, unread: 0, items: current.items.map((item) => ({ ...item, read: true })) }
          : current,
      );
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not mark all as read");
    } finally {
      setBusy(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences || busy) return;
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const updated = await apiFetch<Preferences>(
        "/v1/session/account/notification-preferences",
        { method: "PUT", body: JSON.stringify(preferences) },
      );
      setPreferences(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2400);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not save preferences");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Notifications"
        description="Quota warnings, incident updates, and product news."
        actions={
          <>
            <button type="button" onClick={load} className="btn btn-outline">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button type="button" onClick={markAll} className="btn btn-primary" disabled={busy || !data?.unread}>
              <CheckCheck className="h-4 w-4" /> Mark all read
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Unread" value={String(data?.unread ?? 0)} hint="needs attention" icon={Bell} tone="amber" />
        <StatCard label="Total" value={String(data?.items.length ?? 0)} hint="recent notifications" icon={Bell} tone="primary" />
        <StatCard
          label="Email alerts"
          value={String(
            preferences
              ? [preferences.email_quota, preferences.email_incidents, preferences.email_product].filter(Boolean).length
              : 0,
          )}
          hint="channels enabled"
          icon={Bell}
          tone="accent"
        />
      </div>

      {saved && (
        <div className="mt-4 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm text-accent">
          Notification preferences saved.
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="surface overflow-hidden lg:col-span-2">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold">Inbox</h2>
            <p className="text-xs text-muted-foreground">Quota warnings, incidents, and product updates.</p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading notifications…
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              You are all caught up. New notifications will appear here.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => !item.read && markRead(item.id)}
                  className={cn(
                    "flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/50",
                    !item.read && "bg-primary/[0.03]",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      typeClass(item.type),
                    )}
                  >
                    <Bell className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={cn("truncate text-sm", !item.read && "font-semibold")}>
                        {item.title}
                      </span>
                      {!item.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                    </span>
                    {item.body && (
                      <span className="mt-0.5 block text-sm text-muted-foreground">{item.body}</span>
                    )}
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {formatDate(item.created_at)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="surface p-5">
          <h2 className="font-semibold">Email preferences</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose which events should reach your inbox.
          </p>
          {preferences && (
            <div className="mt-4 space-y-3">
              {(
                [
                  ["email_quota", "Quota warnings", "Alert before you hit your monthly limit."],
                  ["email_incidents", "Incident updates", "Platform outages and maintenance windows."],
                  ["email_product", "Product news", "New platforms and feature releases."],
                ] as [keyof Preferences, string, string][]
              ).map(([key, label, hint]) => (
                <label key={key} className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={preferences[key]}
                    onChange={(event) =>
                      setPreferences({ ...preferences, [key]: event.target.checked })
                    }
                    className="mt-0.5 h-4 w-4 rounded border-input"
                  />
                  <span>
                    <span className="font-medium">{label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>
                  </span>
                </label>
              ))}
              <button
                type="button"
                onClick={savePreferences}
                disabled={busy}
                className="btn btn-primary mt-2 w-full"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save preferences
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
