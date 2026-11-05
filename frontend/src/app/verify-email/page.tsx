"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { API_BASE } from "@/lib/api";

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const [state, setState] = React.useState<"loading" | "success" | "error">(
    token ? "loading" : "error",
  );
  const [message, setMessage] = React.useState(
    token ? "Verifying your email…" : "This verification link is missing a token.",
  );

  React.useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const verify = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/v1/auth/verify-email?token=${encodeURIComponent(token)}&json=1`,
        );
        const data = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (!response.ok) {
          setState("error");
          setMessage(data.detail || "This verification link is invalid or expired.");
          return;
        }
        setState("success");
        setMessage("Your email is verified. You can sign in now.");
      } catch {
        if (cancelled) return;
        setState("error");
        setMessage("Network error. Please try the link again.");
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <AuthShell
      title={state === "success" ? "Email verified" : "Verify your email"}
      subtitle={
        state === "success"
          ? "Your account is ready. Sign in to create your first API key."
          : "Confirming the link from your inbox."
      }
      footer={
        <>
          Need help?{" "}
          <Link href="/contact" className="font-semibold text-primary hover:underline">
            Contact support
          </Link>
        </>
      }
    >
      <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:p-7">
        {state === "loading" && (
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Loader2 className="h-7 w-7 animate-spin" />
          </span>
        )}
        {state === "success" && (
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
            <CheckCircle2 className="h-7 w-7" />
          </span>
        )}
        {state === "error" && (
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-7 w-7" />
          </span>
        )}

        <p className="mt-4 text-sm text-muted-foreground">{message}</p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/login" className="btn btn-primary">
            Go to sign in
          </Link>
          {state === "error" && (
            <Link href="/register" className="btn btn-outline">
              Create an account
            </Link>
          )}
        </div>
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense fallback={null}>
      <VerifyEmailContent />
    </React.Suspense>
  );
}
