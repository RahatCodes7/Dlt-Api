import Link from "next/link";
import { MessageCircleQuestion, ArrowRight } from "lucide-react";
import { FAQAccordion } from "@/components/marketing/faq-accordion";
import { faqs } from "@/lib/content";

const extras = [
  {
    question: "Can I use the API from a browser?",
    answer:
      "No. API keys must never be exposed in client-side code. Proxy requests through your backend so the key stays server-side. CORS is intentionally restricted for that reason.",
  },
  {
    question: "Do you support webhooks?",
    answer:
      "Webhook delivery for completed downloads is available on Pro and Enterprise. On lower tiers, poll the download status endpoint or use the file token returned by the download request.",
  },
  {
    question: "What is the maximum file size?",
    answer:
      "The API streams files rather than buffering them, so the practical limit is your plan's concurrency and the source platform's own limits. Enterprise plans can request dedicated bandwidth.",
  },
  {
    question: "Can I self-host the engine?",
    answer:
      "The hosted API is the supported product. If you need a private deployment, talk to sales about a dedicated instance with your own proxies and database.",
  },
];

export default function FAQPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 -z-10 dot-bg opacity-50" />
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
            <MessageCircleQuestion className="h-3.5 w-3.5" /> Help center
          </span>
          <h1 className="mx-auto mt-5 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Frequently asked questions
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            The short answers to the things developers ask us most. Anything missing?
            We are one email away.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <FAQAccordion items={faqs} />
      </section>

      <section className="border-y border-border bg-muted/30 py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight">Platform &amp; limits</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            More specific questions about usage, security, and deployment.
          </p>
          <FAQAccordion items={extras} className="mt-6" />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight">Still stuck?</h2>
        <p className="mt-2 text-muted-foreground">
          Send us the request ID from your response and we can trace it end to end.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/contact" className="btn btn-primary">
            Contact support <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/documentation" className="btn btn-outline">
            Read the documentation
          </Link>
        </div>
      </section>
    </div>
  );
}
