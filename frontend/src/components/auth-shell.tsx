import Link from "next/link";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-background text-foreground lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-accent p-10 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute inset-0 opacity-20 dot-bg" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <Logo href="/" size="md" className="text-white [&_span]:text-white" />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 px-3 py-1.5 text-xs font-medium text-white/90 transition-colors hover:bg-white/10"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to site
          </Link>
        </div>

        <div className="relative mt-auto max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> 100 free requests
          </span>
          <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight xl:text-4xl">
            One API for every video platform you care about.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/80">
            Ship downloads without maintaining extractors, proxies, and retries. The
            schema stays the same, even when the platforms change underneath.
          </p>

          <ul className="mt-6 space-y-2.5">
            {[
              "YouTube, Instagram, Facebook, TikTok",
              "Hashed keys and per-platform scopes",
              "Usage analytics and hard quotas",
              "Proxy rotation built in",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-white/90">
                <Check className="h-4 w-4" /> {item}
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur">
            <p className="font-mono text-[11px] leading-relaxed text-white/90">
              POST /v1/dlt/youtube/info
              <br />
              Authorization: Bearer dl_live_xxxxxxxx
            </p>
          </div>
        </div>

        <p className="relative mt-10 text-xs text-white/60">
          &copy; {new Date().getFullYear()} DELETE API. Built for developers.
        </p>
      </aside>

      <div className="flex flex-col">
        <header className="flex h-16 items-center justify-between px-5 sm:px-8 lg:hidden">
          <Logo href="/" />
          <ThemeToggle />
        </header>

        <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-7 text-center lg:text-left">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {children}
            {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
          </div>
        </main>

        <footer className="hidden items-center justify-between px-8 py-5 text-xs text-muted-foreground lg:flex">
          <span>&copy; {new Date().getFullYear()} DELETE API</span>
          <div className="flex items-center gap-4">
            <Link href="/documentation" className="hover:text-foreground">
              Docs
            </Link>
            <Link href="/contact" className="hover:text-foreground">
              Support
            </Link>
            <ThemeToggle />
          </div>
        </footer>
      </div>
    </div>
  );
}
