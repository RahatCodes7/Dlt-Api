import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  Gauge,
  KeyRound,
  Network,
  Package,
  Rocket,
} from "lucide-react";
import { CodeWindow } from "@/components/marketing/code-window";

const nav = [
  { id: "quick-start", label: "Quick start", icon: Rocket },
  { id: "authentication", label: "Authentication", icon: KeyRound },
  { id: "endpoints", label: "Endpoints", icon: Network },
  { id: "rate-limits", label: "Rate limits", icon: Gauge },
  { id: "errors", label: "Errors", icon: AlertTriangle },
  { id: "sdks", label: "SDKs & examples", icon: Package },
];

const setupCode = `# 1. Create an account
open https://dltapi.cc.cd/register

# 2. Generate a key in Dashboard → API Keys

# 3. Make your first request
curl -X POST https://dltapi.cc.cd/v1/dlt/youtube/info \\
  -H "Authorization: Bearer dl_live_xxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{ "url": "https://youtube.com/watch?v=dQw4w9WgXcQ" }'`;

const authCode = `curl https://dltapi.cc.cd/v1/dlt/account/quota \\
  -H "Authorization: Bearer dl_live_xxxxxxxx"

# 200 OK
{
  "plan": "starter",
  "limit": 5000,
  "used": 230,
  "remaining": 4770,
  "resets_at": "2026-12-01T00:00:00Z"
}`;

const errorCode = `{
  "success": false,
  "platform": "youtube",
  "request_id": "dl_9f2c1a8b3d04",
  "data": null,
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "Monthly request quota reached.",
    "retry_after": null
  }
}`;

const sdkCode = `import { DltClient } from "@deleteapi/sdk";

const dlt = new DltClient({ apiKey: process.env.DLT_KEY });

const info = await dlt.youtube.info({
  url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
});

const download = await dlt.youtube.download({
  url: info.url,
  format: "mp4",
});`;

const errors = [
  { status: "400", code: "INVALID_URL", message: "The provided URL is not a supported media URL." },
  { status: "401", code: "UNAUTHORIZED", message: "Missing or invalid API key." },
  { status: "404", code: "NOT_FOUND", message: "The media could not be resolved." },
  { status: "429", code: "RATE_LIMITED", message: "Too many requests. Respect retry-after." },
  { status: "429", code: "QUOTA_EXCEEDED", message: "Monthly request quota reached." },
  { status: "502", code: "UPSTREAM_ERROR", message: "The platform returned an unexpected response." },
];

export default function DocumentationPage() {
  return (
    <div>
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <BookOpen className="h-3.5 w-3.5" /> Documentation
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Build with DELETE API
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Everything you need to authenticate, call the endpoints, and handle the
            edge cases. If you get stuck, support@deleteapi.com is a real inbox.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
          <aside className="hidden lg:block">
            <nav className="sticky top-24 space-y-1" aria-label="Documentation sections">
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                On this page
              </p>
              {nav.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <item.icon className="h-4 w-4" /> {item.label}
                </a>
              ))}
              <div className="mt-6 rounded-xl border border-border bg-card p-4">
                <p className="text-sm font-semibold">Need a key?</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  The free tier takes under a minute to set up.
                </p>
                <Link href="/register" className="mt-3 inline-flex text-xs font-semibold text-primary hover:underline">
                  Create an account →
                </Link>
              </div>
            </nav>
          </aside>

          <div className="prose-doc min-w-0 max-w-4xl">
            <section id="quick-start" className="scroll-mt-24">
              <h2 className="mt-0">Quick start</h2>
              <p>
                Every integration follows the same three steps: create an account,
                generate a key, and send a request. The API returns JSON and uses
                standard HTTP status codes.
              </p>
              <CodeWindow
                title="Your first request"
                examples={[{ label: "Terminal", language: "bash", code: setupCode }]}
                className="my-6"
              />
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["1. Account", "Register with email or Google."],
                  ["2. Key", "Create a scoped key in the dashboard."],
                  ["3. Request", "Call any platform endpoint."],
                ].map(([title, description]) => (
                  <div key={title} className="rounded-xl border border-border bg-card p-4">
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="authentication" className="scroll-mt-24">
              <h2>Authentication</h2>
              <p>
                Authenticate with a Bearer token in the <code>Authorization</code>{" "}
                header. Keys are hashed at rest and can be scoped to individual
                platforms. Never expose a key in client-side code.
              </p>
              <CodeWindow
                title="Authenticated request"
                examples={[{ label: "cURL", language: "bash", code: authCode }]}
                className="my-6"
              />
            </section>

            <section id="endpoints" className="scroll-mt-24">
              <h2>Endpoints</h2>
              <p>
                All platform endpoints live under <code>/v1/dlt/&lt;platform&gt;</code>.
                The platform slug is the only part that changes between sources.
              </p>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-3 font-semibold">Method</th>
                      <th className="px-4 py-3 font-semibold">Path</th>
                      <th className="px-4 py-3 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["POST", "/v1/dlt/{platform}/info", "Resolve metadata and formats."],
                      ["POST", "/v1/dlt/{platform}/download", "Request an authorized download."],
                      ["GET", "/v1/dlt/files/{token}", "Stream a completed file."],
                      ["GET", "/v1/dlt/account/quota", "Check remaining quota."],
                      ["GET", "/v1/dlt/account/keys", "List API keys."],
                      ["POST", "/v1/dlt/account/keys", "Create a new API key."],
                    ].map(([method, path, description]) => (
                      <tr key={`${method}-${path}`} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          <span className="rounded bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">
                            {method}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{path}</td>
                        <td className="px-4 py-3 text-muted-foreground">{description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section id="rate-limits" className="scroll-mt-24">
              <h2>Rate limits</h2>
              <p>
                Limits are applied per key and returned in response headers. When you
                receive a <code>429</code>, back off using the <code>Retry-After</code>{" "}
                header instead of retrying immediately.
              </p>
              <ul>
                <li><code>X-RateLimit-Limit</code> — requests allowed in the window</li>
                <li><code>X-RateLimit-Remaining</code> — requests left in the window</li>
                <li><code>X-RateLimit-Reset</code> — unix timestamp for the reset</li>
              </ul>
            </section>

            <section id="errors" className="scroll-mt-24">
              <h2>Errors</h2>
              <p>
                Errors use the same envelope as successful responses. Check{" "}
                <code>success</code> first, then read <code>error.code</code> for a
                stable, machine-readable value.
              </p>
              <CodeWindow
                title="Error response"
                examples={[{ label: "JSON", language: "json", code: errorCode }]}
                className="my-6"
              />
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Code</th>
                      <th className="px-4 py-3 font-semibold">Meaning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errors.map((error) => (
                      <tr key={error.code} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-mono text-xs">{error.status}</td>
                        <td className="px-4 py-3 font-mono text-xs">{error.code}</td>
                        <td className="px-4 py-3 text-muted-foreground">{error.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section id="sdks" className="scroll-mt-24">
              <h2>SDKs & examples</h2>
              <p>
                Use the REST API directly or install one of the official SDKs. The
                examples below use the JavaScript SDK; Python and PHP follow the same
                shape.
              </p>
              <CodeWindow
                title="JavaScript SDK"
                examples={[
                  { label: "JavaScript", language: "ts", code: sdkCode },
                  {
                    label: "Python",
                    language: "python",
                    code: `from deleteapi import Client\n\nclient = Client(api_key="dl_live_xxxxxxxx")\ninfo = client.youtube.info(url="https://youtube.com/watch?v=…")\nprint(info["title"])`,
                  },
                  {
                    label: "PHP",
                    language: "php",
                    code: `$dlt = new \\DeleteApi\\Client('dl_live_xxxxxxxx');\n$info = $dlt->youtube()->info([\n  'url' => 'https://youtube.com/watch?v=…'\n]);\necho $info['title'];`,
                  },
                ]}
                className="my-6"
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
