"use client";

import * as React from "react";
import {
  Activity,
  CheckCircle2,
  Loader2,
  Pause,
  Play,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Proxy {
  id: number;
  type: string;
  host: string;
  port: number;
  user?: string | null;
  platform?: string | null;
  status: string;
  last_checked?: string | null;
}

interface CheckResult {
  id: number;
  ok: boolean;
  latency_ms?: number;
  ip?: string | null;
  error?: string;
}

interface TestResult {
  ok: boolean;
  latency_ms?: number;
  total_ms?: number;
  ipify: {
    ok: boolean;
    status_code?: number | null;
    latency_ms?: number;
    ip?: string | null;
    error?: string | null;
  };
  platforms: {
    platform: string;
    ok: boolean;
    status_code?: number;
    latency_ms?: number;
    error?: string;
  }[];
}

const formatChecked = (value?: string | null) => {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function ProxyManagementPage() {
  const [proxies, setProxies] = React.useState<Proxy[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<number | null>(null);
  const [checking, setChecking] = React.useState<number | null>(null);
  const [checks, setChecks] = React.useState<Record<number, CheckResult>>({});
  const [type, setType] = React.useState("http");
  const [host, setHost] = React.useState("");
  const [port, setPort] = React.useState("");
  const [user, setUser] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [platform, setPlatform] = React.useState("");
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<TestResult | null>(null);

  const loadProxies = React.useCallback(async () => {
    try {
      const data = await apiFetch<Proxy[]>("/v1/admin/proxies");
      setProxies(data);
      setError("");
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Failed to load proxies");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const data = await apiFetch<Proxy[]>("/v1/admin/proxies");
        if (!active) return;
        setProxies(data);
        setError("");
      } catch (exc) {
        if (!active) return;
        setError(exc instanceof Error ? exc.message : "Failed to load proxies");
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, []);

  const notify = (message: string) => {
    setSuccess(message);
    setError("");
    window.setTimeout(() => setSuccess(""), 3500);
  };

  const testProxyBeforeAdd = async () => {
    if (!host || !port) {
      setError("Host and port are required");
      return;
    }
    const parsedPort = Number.parseInt(port, 10);
    if (!Number.isFinite(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
      setError("Port must be between 1 and 65535");
      return;
    }
    setTesting(true);
    setError("");
    try {
      const result = await apiFetch<TestResult>("/v1/admin/proxies/test", {
        method: "POST",
        body: JSON.stringify({
          type,
          host,
          port: parsedPort,
          user: user || undefined,
          password: password || undefined,
          platform: platform || undefined,
        }),
      });
      setTestResult(result);
    } catch (exc) {
      setTestResult(null);
      setError(exc instanceof Error ? exc.message : "Proxy check failed");
    } finally {
      setTesting(false);
    }
  };

  const addProxy = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!host || !port) {
      setError("Host and port are required");
      return;
    }
    if (testResult?.ipify?.ok !== true) {
      setError("Check the proxy first and wait for it to pass before adding it.");
      return;
    }
    try {
      await apiFetch("/v1/admin/proxies", {
        method: "POST",
        body: JSON.stringify({
          type,
          host,
          port: Number.parseInt(port, 10),
          user: user || undefined,
          password: password || undefined,
          platform: platform || undefined,
        }),
      });
      setHost("");
      setPort("");
      setUser("");
      setPassword("");
      setPlatform("");
      setTestResult(null);
      notify("Proxy added");
      await loadProxies();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Failed to add proxy");
    }
  };

  const deleteProxy = async (id: number) => {
    if (!window.confirm("Delete this proxy?")) return;
    setBusy(id);
    try {
      await apiFetch(`/v1/admin/proxies/${id}`, { method: "DELETE" });
      notify("Proxy deleted");
      await loadProxies();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Failed to delete proxy");
    } finally {
      setBusy(null);
    }
  };

  const toggleProxy = async (proxy: Proxy) => {
    setBusy(proxy.id);
    try {
      await apiFetch(`/v1/admin/proxies/${proxy.id}/toggle`, { method: "PATCH" });
      notify(proxy.status === "active" ? "Proxy paused" : "Proxy activated");
      await loadProxies();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Failed to toggle proxy");
    } finally {
      setBusy(null);
    }
  };

  const checkProxy = async (id: number) => {
    setChecking(id);
    try {
      const result = await apiFetch<CheckResult>(`/v1/admin/proxies/${id}/check`, {
        method: "POST",
      });
      setChecks((current) => ({ ...current, [id]: result }));
      if (!result.ok) {
        setError(result.error || "Proxy check failed");
      } else {
        setError("");
      }
      await loadProxies();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Proxy check failed");
    } finally {
      setChecking(null);
    }
  };

  const active = proxies.filter((proxy) => proxy.status === "active").length;
  const inactive = proxies.length - active;
  const platforms = new Set(
    proxies.map((proxy) => proxy.platform).filter((value): value is string => Boolean(value)),
  ).size;

  return (
    <div>
      <PageHeader
        eyebrow="Infrastructure"
        title="Proxy management"
        description="Configure and rotate proxies for download requests to avoid rate limits."
        actions={
          <button type="button" className="btn btn-outline" onClick={loadProxies}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active proxies" value={String(active)} hint={`${proxies.length} total`} icon={ShieldCheck} tone="primary" />
        <StatCard label="Paused" value={String(inactive)} hint="excluded from rotation" icon={Pause} tone="amber" />
        <StatCard label="Platforms" value={String(platforms)} hint="scoped proxies" icon={Activity} tone="blue" />
        <StatCard label="Rotation mode" value="Auto" hint="direct → proxy fallback" icon={RefreshCw} tone="accent" />
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent">
          {success}
        </div>
      )}

      <form onSubmit={addProxy} className="surface mt-4 p-5">
        <h2 className="mb-4 font-semibold">Add new proxy</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <label htmlFor="proxy-type" className="text-sm font-medium">Type</label>
            <select
              id="proxy-type"
              value={type}
              onChange={(event) => { setType(event.target.value); setTestResult(null); }}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="http">http</option>
              <option value="https">https</option>
              <option value="socks5">socks5</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="proxy-host" className="text-sm font-medium">Host</label>
            <input
              id="proxy-host"
              value={host}
              onChange={(event) => { setHost(event.target.value); setTestResult(null); }}
              placeholder="136.162.138.42"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="proxy-port" className="text-sm font-medium">Port</label>
            <input
              id="proxy-port"
              value={port}
              onChange={(event) => { setPort(event.target.value); setTestResult(null); }}
              placeholder="41217"
              type="number"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="proxy-user" className="text-sm font-medium">Username</label>
            <input
              id="proxy-user"
              value={user}
              onChange={(event) => { setUser(event.target.value); setTestResult(null); }}
              placeholder="optional"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="proxy-password" className="text-sm font-medium">Password</label>
            <input
              id="proxy-password"
              value={password}
              onChange={(event) => { setPassword(event.target.value); setTestResult(null); }}
              type="password"
              placeholder="optional"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="proxy-platform" className="text-sm font-medium">Platform</label>
            <select
              id="proxy-platform"
              value={platform}
              onChange={(event) => { setPlatform(event.target.value); setTestResult(null); }}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All platforms</option>
              <option value="youtube">YouTube</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="tiktok">TikTok</option>
            </select>
          </div>
        </div>
        {testResult && (
          <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4 text-sm">
            <span className={cn("inline-flex items-center gap-1.5 font-semibold", testResult.ipify.ok ? "text-accent" : "text-destructive")}>
              {testResult.ipify.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {testResult.ipify.ok
                ? `Exit IP ${testResult.ipify.ip ?? "?"} · ${testResult.ipify.latency_ms}ms`
                : `Unreachable${testResult.ipify.error ? ` — ${testResult.ipify.error}` : ""}`}
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {testResult.platforms.map((entry) => (
                <span
                  key={entry.platform}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    entry.ok ? "bg-accent/10 text-accent" : "bg-rose-500/10 text-rose-500",
                  )}
                  title={entry.ok ? `HTTP ${entry.status_code}` : entry.error ?? "unreachable"}
                >
                  {entry.platform}: {entry.ok ? `HTTP ${entry.status_code} · ${entry.latency_ms}ms` : "failed"}
                </span>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Check runs from the API server. Any HTTP response (even a 403 bot-check) means the platform is reachable through this proxy.
            </p>
          </div>
        )}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {testResult?.ipify?.ok
              ? "Proxy passed the exit-IP check. You can add it now."
              : "Run the check first — Add unlocks when the proxy responds."}
          </p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={testProxyBeforeAdd} disabled={testing || !host || !port} className="btn btn-outline">
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />} Check proxy
            </button>
            <button type="submit" disabled={testResult?.ipify?.ok !== true} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50">
              <Plus className="h-4 w-4" /> Add proxy
            </button>
          </div>
        </div>
      </form>

      <div className="surface mt-4 overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold">Proxy pool</h2>
          <p className="text-xs text-muted-foreground">
            Healthy proxies are rotated automatically; failed ones are retried after a backoff.
          </p>
        </div>
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">Loading proxies…</div>
        ) : proxies.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No proxies configured. Add one above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Host:Port</th>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Platform</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Last checked</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {proxies.map((proxy) => {
                  const check = checks[proxy.id];
                  return (
                    <tr key={proxy.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-5 py-4 font-mono">{proxy.type}</td>
                      <td className="px-5 py-4 font-mono">{proxy.host}:{proxy.port}</td>
                      <td className="px-5 py-4">{proxy.user || "—"}</td>
                      <td className="px-5 py-4">{proxy.platform || "all"}</td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold",
                            proxy.status === "active"
                              ? "bg-accent/10 text-accent"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {proxy.status === "active" ? <CheckCircle2 className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                          {proxy.status}
                        </span>
                        {check && (
                          <span
                            className={cn(
                              "ml-2 text-xs",
                              check.ok ? "text-accent" : "text-destructive",
                            )}
                          >
                            {check.ok ? `${check.latency_ms}ms · ${check.ip}` : "unreachable"}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {formatChecked(proxy.last_checked)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => checkProxy(proxy.id)}
                            disabled={checking === proxy.id}
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                            aria-label="Test proxy"
                            title="Test proxy"
                          >
                            <Activity className={cn("h-4 w-4", checking === proxy.id && "animate-pulse")} />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleProxy(proxy)}
                            disabled={busy === proxy.id}
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                            aria-label={proxy.status === "active" ? "Pause proxy" : "Activate proxy"}
                            title={proxy.status === "active" ? "Pause" : "Activate"}
                          >
                            {proxy.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteProxy(proxy.id)}
                            disabled={busy === proxy.id}
                            className="rounded-lg p-2 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40"
                            aria-label="Delete proxy"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
