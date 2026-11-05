"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, KeyRound, Play, Rocket, Terminal } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const steps = [
  {
    title: "Create an API key",
    body: "Generate a scoped key from the dashboard. Store it server-side as an environment variable.",
    href: "/dashboard/api-keys",
    cta: "Go to API keys",
  },
  {
    title: "Pick a platform and endpoint",
    body: "Every platform exposes the same shape: POST /info for metadata and POST /download for media.",
    href: "/dashboard/my-apis",
    cta: "Browse your APIs",
  },
  {
    title: "Send your first request",
    body: "Call the gateway with your key. Requests are logged, metered, and visible in analytics.",
    href: "/dashboard/api-playground",
    cta: "Open the playground",
  },
];

const snippets: Record<string, string> = {
  cURL: `curl -X POST ${API_BASE}/v1/dlt/youtube/info \\
  -H "Authorization: Bearer $DLT_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'`,
  Python: `import os, requests

response = requests.post(
    "${API_BASE}/v1/dlt/youtube/info",
    headers={"Authorization": f"Bearer {os.environ['DLT_API_KEY']}"},
    json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"},
    timeout=30,
)
response.raise_for_status()
print(response.json())`,
  Node: `const response = await fetch(
  "${API_BASE}/v1/dlt/youtube/info",
  {
    method: "POST",
    headers: {
      Authorization: \`Bearer \${process.env.DLT_API_KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    }),
  },
);

if (!response.ok) throw new Error(await response.text());
console.log(await response.json());`,
};

const languages = Object.keys(snippets);

export default function QuickStartPage() {
  const [language, setLanguage] = React.useState(languages[0]);
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippets[language]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Getting started"
        title="Quick start"
        description="From zero to your first download in three steps. No SDK required."
        actions={
          <Link href="/dashboard/api-playground" className="btn btn-primary">
            <Play className="h-4 w-4" /> Try it live
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step.title} className="surface flex flex-col p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                {index + 1}
              </span>
              <h2 className="font-semibold">{step.title}</h2>
            </div>
            <p className="mt-3 flex-1 text-sm text-muted-foreground">{step.body}</p>
            <Link
              href={step.href}
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              {step.cta} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="surface overflow-hidden lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Terminal className="h-4 w-4 text-primary" /> First request
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
              {languages.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setLanguage(item)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    language === item
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={copy}
              className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-md border border-border bg-background/80 px-2 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <pre className="code-block overflow-x-auto p-5 text-[12px] leading-relaxed">
              <code>{snippets[language]}</code>
            </pre>
          </div>
        </div>

        <div className="space-y-4">
          <div className="surface p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <KeyRound className="h-4 w-4 text-primary" /> Authentication
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Send your key as a bearer token on every request.
            </p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-[11px]">
              <code>Authorization: Bearer dl_live_…</code>
            </pre>
          </div>
          <div className="surface p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <Rocket className="h-4 w-4 text-accent" /> Next steps
            </h2>
            <div className="mt-3 space-y-1">
              {[
                { label: "Read the API reference", href: "/documentation" },
                { label: "Set up error handling", href: "/dashboard/error-logs" },
                { label: "Track usage", href: "/dashboard/usage-analytics" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ArrowRight className="h-3.5 w-3.5" /> {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
