import Link from "next/link";
import { Activity, ArrowRight, CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { platforms } from "@/lib/content";

const days = Array.from({ length: 90 }, (_, index) => index);

function barState(day: number, serviceIndex: number) {
  const seed = (day * 7 + serviceIndex * 13) % 100;
  if (seed > 97) return "degraded";
  if (seed > 95) return "partial";
  return "up";
}

const incidents = [
  {
    date: "Oct 18, 2026",
    title: "Elevated latency on Instagram info",
    status: "Resolved",
    duration: "22 min",
    summary:
      "An upstream change caused slower metadata extraction for reels. A cache warm-up restored normal latency.",
  },
  {
    date: "Sep 30, 2026",
    title: "Brief download failures on TikTok",
    status: "Resolved",
    duration: "9 min",
    summary:
      "A subset of download requests returned 502 due to an expired extractor. The engine was updated and jobs were retried automatically.",
  },
];

export default function StatusPage() {
  return (
    <div>
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3.5 py-1.5 text-xs font-semibold text-accent">
                <Activity className="h-3.5 w-3.5" /> Live status
              </span>
              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                All systems operational
              </h1>
              <p className="mt-2 text-muted-foreground">
                Rolling 90-day view across every platform and shared service.
              </p>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-2xl font-bold">99.96%</p>
                <p className="text-xs text-muted-foreground">90-day uptime</p>
              </div>
              <div>
                <p className="text-2xl font-bold">142ms</p>
                <p className="text-xs text-muted-foreground">median latency</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="surface divide-y divide-border">
          {platforms.map((platform, index) => (
            <div key={platform.slug} className="p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${platform.chip}`}>
                    <platform.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{platform.name} API</p>
                    <p className="text-xs text-muted-foreground">REST · v1</p>
                  </div>
                </div>
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Operational
                </span>
              </div>
              <div className="mt-4 flex items-end gap-[2px]" aria-hidden="true">
                {days.map((day) => {
                  const state = barState(day, index);
                  return (
                    <span
                      key={day}
                      className={`h-8 flex-1 rounded-sm transition-opacity hover:opacity-70 ${
                        state === "up"
                          ? "bg-accent/70"
                          : state === "partial"
                            ? "bg-amber-400/80"
                            : "bg-red-400/80"
                      }`}
                      title={`Day ${day + 1}: ${state}`}
                    />
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                <span>90 days ago</span>
                <span>Today</span>
              </div>
            </div>
          ))}

          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Authentication &amp; dashboard</p>
                <p className="text-xs text-muted-foreground">Shared services</p>
              </div>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
              <CheckCircle2 className="h-3.5 w-3.5" /> Operational
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-accent/70" /> Operational
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-400/80" /> Degraded
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-red-400/80" /> Outage
          </span>
        </div>
      </section>

      <section className="border-t border-border bg-muted/30 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-xl font-bold tracking-tight">Incident history</h2>
          <div className="mt-5 space-y-3">
            {incidents.map((incident) => (
              <div key={incident.title} className="surface p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-semibold">{incident.title}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="rounded-full bg-accent/10 px-2.5 py-1 font-semibold text-accent">
                      {incident.status}
                    </span>
                    <span className="text-muted-foreground">
                      {incident.date} · {incident.duration}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{incident.summary}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col items-start justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-4 sm:flex-row sm:items-center">
            <p className="text-sm text-muted-foreground">
              Want incident notifications by email? Subscribe from your dashboard.
            </p>
            <Link href="/register" className="btn btn-outline">
              Create a free account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
