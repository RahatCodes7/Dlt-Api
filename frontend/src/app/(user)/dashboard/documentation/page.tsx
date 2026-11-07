"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen, Check, Copy, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { apiFetch } from "@/lib/api";

interface DocEndpoint {
  method: string;
  path: string;
  description: string;
}

interface DocSection {
  id: string;
  title: string;
  summary: string;
  endpoints: DocEndpoint[];
}

interface Documentation {
  base_url: string;
  sections: DocSection[];
}

const methodClass = (method: string) => {
  switch (method) {
    case "POST":
      return "bg-accent/10 text-accent";
    case "GET":
      return "bg-blue-500/10 text-blue-500";
    case "DELETE":
      return "bg-destructive/10 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export default function DocumentationPage() {
  const [data, setData] = React.useState<Documentation | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [copied, setCopied] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch<Documentation>("/v1/session/account/documentation"));
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Could not load documentation");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      setTimeout(() => setCopied(""), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Developer"
        title="Documentation"
        description="Guides, references, and copy-paste examples for every endpoint."
        actions={
          <>
            <button type="button" onClick={load} className="btn btn-outline">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <Link href="/documentation" className="btn btn-primary">
              <ExternalLink className="h-4 w-4" /> Public docs
            </Link>
          </>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading documentation…
        </div>
      ) : !data ? (
        <div className="surface p-10 text-center text-sm text-muted-foreground">
          Documentation is unavailable right now.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="surface flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <h2 className="font-semibold">API base URL</h2>
                <p className="text-xs text-muted-foreground">
                  All requests use the same origin and your Bearer key.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => copy(`${data.base_url}/v1`)}
              className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 font-mono text-xs hover:bg-muted/70"
            >
              {copied === `${data.base_url}/v1` ? (
                <Check className="h-3.5 w-3.5 text-accent" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {data.base_url}/v1
            </button>
          </div>

          {data.sections.map((section) => (
            <div key={section.id} className="surface overflow-hidden">
              <div className="border-b border-border px-5 py-4">
                <h2 className="font-semibold">{section.title}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{section.summary}</p>
              </div>
              <div className="divide-y divide-border">
                {section.endpoints.map((endpoint) => (
                  <div
                    key={`${section.id}-${endpoint.method}-${endpoint.path}`}
                    className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`shrink-0 rounded px-2 py-0.5 font-mono text-[10px] font-bold ${methodClass(endpoint.method)}`}
                      >
                        {endpoint.method}
                      </span>
                      <div className="min-w-0">
                        <code className="block truncate font-mono text-xs">{endpoint.path}</code>
                        <p className="mt-0.5 text-xs text-muted-foreground">{endpoint.description}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copy(`${data.base_url}${endpoint.path}`)}
                      className="inline-flex w-fit items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {copied === `${data.base_url}${endpoint.path}` ? (
                        <Check className="h-3.5 w-3.5 text-accent" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
