"use client";

import { useState } from "react";
import { Plus, Trash2, RotateCcw, Copy, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/input";

const keys = [
  { id: "1", name: "Production Key", platforms: ["youtube", "instagram"], status: "active", lastUsed: "2h ago", key: "dl_live_abcd1234..." },
  { id: "2", name: "Staging Key", platforms: ["facebook", "tiktok"], status: "active", lastUsed: "1d ago", key: "dl_live_wxyz5678..." },
  { id: "3", name: "Old Key", platforms: ["youtube"], status: "revoked", lastUsed: "30d ago", key: "dl_live_revoked..." },
];

export default function APIKeysPage() {
  const [showKey, setShowKey] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;
    setShowKey("dl_live_newkey_" + Math.random().toString(36).slice(2));
  };

  const handleRevoke = (id: string) => {
    if (window.confirm("Revoke this API key?")) {
      // handle revoke
    }
  };

  return (
    <div className="px-6 py-8">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">Manage your API keys for authentication.</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button onClick={handleCreateKey} className="w-full">
            <Plus className="h-4 w-4 mr-2" /> Create API Key
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {keys.map((key) => (
          <div key={key.id} className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-card flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{key.name}</h3>
                <Badge variant={key.status === "active" ? "success" : "destructive"}>
                  {key.status.charAt(0).toUpperCase() + key.status.slice(1)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{key.platforms.join(", ")}</p>
              <p className="text-xs text-muted-foreground mt-1">Last used: {key.lastUsed}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-muted/50 p-3 rounded-lg">
                <span className="text-xs font-mono text-muted-foreground">{showKey === key.id ? key.key : "••••••••"}</span>
                {showKey === key.id ? (
                  <button onClick={() => setShowKey(null)} className="text-muted-foreground hover:text-primary"><EyeOff className="h-4 w-4" /></button>
                ) : (
                  <button onClick={() => setShowKey(key.id)} className="text-muted-foreground hover:text-primary"><Eye className="h-4 w-4" /></button>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(key.key)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleRevoke(key.id)} className="text-destructive border-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showKey && (
        <div className="mt-8 p-6 rounded-2xl border border-primary bg-primary/5">
          <h3 className="font-bold mb-4">New API Key Created</h3>
          <p className="text-sm text-muted-foreground mb-4">Copy your key now. It won't be shown again.</p>
          <div className="flex items-center gap-3 mb-4">
            <span className="flex-1 bg-background p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-mono break-all">{showKey}</span>
            <Button onClick={() => navigator.clipboard.writeText(showKey)}>Copy Key</Button>
          </div>
          <p className="text-xs text-muted-foreground">Store this key securely. You can regenerate or revoke it anytime from this page.</p>
        </div>
      )}
    </div>
  );
}
