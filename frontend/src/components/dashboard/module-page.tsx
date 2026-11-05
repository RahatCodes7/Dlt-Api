"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  CreditCard,
  DollarSign,
  FileText,
  Gauge,
  Globe2,
  HelpCircle,
  KeyRound,
  Layers,
  ListChecks,
  Lock,
  Mail,
  Megaphone,
  MessageSquare,
  Palette,
  Plus,
  Search,
  Server,
  Settings2,
  Shield,
  Sparkles,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";

type Kind = "table" | "settings" | "form" | "monitor" | "detail";

interface ModuleConfig {
  title: string;
  description: string;
  kind: Kind;
  icon: LucideIcon;
  primary?: string;
  columns?: string[];
  fields?: { label: string; placeholder: string; type?: string }[];
  stats?: { label: string; value: string; hint: string; icon: LucideIcon }[];
  services?: { name: string; detail: string }[];
}

const configs: Record<string, ModuleConfig> = {
  // Admin — users
  "/admin/users/all": { title: "All users", description: "Search, filter, and manage every account on the platform.", kind: "table", icon: Users, primary: "Invite user", columns: ["User", "Plan", "Status", "Joined"] },
  "/admin/users/active": { title: "Active users", description: "Accounts with recent API activity in the current billing window.", kind: "table", icon: Users, columns: ["User", "Plan", "Requests", "Last active"] },
  "/admin/users/suspended": { title: "Suspended users", description: "Accounts restricted for policy, billing, or abuse reasons.", kind: "table", icon: Shield, columns: ["User", "Reason", "Suspended", "Status"] },
  "/admin/users/1": { title: "User details", description: "Inspect account state, API keys, usage, and billing history.", kind: "detail", icon: Users },

  // Admin — APIs
  "/admin/apis/all": { title: "All APIs", description: "Every platform integration and its current health.", kind: "table", icon: Layers, primary: "Add API", columns: ["Platform", "Slug", "Endpoints", "Status"] },
  "/admin/apis/add": { title: "Add new API", description: "Register a new platform and map its endpoints to the engine.", kind: "form", icon: Plus, primary: "Create API", fields: [{ label: "Display name", placeholder: "YouTube" }, { label: "Slug", placeholder: "youtube" }, { label: "Engine module", placeholder: "app.platforms.youtube" }, { label: "Description", placeholder: "Video info and download" }] },
  "/admin/apis/configuration": { title: "API configuration", description: "Tune timeouts, retries, concurrency, and proxy behaviour per platform.", kind: "settings", icon: Settings2, primary: "Save configuration" },
  "/admin/apis/endpoints": { title: "API endpoints", description: "The request contract exposed to every developer.", kind: "table", icon: Workflow, columns: ["Method", "Path", "Auth", "Latency"] },
  "/admin/apis/monitoring": { title: "API monitoring", description: "Request volume, error rate, and latency across all services.", kind: "monitor", icon: BarChart3 },
  "/admin/api-logs": { title: "API logs", description: "A searchable stream of every request handled by the gateway.", kind: "table", icon: FileText, columns: ["Request ID", "Platform", "Endpoint", "Status"] },
  "/admin/error-logs": { title: "Error logs", description: "Failed requests grouped by error code and upstream source.", kind: "table", icon: AlertTriangle, columns: ["Error", "Platform", "Count", "Last seen"] },
  "/admin/rate-limits": { title: "Rate limits", description: "Per-plan windows and per-key overrides for the API gateway.", kind: "settings", icon: Gauge, primary: "Update limits" },
  "/admin/server-monitoring": { title: "Server monitoring", description: "CPU, memory, queue depth, and worker saturation in real time.", kind: "monitor", icon: Server },
  "/admin/maintenance-mode": { title: "Maintenance mode", description: "Pause public traffic with a branded maintenance page.", kind: "settings", icon: Lock, primary: "Save settings" },

  // Admin — plans and finance
  "/admin/plans/all": { title: "All plans", description: "Pricing tiers, monthly volume, and availability.", kind: "table", icon: CreditCard, primary: "Create plan", columns: ["Plan", "Price", "Requests", "Status"] },
  "/admin/plans/create": { title: "Create plan", description: "Define a new pricing tier and its request allowance.", kind: "form", icon: Plus, primary: "Create plan", fields: [{ label: "Plan name", placeholder: "Scale" }, { label: "Price (USD/month)", placeholder: "49", type: "number" }, { label: "Monthly requests", placeholder: "100000", type: "number" }, { label: "Description", placeholder: "For high-volume teams" }] },
  "/admin/plans/edit": { title: "Edit plans", description: "Change pricing or allowances for existing tiers.", kind: "table", icon: Settings2, columns: ["Plan", "Price", "Requests", "Updated"] },
  "/admin/subscriptions": { title: "Subscriptions", description: "Every active, pending, and cancelled subscription.", kind: "table", icon: CreditCard, columns: ["Customer", "Plan", "Status", "Renews"] },
  "/admin/transactions": { title: "Transactions", description: "Payments, refunds, and failed charges across all providers.", kind: "table", icon: DollarSign, columns: ["Reference", "Customer", "Amount", "Status"] },
  "/admin/payment-verification": { title: "Payment verification", description: "Manually review bank transfers and flagged payments.", kind: "table", icon: Shield, columns: ["Reference", "Method", "Amount", "Status"] },
  "/admin/revenue-analytics": { title: "Revenue analytics", description: "MRR, churn, expansion, and plan mix over time.", kind: "monitor", icon: BarChart3 },
  "/admin/invoices": { title: "Invoices", description: "Generated invoices and their settlement status.", kind: "table", icon: FileText, columns: ["Invoice", "Customer", "Total", "Status"] },

  // Admin — support / website / settings
  "/admin/support-tickets": { title: "Support tickets", description: "Open conversations from developers, sorted by priority.", kind: "table", icon: HelpCircle, columns: ["Subject", "Requester", "Priority", "Status"] },
  "/admin/announcements": { title: "Announcements", description: "Broadcast product news and incident updates.", kind: "form", icon: Megaphone, primary: "Publish announcement", fields: [{ label: "Title", placeholder: "Scheduled maintenance" }, { label: "Audience", placeholder: "All users" }, { label: "Body", placeholder: "Write the announcement…" }] },
  "/admin/notifications": { title: "Notifications", description: "Delivery log for email and in-app notifications.", kind: "table", icon: Bell, columns: ["Notification", "Channel", "Recipient", "Status"] },
  "/admin/homepage-settings": { title: "Homepage settings", description: "Control hero copy, sections, and call-to-action links.", kind: "settings", icon: Globe2, primary: "Save homepage" },
  "/admin/branding": { title: "Branding", description: "Logo, accent colors, and email template styling.", kind: "form", icon: Palette, primary: "Save branding", fields: [{ label: "Brand name", placeholder: "DELETE API" }, { label: "Primary color", placeholder: "#4f46e5" }, { label: "Support email", placeholder: "support@dltapi.cc.cd" }] },
  "/admin/faq-management": { title: "FAQ management", description: "Edit the questions shown on the public FAQ page.", kind: "table", icon: MessageSquare, primary: "Add question", columns: ["Question", "Category", "Status", "Updated"] },
  "/admin/documentation": { title: "Documentation", description: "Manage published guides, API references, and snippets.", kind: "table", icon: BookOpen, primary: "New page", columns: ["Page", "Section", "Status", "Updated"] },
  "/admin/seo-settings": { title: "SEO settings", description: "Meta titles, descriptions, sitemap, and social previews.", kind: "form", icon: Search, primary: "Save SEO", fields: [{ label: "Meta title", placeholder: "DELETE API — Download APIs" }, { label: "Meta description", placeholder: "Professional download APIs…" }, { label: "Canonical URL", placeholder: "https://dltapi.cc.cd" }] },
  "/admin/general-settings": { title: "General settings", description: "Platform name, locale, timezone, and support contact.", kind: "settings", icon: Settings2, primary: "Save changes" },
  "/admin/security": { title: "Security", description: "Session policy, two-factor enforcement, and IP allowlists.", kind: "settings", icon: Lock, primary: "Update security" },
  "/admin/admin-profile": { title: "Admin profile", description: "Your account details, password, and active sessions.", kind: "detail", icon: KeyRound },
  "/admin/system-configuration": { title: "System configuration", description: "Environment variables, feature flags, and integrations.", kind: "settings", icon: Server, primary: "Save configuration" },

  // User
  "/dashboard/api-configuration": { title: "API configuration", description: "Defaults applied to every request made with your keys.", kind: "settings", icon: Settings2, primary: "Save configuration" },
  "/dashboard/api-status": { title: "API status", description: "Current health of every platform you depend on.", kind: "monitor", icon: Activity },
  "/dashboard/documentation": { title: "Documentation", description: "Guides, references, and copy-paste examples for every endpoint.", kind: "table", icon: BookOpen, columns: ["Guide", "Section", "Level", "Updated"] },
  "/dashboard/invoices": { title: "Invoices", description: "Download receipts and review billing history.", kind: "table", icon: FileText, columns: ["Invoice", "Period", "Total", "Status"] },
  "/dashboard/notifications": { title: "Notifications", description: "Quota warnings, incident updates, and product news.", kind: "table", icon: Bell, columns: ["Notification", "Type", "Received", "Status"] },
  "/dashboard/pricing-plans": { title: "Pricing plans", description: "Compare allowances and change your subscription tier.", kind: "table", icon: CreditCard, columns: ["Plan", "Price", "Requests", "Status"] },
  "/dashboard/security": { title: "Security", description: "Password, two-factor authentication, and active sessions.", kind: "settings", icon: Lock, primary: "Update security" },
  "/dashboard/settings": { title: "Settings", description: "Workspace preferences, notifications, and danger zone.", kind: "settings", icon: Settings2, primary: "Save settings" },
  "/dashboard/support-tickets": { title: "Support tickets", description: "Ask a question and track replies from the team.", kind: "table", icon: HelpCircle, primary: "New ticket", columns: ["Subject", "Priority", "Updated", "Status"] },
  "/dashboard/transactions": { title: "Transactions", description: "Payments and refunds associated with your account.", kind: "table", icon: DollarSign, columns: ["Reference", "Amount", "Method", "Status"] },
};

export function ModulePage() {
  const pathname = usePathname();
  const config =
    configs[pathname] ??
    configs[pathname.replace(/\/$/, "")] ??
    ({
      title: pathname.split("/").filter(Boolean).slice(-1)[0].replace(/-/g, " "),
      description: "Manage this part of the platform.",
      kind: "table",
      icon: Layers,
    } as ModuleConfig);

  const Icon = config.icon;
  const homeHref = pathname.startsWith("/admin") ? "/admin/dashboard" : "/dashboard";

  return (
    <div>
      <PageHeader eyebrow="Module" title={config.title} description={config.description} />

      <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold">This section is not connected yet</p>
          <p className="mt-1 text-amber-700/80 dark:text-amber-300/80">
            The UI is in place, but there is no backend endpoint for it, so nothing is
            being loaded or saved. No demo data is shown here.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface flex min-h-[280px] flex-col items-center justify-center p-8 text-center lg:col-span-2">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Icon className="h-6 w-6" />
          </span>
          <h2 className="mt-4 font-semibold">No data yet</h2>
          <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
            {config.kind === "form"
              ? "This form is a placeholder. It is not wired to save changes."
              : config.kind === "settings"
                ? "These settings are a placeholder. They are not wired to the backend."
                : "Connect the matching API endpoint to show real records in this module."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link href={homeHref} className="btn btn-outline">
              Back to overview
            </Link>
            <Link href="/documentation" className="btn btn-ghost">
              <BookOpen className="h-4 w-4" /> Read the docs
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <div className="surface p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4 text-primary" /> Quick actions
            </h2>
            <div className="mt-3 space-y-1">
              {[
                { label: "Open documentation", href: "/documentation", icon: BookOpen },
                { label: "Contact support", href: "/contact", icon: Mail },
                { label: "View API status", href: "/status", icon: Activity },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <action.icon className="h-4 w-4" /> {action.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="surface p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4 text-accent" /> What works today
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> Sign in and session management
              </li>
              <li className="flex items-start gap-2">
                <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> API key creation and revocation
              </li>
              <li className="flex items-start gap-2">
                <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> Usage analytics, request and error logs
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
