import Link from "next/link";
import * as React from "react";
import { Rocket, Code2, BarChart3, Users, ShieldCheck, Zap, TrendingUp, Clock, Layers, Play } from "lucide-react";

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

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
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
            <Link href="/pricing" className="btn-primary px-8 py-4 text-lg">
              Get Started Free
            </Link>
            <Link href="/documentation" className="btn-outline px-8 py-4 text-lg">
              Read Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* Trusted Developer Platform */}
      <section className="border-y border-gray-200 dark:border-gray-700 py-12 bg-muted/50">
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
            <Link href="/apis" className="btn-sm btn-primary">View all APIs →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <Link key={f.title} href={`/apis/${f.title.toLowerCase()}`} className="group block p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-all">
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                  {React.createElement(f.icon as any)}
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
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
              <Card key={i} className="p-6">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  {React.createElement(f.icon as any)}
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </Card>
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
              <Card key={s.label} className="p-6 text-center">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 mx-auto">
                  {React.createElement(s.icon as any, { className: "h-6 w-6" })}
                </div>
                <div className="text-3xl font-bold">{s.value}</div>
                <p className="text-sm text-muted-foreground mt-2">{s.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Simple, Transparent Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="p-8">
              <h3 className="font-semibold mb-2">Free</h3>
              <div className="text-2xl font-bold mb-6">$0<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-3 text-sm text-muted-foreground mb-8">
                <li>100 requests/month</li>
                <li>All 4 platforms</li>
                <li>Community support</li>
              </ul>
              <Link href="/pricing" className="w-full btn-outline">Choose Free</Link>
            </Card>
            <Card className="p-8 border-primary bg-primary/5">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-medium text-primary uppercase tracking-wider">Most Popular</span>
              </div>
              <h3 className="font-semibold mb-2">Starter</h3>
              <div className="text-3xl font-bold mb-6">$9<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-3 text-sm text-muted-foreground mb-8">
                <li>5,000 requests/month</li>
                <li>All 4 platforms</li>
                <li>Priority rate limits</li>
                <li>Email support</li>
              </ul>
              <Link href="/pricing" className="w-full btn-primary">Choose Starter</Link>
            </Card>
            <Card className="p-8">
              <h3 className="font-semibold mb-2">Pro</h3>
              <div className="text-2xl font-bold mb-6">$29<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-3 text-sm text-muted-foreground mb-8">
                <li>25,000 requests/month</li>
                <li>All 4 platforms</li>
                <li>Proxy rotation</li>
                <li>Priority support</li>
              </ul>
              <Link href="/pricing" className="w-full btn-outline">Choose Pro</Link>
            </Card>
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
            <div className="bg-muted rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <pre className="text-sm overflow-x-auto"><code>{`POST /v1/dlt/youtube/download
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
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="p-6">
                <button className="w-full text-left flex items-center justify-between">
                  <h3 className="font-semibold">How do I get started with DELETE API?</h3>
                  <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                <p className="mt-4 text-sm text-muted-foreground">Sign up for a free account, generate your API key, and start making requests to our endpoints.</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-card text-card-foreground shadow-sm p-6 ${className}`}>
      {children}
    </div>
  )
}

function Check({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
  )
}
