import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Layers } from "lucide-react";
import { CodeWindow } from "@/components/marketing/code-window";
import { platforms } from "@/lib/content";

const requestExample = `# All platforms share the same contract
curl -X POST https://api.deleteapi.com/v1/dlt/{platform}/info \\
  -H "Authorization: Bearer dl_live_xxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{ "url": "https://…" }'`;

const responseExample = `{
  "success": true,
  "platform": "youtube",
  "request_id": "dl_9f2c1a8b3d04",
  "data": {
    "title": "…",
    "duration": 212,
    "formats": [{ "id": "137", "ext": "mp4", "height": 1080 }]
  },
  "error": null
}`;

export default function APIsPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 -z-10 dot-bg opacity-50" />
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
            <Layers className="h-3.5 w-3.5" /> Unified API catalog
          </span>
          <h1 className="mt-5 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            One contract for every platform
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Point the same request at any platform slug. Responses share a schema, so
            you can build once and add sources later without touching your parser.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {platforms.map((platform) => (
            <Link
              key={platform.slug}
              href={`/apis/${platform.slug}`}
              className="group surface p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${platform.chip}`}>
                    <platform.icon className="h-6 w-6" />
                  </span>
                  <div>
                    <h2 className="font-semibold">{platform.name} API</h2>
                    <p className="text-xs text-muted-foreground">
                      {platform.endpoints.length} endpoints
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {platform.description}
              </p>
              <div className="mt-5 space-y-2">
                {platform.endpoints.map((endpoint) => (
                  <div
                    key={endpoint.path}
                    className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2"
                  >
                    <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                      {endpoint.method}
                    </span>
                    <code className="truncate font-mono text-[11px] text-muted-foreground">
                      {endpoint.path}
                    </code>
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-muted/30 py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Predictable requests, predictable responses
            </h2>
            <p className="mt-3 text-muted-foreground">
              Auth, error handling, pagination, and rate-limit headers work the same way
              everywhere. The platform is the only variable.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Bearer token authentication on every endpoint",
                "Consistent success / data / error envelope",
                "Per-request IDs for tracing and support",
                "Rate-limit headers on every response",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/documentation"
              className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              Read the integration guide <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <CodeWindow
            title="Same shape, any platform"
            examples={[
              { label: "Request", language: "bash", code: requestExample },
              { label: "Response", language: "json", code: responseExample },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
