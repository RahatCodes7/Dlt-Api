"use client";

import Link from "next/link";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

const stats = [
  { label: "Platforms Supported", value: "4+", icon: "Layers" },
  { label: "API Requests/Day", value: "1M+", icon: "TrendingUp" },
  { label: "Uptime", value: "99.9%", icon: "ShieldCheck" },
  { label: "Avg Response Time", value: "<200ms", icon: "Clock" },
];

const features = [
  {
    title: "Multi-Platform Support",
    desc: "Download from YouTube, Instagram, Facebook, TikTok and more with a single API.",
    icon: "Play",
  },
  {
    title: "High Performance",
    desc: "Sub-second response times with global edge caching and proxy rotation.",
    icon: "Zap",
  },
  {
    title: "Developer Friendly",
    desc: "RESTful API, comprehensive docs, SDKs in JS, Python, PHP, and cURL examples.",
    icon: "Code2",
  },
  {
    title: "Enterprise Scale",
    desc: "Rate limiting, quota management, billing, and detailed analytics built-in.",
    icon: "BarChart3",
  },
];

const howItWorks = [
  { step: 1, title: "Create Account", desc: "Sign up and get your API key instantly." },
  { step: 2, title: "Choose Platform", desc: "Select YouTube, Instagram, Facebook, or TikTok API." },
  { step: 3, title: "Start Downloading", desc: "Send URLs and get media info or files." },
];

const plans = [
  { name: "Free", price: 0, desc: "For testing and personal projects.", features: ["100 requests/month", "All 4 platforms", "Community support"], featured: false, cta: "Get Started", href: "/register" },
  { name: "Starter", price: 9, desc: "For indie developers and small projects.", features: ["5,000 requests/month", "All 4 platforms", "Priority rate limits", "Email support"], featured: true, cta: "Subscribe", href: "/register" },
  { name: "Pro", price: 29, desc: "For growing teams and production apps.", features: ["25,000 requests/month", "All 4 platforms", "Proxy rotation", "Priority support"], featured: false, cta: "Subscribe", href: "/register" },
  { name: "Enterprise", price: null, desc: "For high-volume platforms.", features: ["Unlimited requests", "All platforms + custom", "Dedicated proxies", "SLA + 24/7 support"], featured: false, cta: "Contact Sales", href: "/contact" },
];

const platforms = [
  { name: "YouTube", slug: "youtube", desc: "Video information & download" },
  { name: "Instagram", slug: "instagram", desc: "Media info & download" },
  { name: "Facebook", slug: "facebook", desc: "Video information & download" },
  { name: "TikTok", slug: "tiktok", desc: "Video information & download" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white font-bold text-lg">DLT</span>
            </div>
            <span className="font-bold text-xl tracking-tight">DELETE<span className="text-accent">API</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/" className="text-muted-foreground hover:text-accent transition-colors">Home</Link>
            <Link href="/apis" className="text-muted-foreground hover:text-accent transition-colors">APIs</Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-accent transition-colors">Pricing</Link>
            <Link href="/documentation" className="text-muted-foreground hover:text-accent transition-colors">Documentation</Link>
            <Link href="/status" className="text-muted-foreground hover:text-accent transition-colors">API Status</Link>
            <Link href="/playground" className="text-muted-foreground hover:text-accent transition-colors">API Playground</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:inline-block text-sm font-medium text-muted-foreground hover:text-accent transition-colors">Login</Link>
            <Button asChild variant="accent" size="sm">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 py-24 md:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 to-background pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-accent border border-accent/20 text-sm font-medium mb-8 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-accent" />
            All systems operational
          </div>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8 leading-tight">
            Download APIs for the{" "}
            <span className="text-accent">modern web</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Professional download APIs for YouTube, Instagram, Facebook, and TikTok.
            Built on yt-dlp — one engine, 100+ platforms, enterprise reliability.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="accent" className="px-8 py-4 text-lg font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all">
              <Link href="/register">Get Started Free</Link>
            </Button>
            <Button asChild variant="outline" className="px-8 py-4 text-lg font-semibold">
              <Link href="/documentation">Read Documentation</Link>
            </Button>
          </div>

          {/* Hero visual */}
          <div className="mt-16 relative">
            <div className="inline-block relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-accent to-primary rounded-2xl blur opacity-30 animate-pulse" />
              <div className="relative p-1 bg-background rounded-2xl border border-border">
                <pre className="p-4 text-sm text-muted-foreground overflow-x-auto font-mono"><code>{`POST /v1/dlt/youtube/download
Authorization: Bearer dl_live_xxxxx

{
  "url": "https://youtube.com/watch?v=..."
}`}</code></pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted Section */}
      <section className="border-y border-border py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">Trusted by developers worldwide</h2>
            <p className="text-muted-foreground mt-4">Join thousands of developers building with DELETE API</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-70 grayscale">
            {platforms.map((p) => (
              <div key={p.slug} className="flex items-center justify-center py-4">
                <span className="text-xl font-medium">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Available APIs */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16">
            <div>
              <h2 className="text-4xl font-bold">Available APIs</h2>
              <p className="text-muted-foreground mt-4">Access all platforms through a single unified API.</p>
            </div>
            <Button asChild variant="accent">
              <Link href="/apis">View all APIs →</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {platforms.map((p) => (
              <Link key={p.slug} href={`/apis/${p.slug}`} className="group block p-8 rounded-2xl border border-border hover:border-accent/50 hover:bg-accent/5 transition-all duration-300">
                <div className="h-14 w-14 rounded-xl bg-primary/10 text-accent flex items-center justify-center mb-6 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                  <Icon name="Play" className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg mb-3">{p.name}</h3>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose DELETE */}
      <section className="py-24 px-4 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Why Choose DELETE?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="p-8 rounded-2xl border border-border bg-card hover:border-accent/50 transition-all duration-300">
                <div className="h-12 w-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-6">
                  <Icon name={f.icon} />
                </div>
                <h3 className="font-bold text-lg mb-3">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((step) => (
              <div key={step.step} className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-lg shadow-primary/30">
                    {step.step}
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">API Performance Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="p-8 rounded-2xl border border-border bg-card text-center">
                <div className="h-14 w-14 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-6 mx-auto">
                  <Icon name={s.icon} />
                </div>
                <div className="text-4xl font-bold">{s.value}</div>
                <p className="text-sm text-muted-foreground mt-4">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24 px-4 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground mt-4">Choose individual platform APIs or bundle them all. No hidden fees.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div key={plan.name} className={`p-8 rounded-3xl border ${plan.featured ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-border bg-card"}`}>
                {plan.featured && (
                  <div className="mb-6 flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider">
                    <span className="px-3 py-1 bg-accent/10 rounded-full">Most Popular</span>
                  </div>
                )}
                <h3 className="font-bold text-xl mb-4">{plan.name}</h3>
                <div className="mb-6">
                  {plan.price === null ? (
                    <span className="text-4xl font-bold">Custom</span>
                  ) : (
                    <>
                      <span className="text-5xl font-bold">${plan.price}</span>
                      <span className="text-lg text-muted-foreground font-normal">/mo</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-8">{plan.desc}</p>
                <ul className="space-y-4 text-sm mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <span className="text-accent">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Button asChild variant={plan.featured ? "accent" : "outline"} className="w-full py-4 rounded-xl font-semibold transition-all">
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Developer Experience */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-8">Built for Developer Experience</h2>
              <ul className="space-y-6 mb-12">
                <li className="flex items-start gap-4">
                  <CheckIcon className="h-6 w-6 text-accent flex-shrink-0" />
                  <div>
                    <h4 className="font-bold mb-1">RESTful API with JSON responses</h4>
                    <p className="text-sm text-muted-foreground">Clean, predictable endpoints for all platforms.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <CheckIcon className="h-6 w-6 text-accent flex-shrink-0" />
                  <div>
                    <h4 className="font-bold mb-1">SDKs in JavaScript, Python, PHP</h4>
                    <div className="text-sm text-muted-foreground">Official libraries for your favorite languages.</div>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <CheckIcon className="h-6 w-6 text-accent flex-shrink-0" />
                  <div>
                    <h4 className="font-bold mb-1">Interactive API Playground</h4>
                    <div className="text-sm text-muted-foreground">Test endpoints directly from your browser.</div>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <CheckIcon className="h-6 w-6 text-accent flex-shrink-0" />
                  <div>
                    <h4 className="font-bold mb-1">Real-time usage analytics</h4>
                    <div className="text-sm text-muted-foreground">Track requests, quota, and success rates.</div>
                  </div>
                </li>
              </ul>
              <Button asChild variant="accent">
                <Link href="/documentation">View Documentation</Link>
              </Button>
            </div>
            <div className="bg-muted rounded-3xl p-8 border border-border">
              <pre className="p-6 rounded-xl text-sm overflow-x-auto font-mono"><code className="font-mono">{`POST /v1/dlt/youtube/download
Authorization: Bearer dl_live_xxxxx

{
  "url": "https://youtube.com/watch?v=..."
}`}</code></pre>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 bg-muted/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              "How do I get started with DELETE API?",
              "What platforms are supported?",
              "How is pricing calculated?",
              "Do you offer a free tier?",
              "How secure is my API key?",
            ].map((q, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6">
                <button className="w-full text-left flex items-center justify-between text-lg font-bold">
                  {q}
                  <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                <p className="mt-4 text-sm text-muted-foreground">Get answers in our documentation or contact support.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/50 mt-auto">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">DLT</span>
              </div>
              <span className="font-bold text-xl">DELETE<span className="text-accent">API</span></span>
            </div>
            <div className="text-sm text-muted-foreground">
              DELETE API Platform &copy; 2026. Built for developers.
            </div>
            <div className="flex items-center gap-6">
              <a href="/" className="text-sm text-muted-foreground hover:text-accent transition-colors">Home</a>
              <a href="/pricing" className="text-sm text-muted-foreground hover:text-accent transition-colors">Pricing</a>
              <a href="/documentation" className="text-sm text-muted-foreground hover:text-accent transition-colors">Documentation</a>
              <a href="/contact" className="text-sm text-muted-foreground hover:text-accent transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return <Icon name="Check" className={className} />;
}
