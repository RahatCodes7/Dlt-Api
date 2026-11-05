import { FlaskConical, ShieldAlert } from "lucide-react";
import { Playground } from "@/components/marketing/playground";

export default function PlaygroundPage() {
  return (
    <div>
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
            <FlaskConical className="h-3.5 w-3.5" /> Interactive playground
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Test the API from your browser
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Send a real request against your local or deployed backend, inspect the
            response, and copy the equivalent cURL.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-4">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
            Requests are sent straight from your browser to the API. Use a short-lived
            key when testing, and never paste a production key into a shared machine.
          </p>
        </div>
        <Playground />
      </section>
    </div>
  );
}
