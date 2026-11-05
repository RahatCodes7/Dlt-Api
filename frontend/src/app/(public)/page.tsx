import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Code2,
  Gauge,
  Globe2,
  KeyRound,
  Layers,
  Lock,
  Server,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { CodeWindow } from "@/components/marketing/code-window";
import { FAQAccordion } from "@/components/marketing/faq-accordion";
import { faqs, plans, platforms, stats } from "@/lib/content";

const features = [
  {
    icon: Layers,
    title: "One API, every platform",
    description:
      "A single request shape for YouTube, Instagram, Facebook, and TikTok. Add a platform without rewriting your integration.",
  },
  {
    icon: Zap,
    title: "Fast by default",
    description:
      "Metadata responses in under 200ms at the median, with connection reuse and smart caching in front of the extractors.",
  },
  {
    icon: ShieldCheck,
    title: "Stable contracts",
    description:
      "Upstream platform changes are absorbed by our engine. Your response schema stays consistent release after release.",
  },
  {
    icon: KeyRound,
    title: "Keys and quotas",
    description:
      "Scoped API keys, hard quotas, and per-platform limits so a runaway job can never surprise your bill.",
  },
  {
    icon: Gauge,
    title: "Usage analytics",
    description:
      "Requests, success rate, latency, and platform mix — measured per key so you can see exactly what is happening.",
  },
  {
    icon: Server,
    title: "Production plumbing",
    description:
      "Proxy rotation, retries, background cleanup, and health checks are built in rather than bolted on.",
  },
];

const steps = [
  {
    icon: KeyRound,
    title: "Create an account",
    description: "Sign up and generate a scoped API key in under a minute. No credit card required.",
  },
  {
    icon: Code2,
    title: "Pick an endpoint",
    description: "Call /info to inspect media, then /download to stream the file you need.",
  },
  {
    icon: Sparkles,
    title: "Ship it",
    description: "Watch usage in the dashboard, set quotas, and scale from free to enterprise.",
  },
];

const curlExample = `curl -X POST https://api.deleteapi.com/v1/dlt/youtube/info \\
  -H "Authorization: Bearer dl_live_xxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://youtube.com/watch?v=dQw4w9WgXcQ"
  }'`;

const jsExample = `import { DltClient } from "@deleteapi/sdk";

const dlt = new DltClient({ apiKey: process.env.DLT_KEY });

const info = await dlt.youtube.info({
  url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
});

console.log(info.formats);`;

const pythonExample = `from deleteapi import Client

client = Client(api_key="dl_live_xxxxxxxx")

info = client.youtube.info(
    url="https://youtube.com/watch?v=dQw4w9WgXcQ"
)

print(info["title"], info["duration"])`;

const responseExample = `{
  "success": true,
  "platform": "youtube",
  "request_id": "dl_9f2c1a8b3d04",
  "data": {
    "title": "Example video",
    "duration": 212,
    "uploader": "DELETE",
    "formats": [
      { "id": "137", "ext": "mp4", "height": 1080 },
      { "id": "140", "ext": "m4a", "abr": 128 }
    ]
  },
  "error": null
}`;

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative isolate">
        <div className="pointer-events-none absolute inset-0 -z-10 dot-bg opacity-60" />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--color-primary)_16%,transparent),transparent)]" />
        <div className="pointer-events-none absolute -left-32 top-24 -z-10 h-80 w-80 rounded-full bg-accent/10 blur-3xl animate-pulse-slow" />
        <div className="pointer-events-none absolute -right-24 top-40 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-pulse-slow" />

        <div className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24 lg:pb-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3.5 py-1.5 text-xs font-semibold text-accent">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
                All systems operational
              </div>

              <h1 className="mt-6 text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Download APIs for the{" "}
                <span className="text-gradient">modern web</span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Professional download infrastructure for YouTube, Instagram, Facebook,
                and TikTok. One key, one consistent schema, built on yt-dlp and tuned
                for production.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="btn btn-accent group px-6 py-3.5 text-base"
                >
                  Get started free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/documentation"
                  className="btn btn-outline px-6 py-3.5 text-base"
                >
                  Read the docs
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-accent" /> 100 free requests
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-accent" /> No credit card
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-accent" /> Cancel anytime
                </span>
              </div>
            </div>

            <div className="relative animate-fade-up [animation-delay:120ms]">
              <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-primary/15 via-transparent to-accent/15 blur-2xl" />
              <CodeWindow
                title="POST /v1/dlt/youtube/info"
                examples={[
                  { label: "cURL", language: "bash", code: curlExample },
                  { label: "JavaScript", language: "ts", code: jsExample },
                  { label: "Python", language: "python", code: pythonExample },
                  { label: "Response", language: "json", code: responseExample },
                ]}
              />
              <div className="absolute -bottom-5 -left-4 hidden items-center gap-2 rounded-xl border border-border bg-card/90 px-3 py-2 shadow-lg backdrop-blur sm:flex">
                <Globe2 className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">Global edge, 12 regions</span>
              </div>
              <div className="absolute -right-3 -top-4 hidden items-center gap-2 rounded-xl border border-border bg-card/90 px-3 py-2 shadow-lg backdrop-blur sm:flex">
                <Lock className="h-4 w-4 text-accent" />
                <span className="text-xs font-medium">TLS + hashed keys</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform strip */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              One integration — four platforms
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              {platforms.map((platform) => (
                <div key={platform.slug} className="flex items-center gap-2 opacity-75">
                  <platform.icon className={`h-5 w-5 ${platform.accent}`} />
                  <span className="text-sm font-semibold">{platform.name}</span>
                </div>
              ))}
              <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                + more soon
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="surface p-5 transition-colors hover:border-primary/30">
              <p className="text-3xl font-bold tracking-tight sm:text-4xl">{stat.value}</p>
              <p className="mt-1 text-sm font-medium">{stat.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Platforms */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              The catalog
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Available APIs
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Every platform exposes the same info and download contract. Click into
              one to see request examples and response shapes.
            </p>
          </div>
          <Link
            href="/apis"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            View all APIs <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {platforms.map((platform) => (
            <Link
              key={platform.slug}
              href={`/apis/${platform.slug}`}
              className="group surface relative overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
            >
              <div className="flex items-start justify-between">
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${platform.chip}`}>
                  <platform.icon className="h-6 w-6" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{platform.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {platform.description}
              </p>
              <div className="mt-4 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                <span className="rounded-full bg-muted px-2 py-0.5">info</span>
                <span className="rounded-full bg-muted px-2 py-0.5">download</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Why DELETE API
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Boring infrastructure, on purpose
            </h2>
            <p className="mt-3 text-muted-foreground">
              The interesting part should be your product — not maintaining a download
              pipeline that breaks every other week.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              How it works
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              From zero to first download in minutes
            </h2>
            <p className="mt-3 text-muted-foreground">
              No SDK required, though we ship one anyway. If you can send JSON, you
              can use the API.
            </p>
            <div className="mt-8 space-y-6">
              {steps.map((step, index) => (
                <div key={step.title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                      <step.icon className="h-5 w-5" />
                    </span>
                    {index < steps.length - 1 && (
                      <span className="mt-2 h-full w-px flex-1 bg-border" aria-hidden="true" />
                    )}
                  </div>
                  <div className="pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary">
                        0{index + 1}
                      </span>
                      <h3 className="font-semibold">{step.title}</h3>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 blur-2xl" />
            <div className="grid gap-4">
              <div className="surface p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Info request
                  </span>
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
                    200 OK · 142ms
                  </span>
                </div>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-muted/60 p-3 text-xs leading-relaxed">
                  <code>{`POST /v1/dlt/tiktok/info
{ "url": "https://tiktok.com/@user/video/123" }`}</code>
                </pre>
              </div>
              <div className="surface p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Download request
                  </span>
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
                    file ready
                  </span>
                </div>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-muted/60 p-3 text-xs leading-relaxed">
                  <code>{`POST /v1/dlt/tiktok/download
{
  "url": "https://tiktok.com/@user/video/123",
  "format": "mp4"
}`}</code>
                </pre>
              </div>
              <div className="surface flex items-center justify-between p-5">
                <div>
                  <p className="text-sm font-semibold">Quota remaining</p>
                  <p className="text-xs text-muted-foreground">Starter plan</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">4,770</p>
                  <p className="text-xs text-muted-foreground">of 5,000</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="border-y border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Pricing
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-3 text-muted-foreground">
              Start free, upgrade when your traffic does. No hidden fees, no surprise
              overages.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {plans.slice(0, 3).map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  plan.featured
                    ? "border-primary bg-card shadow-xl shadow-primary/10"
                    : "border-border bg-card"
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">
                    ${plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <p className="mt-1 text-xs font-medium text-primary">{plan.requests}</p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                    plan.featured
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border hover:border-primary/40 hover:bg-primary/5"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-border bg-card px-6 py-5 sm:flex-row">
            <div>
              <p className="font-semibold">Need more volume or a custom platform?</p>
              <p className="text-sm text-muted-foreground">
                Dedicated proxies, custom contracts, and SLAs for enterprise teams.
              </p>
            </div>
            <Link href="/contact" className="btn btn-outline shrink-0">
              Talk to sales <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              FAQ
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Questions, answered
            </h2>
            <p className="mt-3 text-muted-foreground">
              Still unsure? Email us at{" "}
              <a
                href="mailto:support@deleteapi.com"
                className="font-medium text-primary hover:underline"
              >
                support@deleteapi.com
              </a>{" "}
              and a human will reply.
            </p>
          </div>
          <FAQAccordion items={faqs.slice(0, 5)} />
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary via-primary to-accent px-6 py-14 text-center text-white sm:px-12">
          <div className="pointer-events-none absolute inset-0 opacity-20 dot-bg" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              Start building with 100 free requests
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/80 sm:text-base">
              Create an account, grab a key, and make your first request in the next
              five minutes.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary shadow-lg transition-transform hover:scale-[1.02]"
              >
                Create free account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Compare plans
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
