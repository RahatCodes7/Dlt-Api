"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Minus, Sparkles } from "lucide-react";
import { FAQAccordion } from "@/components/marketing/faq-accordion";
import { faqs, plans } from "@/lib/content";

const comparison = [
  { feature: "Requests per month", free: "100", starter: "5,000", pro: "25,000", enterprise: "Custom" },
  { feature: "All 4 platforms", free: true, starter: true, pro: true, enterprise: true },
  { feature: "Info + download endpoints", free: true, starter: true, pro: true, enterprise: true },
  { feature: "Usage analytics", free: false, starter: true, pro: true, enterprise: true },
  { feature: "Priority rate limits", free: false, starter: true, pro: true, enterprise: true },
  { feature: "Proxy rotation", free: false, starter: false, pro: true, enterprise: true },
  { feature: "Dedicated proxies", free: false, starter: false, pro: false, enterprise: true },
  { feature: "Custom platforms", free: false, starter: false, pro: false, enterprise: true },
  { feature: "Support", free: "Community", starter: "Email", pro: "Priority", enterprise: "24/7 + SLA" },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true) {
    return <Check className="mx-auto h-4 w-4 text-accent" aria-label="Included" />;
  }
  if (value === false) {
    return <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" aria-label="Not included" />;
  }
  return <span className="text-sm">{value}</span>;
}

export default function PricingPage() {
  const [annual, setAnnual] = React.useState(false);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 -z-10 dot-bg opacity-50" />
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> 2 months free on annual
          </span>
          <h1 className="mx-auto mt-5 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Pricing that scales with your traffic
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Every plan includes all four platforms and the same endpoints. Pick the
            volume you need — upgrade or cancel at any time.
          </p>

          <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                !annual ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                annual ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Annual
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-4">
          {plans.map((plan) => {
            const price =
              plan.price === null
                ? null
                : annual
                  ? plan.price * 10
                  : plan.price;
            return (
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
                <h2 className="text-lg font-semibold">{plan.name}</h2>
                <p className="mt-1 min-h-10 text-sm text-muted-foreground">
                  {plan.description}
                </p>
                <div className="mt-5 flex items-baseline gap-1">
                  {price === null ? (
                    <span className="text-4xl font-bold tracking-tight">Custom</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold tracking-tight">${price}</span>
                      <span className="text-sm text-muted-foreground">
                        /{annual ? "yr" : "mo"}
                      </span>
                    </>
                  )}
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
            );
          })}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Prices in USD. Annual billing is charged once per year. Overages are never
          billed automatically.
        </p>
      </section>

      <section className="border-y border-border bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Compare every feature
          </h2>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-4 font-semibold">Feature</th>
                  <th className="px-5 py-4 text-center font-semibold">Free</th>
                  <th className="px-5 py-4 text-center font-semibold">Starter</th>
                  <th className="px-5 py-4 text-center font-semibold">Pro</th>
                  <th className="px-5 py-4 text-center font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.feature} className="border-b border-border last:border-0">
                    <td className="px-5 py-3.5 text-sm font-medium">{row.feature}</td>
                    <td className="px-5 py-3.5 text-center text-muted-foreground">
                      <Cell value={row.free} />
                    </td>
                    <td className="px-5 py-3.5 text-center text-muted-foreground">
                      <Cell value={row.starter} />
                    </td>
                    <td className="px-5 py-3.5 text-center text-muted-foreground">
                      <Cell value={row.pro} />
                    </td>
                    <td className="px-5 py-3.5 text-center text-muted-foreground">
                      <Cell value={row.enterprise} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          Billing questions
        </h2>
        <FAQAccordion items={faqs.slice(2, 6)} className="mt-8" />
      </section>
    </div>
  );
}
