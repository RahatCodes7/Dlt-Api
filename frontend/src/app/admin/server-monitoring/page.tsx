"use client";

import * as React from "react";
import { Activity, Cpu, Download, Loader2, MemoryStick, Database, RefreshCw, Server } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { apiFetch } from "@/lib/api";

interface ServerData {
  app: { version: string; python: string; platform: string; uptime_seconds: number };
  disk: { total_mb: number; used_mb: number; free_mb: number } | null;
  downloads: { directory: string; size_mb: number; files: number; active_tokens: number };
  memory: { total_mb: number; available_mb: number; used_mb: number } | null;
  load_avg: [number, number, number] | null;
  redis: string;
}

const formatBytes = (mb: number) => (mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`);

const uptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
};

export default function AdminServerMonitoringPage() {
  const [data, setData] = React.useState<ServerData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      setData(await apiFetch<ServerData>("/v1/admin/monitoring/server"));
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load server metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const memoryPercent = data?.memory ? Math.round((data.memory.used_mb / data.memory.total_mb) * 100) : null;
  const diskPercent = data?.disk ? Math.round((data.disk.used_mb / data.disk.total_mb) * 100) : null;

  return (
    <div>
      <PageHeader
        eyebrow="Admin · System"
        title="Server monitoring"
        description="Live process, memory, disk, and download-cache metrics from the API host."
        actions={<button onClick={() => { setLoading(true); load(); }} className="btn btn-outline"><RefreshCw className="h-4 w-4" /> Refresh</button>}
      />

      {error && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {loading || !data ? (
        <div className="flex min-h-[240px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Uptime" value={uptime(data.app.uptime_seconds)} hint={`v${data.app.version} · Python ${data.app.python}`} icon={Server} tone="primary" />
            <StatCard label="Load average (1m)" value={data.load_avg ? data.load_avg[0].toFixed(2) : "—"} hint={data.load_avg ? `5m ${data.load_avg[1].toFixed(2)} · 15m ${data.load_avg[2].toFixed(2)}` : "Not available on this platform"} icon={Activity} tone="blue" />
            <StatCard label="Memory used" value={memoryPercent != null ? `${memoryPercent}%` : "—"} hint={data.memory ? `${formatBytes(data.memory.used_mb)} of ${formatBytes(data.memory.total_mb)}` : "Not available"} icon={MemoryStick} tone={memoryPercent != null && memoryPercent > 85 ? "rose" : "amber"} />
            <StatCard label="Disk used" value={diskPercent != null ? `${diskPercent}%` : "—"} hint={data.disk ? `${formatBytes(data.disk.used_mb)} of ${formatBytes(data.disk.total_mb)}` : "Not available"} icon={Cpu} tone={diskPercent != null && diskPercent > 85 ? "rose" : "accent"} />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="surface p-6">
              <h2 className="flex items-center gap-2 font-semibold"><Download className="h-5 w-5 text-primary" /> Download cache</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">Directory</dt><dd className="max-w-[260px] truncate font-mono text-xs" title={data.downloads.directory}>{data.downloads.directory}</dd></div>
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">Cached size</dt><dd className="font-mono">{formatBytes(data.downloads.size_mb)}</dd></div>
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">Files</dt><dd className="font-mono">{data.downloads.files}</dd></div>
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">Active download tokens</dt><dd className="font-mono">{data.downloads.active_tokens}</dd></div>
              </dl>
            </div>
            <div className="surface p-6">
              <h2 className="flex items-center gap-2 font-semibold"><Database className="h-5 w-5 text-primary" /> Infrastructure</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">Redis</dt><dd><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${data.redis === "up" ? "bg-accent/10 text-accent" : data.redis === "down" ? "bg-rose-500/10 text-rose-500" : "bg-muted text-muted-foreground"}`}>{data.redis}</span></dd></div>
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">Platform</dt><dd className="font-mono">{data.app.platform}</dd></div>
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">Disk free</dt><dd className="font-mono">{data.disk ? formatBytes(data.disk.free_mb) : "—"}</dd></div>
                <div className="flex items-center justify-between"><dt className="text-muted-foreground">RAM available</dt><dd className="font-mono">{data.memory ? formatBytes(data.memory.available_mb) : "—"}</dd></div>
              </dl>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
