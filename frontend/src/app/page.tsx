import Link from "next/link";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Rocket,
  Code2,
  BarChart3,
  Users,
  ShieldCheck,
  Zap,
  TrendingUp,
  Clock,
  Layers,
  Play,
  Check,
  Mail,
  Phone,
  Globe,
} from "lucide-react";

const stats = [
  { label: "Platforms Supported", value: "4+", icon: Layers },
  { label: "API Requests/Day", value: "1M+", icon: TrendingUp },
  { label: "Uptime", value: "99.9%", icon: ShieldCheck },
  { label: "Avg Response Time", value: "<200ms", icon: Clock },
];

const features = [
  {
    title: "Multi-Platform Support",
    desc: "Download from YouTube, Instagram, Facebook, TikTok and more with a single API.",
    icon: Play,
  },
  {
    title: "High Performance",
    desc: "Sub-second response times with global edge caching and proxy rotation.",
    icon: Zap,
  },
  {
    title: "Developer Friendly",
    desc: "RESTful API, comprehensive docs, SDKs in JS, Python, PHP, and cURL examples.",
    icon: Code2,
  },
  {
    title: "Enterprise Scale",
    desc: "Rate limiting, quota management, billing, and detailed analytics built-in.",
    icon: BarChart3,
  },
];

const howItWorks = [
  { step: 1, title: "Create Account", desc: "Sign up and get your API key instantly." },
  { step: 2, title: "Choose Platform", desc: "Select YouTube, Instagram, Facebook, or TikTok API." },
  { step: 3, title: "Start Downloading", desc: "Send URLs and get media info or files." },
];

const platforms = [
  { name: "YouTube", slug: "youtube", desc: "Video information & download", icon: Play },
  { name: "Instagram", slug: "instagram", desc: "Media info & download", icon: Play },
  { name: "Facebook", slug: "facebook", desc: "Video information & download", icon: Play },
  { name: "TikTok", slug: "tiktok", desc: "Video information & download", icon: Play },
];

const plans = [
  { name: "Free", price: 0, desc: "For testing and personal projects.", features: ["100 requests/month", "All 4 platforms", "Community support"] },
  { name: "Starter", price: 9, desc: "For indie developers and small projects.", features: ["5,000 requests/month", "All 4 platforms", "Priority rate limits", "Email support"], featured: true },
  { name: "Pro", price: 29, desc: "For growing teams and production apps.", features: ["25,000 requests/month", "All 4 platforms", "Proxy rotation", "Priority support"] },
  { name: "Enterprise", price: null, desc: "For high-volume platforms.", features: ["Unlimited requests", "All platforms + custom", "Dedicated proxies", "SLA + 24/7 support"] },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">DLT</span>
            </div>
            <span className="font-bold text-xl tracking-tight">DELETE<span className="text-primary">API</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">Home</Link>
            <Link href="/apis" className="text-muted-foreground hover:text-primary transition-colors">APIs</Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors">Pricing</Link>
            <Link href="/documentation" className="text-muted-foreground hover:text-primary transition-colors">Documentation</Link>
            <Link href="/status" className="text-muted-foreground hover:text-primary transition-colors">API Status</Link>
            <Link href="/playground" className="text-muted-foreground hover:text-primary transition-colors">API Playground</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:inline-block text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Login</Link>
            <Link href="/register" className="btn-primary text-sm px-5 py-2 rounded-lg">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 py-20 md:py-32">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium mb-8">
            <span className="relative -left-[2px] h-2 w-2 rounded-full bg-primary animate-pulse" />
            All systems operational
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Download APIs for the{" "}
            <span className="text-primary">modern web</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Professional download APIs for YouTube, Instagram, Facebook, and TikTok.
            Built on yt-dlp — one engine, 100+ platforms, enterprise reliability.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary px-8 py-4 text-lg">
              Get Started Free
            </Link>
            <Link href="/documentation" className="btn-outline px-8 py-4 text-lg">
              Read Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* Trusted Developer Platform */}
      <section className="border-y border-border py-12 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-center text-2xl font-bold mb-4">Trusted by developers worldwide</h2>
          <p className="text-center text-muted-foreground mb-12">Join thousands of developers building with DELETE API</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60 grayscale">
            <div className="flex items-center justify-center"><span className="text-xl">YouTube</span></div>
            <div className="flex items-center justify-center"><span className="text-xl">Instagram</span></div>
            <div className="flex items-center justify-center"><span className="text-xl">Facebook</span></div>
            <div className="flex items-center justify-center"><span className="text-xl">TikTok</span></div>
          </div>
        </div>
      </section>

      {/* Available APIs */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold">Available APIs</h2>
              <p className="text-muted-foreground mt-2">Access all platforms through a single unified API.</p>
            </div>
            <Button asChild size="sm" variant="default">
  <Link href="/apis">View all APIs →</Link>
</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {platforms.map((p) => (
              <Link key={p.slug} href={`/apis/${p.slug}`} className="group block p-6 rounded-xl border border-border hover:border-primary/50 transition-all">
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                  {React.createElement(p.icon as any)}
                </div>
                <h3 className="font-semibold mb-2">{p.name}</h3>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose DELETE */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Why Choose DELETE?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="p-6 rounded-xl border border-border bg-card">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  {React.createElement(f.icon as any)}
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((step) => (
              <div key={step.step} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {step.step}
                  </div>
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">API Performance Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="p-6 rounded-xl border border-border bg-card text-center">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 mx-auto">
                  {React.createElement(s.icon as any)}
                </div>
                <div className="text-3xl font-bold">{s.value}</div>
                <p className="text-sm text-muted-foreground mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Simple, Transparent Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div key={plan.name} className={`p-8 rounded-2xl border ${plan.featured ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"}`}>
                {plan.featured && (
                  <div className="mb-4 flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                    <span className="px-2 py-1 bg-primary/10 rounded">Most Popular</span>
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  {plan.price === null ? (
                    <span className="text-3xl font-bold">Custom</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-sm text-muted-foreground">/mo</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>
                <ul className="space-y-3 text-sm mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="text-primary">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.featured ? "/register" : "/pricing"} className={`w-full py-3 rounded-xl font-medium transition-colors ${plan.featured ? "bg-primary text-primary-foreground" : "bg-background border border-border text-foreground"}`}>
                  {plan.featured ? "Get Started" : "View Plan"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Developer Experience */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Built for Developer Experience</h2>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary" />
                  <span>RESTful API with JSON responses</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary" />
                  <span>SDKs in JavaScript, Python, PHP</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary" />
                  <span>Interactive API Playground</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary" />
                  <span>Real-time usage analytics</span>
                </li>
              </ul>
              <Link href="/documentation" className="btn-primary">View Documentation</Link>
            </div>
            <div className="bg-muted rounded-2xl p-6 border border-border">
              <pre className="text-sm overflow-x-auto"><code className="font-mono">{`POST /v1/dlt/youtube/download
Authorization: Bearer dl_live_xxxxx

{
  "url": "https://youtube.com/watch?v=..."
}`}</code></pre>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              "How do I get started with DELETE API?",
              "What platforms are supported?",
              "How is pricing calculated?",
              "Do you offer a free tier?",
              "How secure is my API key?",
            ].map((q, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6">
                <button className="w-full text-left flex items-center justify-between text-lg font-semibold">
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
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">DLT</span>
              </div>
              <span className="font-bold text-lg">DELETE<span className="text-primary">API</span></span>
            </div>
            <div className="text-sm text-muted-foreground">
              DELETE API Platform &copy; 2026. Built for developers.
            </div>
            <div className="flex items-center gap-4">
              <a href="/" className="text-muted-foreground hover:text-primary transition-colors text-sm">Home</a>
              <a href="/pricing" className="text-muted-foreground hover:text-primary transition-colors text-sm">Pricing</a>
              <a href="/documentation" className="text-muted-foreground hover:text-primary transition-colors text-sm">Documentation</a>
              <a href="/contact" className="text-muted-foreground hover:text-primary transition-colors text-sm">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
