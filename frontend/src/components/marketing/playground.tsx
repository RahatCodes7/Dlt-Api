"use client";

import * as React from "react";
import { Check, Copy, Play, RotateCcw, Terminal, Loader2 } from "lucide-react";
import { platforms } from "@/lib/content";

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

interface Result {
  status: number;
  ok: boolean;
  duration: number;
  body: unknown;
  raw: string;
}

export function Playground() {
  const [platform, setPlatform] = React.useState(platforms[0].slug);
  const [endpoint, setEndpoint] = React.useState("info");
  const [url, setUrl] = React.useState("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  const [apiKey, setApiKey] = React.useState("");
  const [format, setFormat] = React.useState("mp4");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<Result | null>(null);
  const [error, setError] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  const requestPath = `/v1/dlt/${platform}/${endpoint}`;

  const curl = React.useMemo(() => {
    const body =
      endpoint === "download"
        ? `{ "url": "${url}", "format": "${format}" }`
        : `{ "url": "${url}" }`;
    return `curl -X POST ${API_BASE}${requestPath} \\\n  -H "Authorization: Bearer ${
      apiKey || "dl_live_xxxxxxxx"
    }" \\\n  -H "Content-Type: application/json" \\\n  -d '${body}'`;
  }, [apiKey, endpoint, format, requestPath, url]);

  const copyCurl = async () => {
    try {
      await navigator.clipboard.writeText(curl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    setResult(null);
    const started = performance.now();
    try {
      const response = await fetch(`${API_BASE}${requestPath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify(
          endpoint === "download" ? { url, format } : { url },
        ),
      });
      const raw = await response.text();
      let body: unknown = raw;
      try {
        body = JSON.parse(raw);
      } catch {
        /* keep raw text */
      }
      setResult({
        status: response.status,
        ok: response.ok,
        duration: Math.round(performance.now() - started),
        body,
        raw,
      });
    } catch {
      setError(
        `Could not reach the API at ${API_BASE}. Is the backend running? You can still copy the cURL request below.`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={send} className="surface p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Request</h2>
          <span className="rounded-full bg-muted px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
            POST
          </span>
        </div>

        <div className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="platform" className="text-sm font-medium">
                Platform
              </label>
              <select
                id="platform"
                value={platform}
                onChange={(event) => {
                  const next = event.target.value;
                  setPlatform(next);
                  if (next !== "youtube") {
                    setUrl(`https://www.${next}.com/…`);
                  }
                }}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {platforms.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="endpoint" className="text-sm font-medium">
                Endpoint
              </label>
              <select
                id="endpoint"
                value={endpoint}
                onChange={(event) => setEndpoint(event.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="info">/info</option>
                <option value="download">/download</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="url" className="text-sm font-medium">
              Media URL
            </label>
            <input
              id="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://…"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {endpoint === "download" && (
            <div className="space-y-1.5">
              <label htmlFor="format" className="text-sm font-medium">
                Format
              </label>
              <select
                id="format"
                value={format}
                onChange={(event) => setFormat(event.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="mp4">mp4</option>
                <option value="mp3">mp3</option>
                <option value="m4a">m4a</option>
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="key" className="text-sm font-medium">
              API key <span className="font-normal text-muted-foreground">(optional for demo)</span>
            </label>
            <input
              id="key"
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="dl_live_xxxxxxxx"
              autoComplete="off"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-3 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Sending request…
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Send request
              </>
            )}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <div className="surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Terminal className="h-4 w-4 text-primary" /> Response
            </div>
            {result && (
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={`rounded-full px-2 py-0.5 font-semibold ${
                    result.ok
                      ? "bg-accent/10 text-accent"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {result.status}
                </span>
                <span className="text-muted-foreground">{result.duration}ms</span>
              </div>
            )}
          </div>
          <div className="min-h-[220px] p-5">
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : result ? (
              <pre className="max-h-[380px] overflow-auto font-mono text-xs leading-relaxed">
                <code>{JSON.stringify(result.body, null, 2)}</code>
              </pre>
            ) : (
              <div className="flex min-h-[180px] flex-col items-center justify-center text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <RotateCcw className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-medium">No request yet</p>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  Choose a platform and endpoint, then send a request to see the JSON
                  response here.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <span className="text-sm font-semibold">Equivalent cURL</span>
            <button
              type="button"
              onClick={copyCurl}
              className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="code-block max-h-[220px] overflow-auto p-5 text-[11.5px] leading-relaxed">
            <code>{curl}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
