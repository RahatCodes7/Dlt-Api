"use client";

import * as React from "react";
import { Check, Copy, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CodeExample {
  label: string;
  language?: string;
  code: string;
}

export function CodeWindow({
  examples,
  title = "request",
  className,
}: {
  examples: CodeExample[];
  title?: string;
  className?: string;
}) {
  const [active, setActive] = React.useState(0);
  const [copied, setCopied] = React.useState(false);

  const current = examples[active];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(current.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        </div>
        <div className="flex min-w-0 items-center gap-1">
          {examples.map((example, index) => (
            <button
              key={example.label}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                index === active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {example.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Copy code"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <Terminal className="h-3.5 w-3.5" />
        {title}
        <span className="ml-auto font-mono normal-case tracking-normal text-muted-foreground/70">
          {current.language ?? "bash"}
        </span>
      </div>
      <pre className="code-block max-h-[380px] overflow-auto p-5 text-[12.5px] leading-relaxed sm:text-sm">
        <code>{current.code}</code>
      </pre>
    </div>
  );
}
