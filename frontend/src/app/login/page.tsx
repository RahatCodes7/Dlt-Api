"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Input } from "@/components/ui/input";
import { API_BASE } from "@/lib/api";

const OAUTH_ERRORS: Record<string, string> = {
  google_not_configured:
    "Google sign-in is not configured on the server yet. Use email and password for now.",
  google_cancelled: "Google sign-in was cancelled.",
  google_state_mismatch: "Google sign-in expired. Please try again.",
  google_exchange_failed: "Google could not complete sign-in. Please try again.",
  google_no_email: "Your Google account did not share an email address.",
  google_email_unverified: "Your Google email address is not verified.",
  account_inactive: "This account is not active. Contact support for help.",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("error");
    if (!code) return;
    setError(OAUTH_ERRORS[code] ?? "Sign-in failed. Please try again.");
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, remember }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.detail || "Login failed. Check your email and password.");
        return;
      }
      router.refresh();
      if (data.user?.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your keys, usage, and subscriptions."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Create one free
          </Link>
        </>
      }
    >
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-7">
        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                required
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            Keep me signed in
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-3 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
              </>
            ) : (
              <>
                Sign in <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-3 text-xs uppercase tracking-wider text-muted-foreground">
              or
            </span>
          </div>
        </div>

        <a href={`${API_BASE}/v1/auth/google/login`} className="btn btn-outline w-full py-3">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-red-500 via-amber-400 to-blue-500 text-[10px] font-bold text-white">
            G
          </span>
          Continue with Google
        </a>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        By signing in you agree to the acceptable use policy and terms of service.
      </p>
    </AuthShell>
  );
}
