import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, KeyRound, Gauge, FileJson } from "lucide-react";
import { CodeWindow } from "@/components/marketing/code-window";
import { platforms } from "@/lib/content";

export function generateStaticParams() {
  return platforms.map((platform) => ({ slug: platform.slug }));
}

export default async function PlatformAPIPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const platform = platforms.find((item) => item.slug === slug);
  if (!platform) notFound();

  const infoExample = `curl -X POST https://dltapi.cc.cd/v1/dlt/${platform.slug}/info \\
  -H "Authorization: Bearer dl_live_xxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://${platform.slug}.com/…"
  }'`;

  const downloadExample = `curl -X POST https://dltapi.cc.cd/v1/dlt/${platform.slug}/download \\
  -H "Authorization: Bearer dl_live_xxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://${platform.slug}.com/…",
    "format": "mp4"
  }'`;

  const responseExample = `{
  "success": true,
  "platform": "${platform.slug}",
  "request_id": "dl_9f2c1a8b3d04",
  "data": {
    "title": "Media title",
    "duration": 212,
    "thumbnail": "https://…/thumb.jpg",
    "formats": [
      { "id": "video", "ext": "mp4", "quality": "1080p" },
      { "id": "audio", "ext": "m4a", "quality": "128kbps" }
    ]
  },
  "error": null
}`;

  return (
    <div>
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <Link
            href="/apis"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> All APIs
          </Link>
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${platform.chip}`}>
                <platform.icon className="h-7 w-7" />
              </span>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{platform.name} API</h1>
                <p className="text-sm text-muted-foreground">{platform.description}</p>
              </div>
            </div>
            <Link href="/register" className="btn btn-primary shrink-0">
              Get an API key
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div className="min-w-0 space-y-8">
            <div className="surface p-6">
              <h2 className="text-lg font-semibold">Endpoints</h2>
              <div className="mt-4 space-y-3">
                {platform.endpoints.map((endpoint) => (
                  <div key={endpoint.path} className="rounded-xl border border-border bg-muted/30 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">
                        {endpoint.method}
                      </span>
                      <code className="font-mono text-xs font-medium">{endpoint.path}</code>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {endpoint.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <CodeWindow
              title={`${platform.name} — examples`}
              examples={[
                { label: "Info", language: "bash", code: infoExample },
                { label: "Download", language: "bash", code: downloadExample },
                { label: "Response", language: "json", code: responseExample },
              ]}
            />

            <div className="surface p-6">
              <h2 className="text-lg font-semibold">Request body</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="pb-3 font-semibold">Field</th>
                      <th className="pb-3 font-semibold">Type</th>
                      <th className="pb-3 font-semibold">Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { field: "url", type: "string", required: "yes" },
                      { field: "format", type: "string", required: "download only" },
                      { field: "quality", type: "string", required: "no" },
                    ].map((row) => (
                      <tr key={row.field} className="border-b border-border last:border-0">
                        <td className="py-3 font-mono text-xs">{row.field}</td>
                        <td className="py-3 text-muted-foreground">{row.type}</td>
                        <td className="py-3 text-muted-foreground">{row.required}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="surface p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <KeyRound className="h-4 w-4 text-primary" /> Authentication
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Pass your key as a Bearer token. Keys are scoped per platform and can be
                rotated at any time.
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-muted/60 p-3 text-[11px]">
                <code>Authorization: Bearer dl_live_xxxxxxxx</code>
              </pre>
            </div>

            <div className="surface p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Gauge className="h-4 w-4 text-primary" /> Rate limits
              </div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center justify-between gap-2">
                  <span>Free</span>
                  <span className="font-mono text-xs">10 req/min</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span>Starter</span>
                  <span className="font-mono text-xs">60 req/min</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span>Pro</span>
                  <span className="font-mono text-xs">300 req/min</span>
                </li>
              </ul>
            </div>

            <div className="surface p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileJson className="h-4 w-4 text-primary" /> Response envelope
              </div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {["success", "platform", "request_id", "data", "error"].map((field) => (
                  <li key={field} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-accent" />
                    <code className="text-xs">{field}</code>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
