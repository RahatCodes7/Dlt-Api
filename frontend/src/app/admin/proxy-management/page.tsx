"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, RefreshCw, Play, Pause, Save, Plus } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Proxy {
  id: number;
  type: string;
  host: string;
  port: number;
  user?: string;
  platform?: string;
  status: string;
  last_checked?: string;
  created_at: string;
}

export default function ProxyManagementPage() {
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("http");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [platform, setPlatform] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchProxies();
  }, []);

  async function fetchProxies() {
    try {
      const res = await fetch(`${API_BASE}/v1/admin/proxies`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setProxies(data);
      } else {
        setError("Failed to load proxies");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function addProxy() {
    if (!host || !port) {
      setError("Host and port are required");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/v1/admin/proxies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type,
          host,
          port: parseInt(port),
          user: user || undefined,
          password: password || undefined,
          platform: platform || undefined,
        }),
      });
      if (res.ok) {
        setSuccess("Proxy added successfully");
        setHost("");
        setPort("");
        setUser("");
        setPassword("");
        setPlatform("");
        fetchProxies();
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to add proxy");
      }
    } catch (err) {
      setError("Network error");
    }
  }

  async function deleteProxy(id: number) {
    if (!window.confirm("Delete this proxy?")) return;
    try {
      const res = await fetch(`${API_BASE}/v1/admin/proxies/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setSuccess("Proxy deleted");
        fetchProxies();
      } else {
        setError("Failed to delete proxy");
      }
    } catch (err) {
      setError("Network error");
    }
  }

  async function toggleProxy(id: number, currentStatus: string) {
    try {
      const res = await fetch(`${API_BASE}/v1/admin/proxies/${id}/toggle`, {
        method: "PATCH",
        credentials: "include",
      });
      if (res.ok) {
        setSuccess(`Proxy ${currentStatus === "active" ? "paused" : "activated"}`);
        fetchProxies();
      } else {
        setError("Failed to toggle proxy");
      }
    } catch (err) {
      setError("Network error");
    }
  }

  return (
    <div className="px-6 py-8">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold">Proxy Management</h1>
          <p className="text-muted-foreground">
            Configure and rotate proxies for download requests to avoid rate limits.
          </p>
        </div>
        <Button onClick={fetchProxies}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 mb-6">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald/50 bg-emerald/10 p-4 mb-6">
          <p className="text-sm text-emerald-700">{success}</p>
        </div>
      )}

      {/* Add Proxy Form */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-card p-6 mb-8">
        <h3 className="font-bold text-lg mb-6">Add New Proxy</h3>
        <form onSubmit={(e) => { e.preventDefault(); addProxy(); }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Type</label>
            <Input
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="http"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Host</label>
            <Input
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="136.162.138.42"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Port</label>
            <Input
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="41217"
              type="number"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Username</label>
            <Input
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="optional"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Password</label>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="optional"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Platform (optional)</label>
            <Input
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder="youtube, instagram, etc."
            />
          </div>
          <div className="space-y-2">
            <label className="hidden">Action</label>
            <Button type="submit" className="w-full py-3">
              <Plus className="h-4 w-4 mr-2" /> Add Proxy
            </Button>
          </div>
        </form>
      </div>

      {/* Proxy List */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-card">
        <h3 className="font-bold text-lg mb-6">Active Proxies</h3>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading proxies...</div>
        ) : proxies.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No proxies configured. Add one above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-muted-foreground">
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Host:Port</th>
                  <th className="py-4 px-6">Username</th>
                  <th className="py-4 px-6">Platform</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Added</th>
                  <th className="py-4 px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {proxies.map((p) => (
                  <tr key={p.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-muted/30">
                    <td className="py-4 px-6 font-mono">{p.type}</td>
                    <td className="py-4 px-6 font-mono">{p.host}:{p.port}</td>
                    <td className="py-4 px-6">{p.user || "-"}</td>
                    <td className="py-4 px-6">{p.platform || "all"}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        p.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}>
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleProxy(p.id, p.status)}
                        >
                          {p.status === "active" ? (
                            <>
                              <Pause className="h-4 w-4" /> Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4" /> Activate
                            </>
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteProxy(p.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
