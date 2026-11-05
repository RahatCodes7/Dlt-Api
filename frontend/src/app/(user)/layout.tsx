"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  LayoutDashboard,
  Rocket,
  Link as LinkIcon,
  Key,
  Play,
  BarChart3,
  CreditCard,
  FileText,
  BookOpen,
  HelpCircle,
  User,
  Shield,
  Bell,
  Settings as SettingsIcon,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";
import { DashboardShell, type NavGroup, type NavItem } from "@/components/dashboard/shell";
import { API_BASE } from "@/lib/api";

const navItems: NavItem[] = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard, group: "main" },
  { name: "Quick Start", href: "/dashboard/quick-start", icon: Rocket, group: "main" },
  { name: "My APIs", href: "/dashboard/my-apis", icon: LinkIcon, group: "api" },
  { name: "API Keys", href: "/dashboard/api-keys", icon: Key, group: "api" },
  { name: "Playground", href: "/dashboard/api-playground", icon: Play, group: "api" },
  { name: "API Configuration", href: "/dashboard/api-configuration", icon: SlidersHorizontal, group: "api" },
  { name: "Usage Analytics", href: "/dashboard/usage-analytics", icon: BarChart3, group: "analytics" },
  { name: "Request Logs", href: "/dashboard/request-logs", icon: FileText, group: "analytics" },
  { name: "Error Logs", href: "/dashboard/error-logs", icon: FileText, group: "analytics" },
  { name: "My Subscription", href: "/dashboard/my-subscription", icon: CreditCard, group: "billing" },
  { name: "Pricing Plans", href: "/dashboard/pricing-plans", icon: CreditCard, group: "billing" },
  { name: "Transactions", href: "/dashboard/transactions", icon: FileText, group: "billing" },
  { name: "Invoices", href: "/dashboard/invoices", icon: FileText, group: "billing" },
  { name: "Documentation", href: "/dashboard/documentation", icon: BookOpen, group: "developer" },
  { name: "API Status", href: "/dashboard/api-status", icon: Shield, group: "developer" },
  { name: "Support Tickets", href: "/dashboard/support-tickets", icon: HelpCircle, group: "developer" },
  { name: "Profile", href: "/dashboard/profile", icon: User, group: "account" },
  { name: "Security", href: "/dashboard/security", icon: Shield, group: "account" },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell, group: "account" },
  { name: "Settings", href: "/dashboard/settings", icon: SettingsIcon, group: "account" },
];

const groups: NavGroup[] = [
  { key: "main", label: "Main" },
  { key: "api", label: "API management" },
  { key: "analytics", label: "Analytics" },
  { key: "billing", label: "Billing" },
  { key: "developer", label: "Developer" },
  { key: "account", label: "Account" },
];

interface SessionUser {
  id: number;
  email: string;
  name: string | null;
  role: string;
  plan: string | null;
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [state, setState] = React.useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = React.useState("");

  const load = React.useCallback(async () => {
    setState("loading");
    setMessage("");
    try {
      const response = await fetch(`${API_BASE}/v1/auth/me`, { credentials: "include" });
      if (response.status === 401 || response.status === 403) {
        router.replace("/login");
        return;
      }
      if (!response.ok) {
        setState("error");
        setMessage("Could not verify your session. Please try again.");
        return;
      }
      const data = (await response.json()) as SessionUser;
      setUser(data);
      setState("ready");
    } catch {
      setState("error");
      setMessage("Could not reach the API. Check your connection and try again.");
    }
  }, [router]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your dashboard…
        </div>
      </div>
    );
  }

  if (state === "error" || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-lg font-semibold">Session unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {message || "Please sign in again to continue."}
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button type="button" onClick={load} className="btn btn-primary">
              Try again
            </button>
            <Link href="/login" className="btn btn-outline">
              Go to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell
      navItems={navItems}
      groups={groups}
      roleLabel={user.role === "admin" ? "Admin" : "Developer"}
      planLabel={user.plan ?? undefined}
      user={{ name: user.name || user.email.split("@")[0], email: user.email }}
    >
      {children}
    </DashboardShell>
  );
}
