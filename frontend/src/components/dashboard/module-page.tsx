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
import { StatCard } from "@/components/dashboard/stat-card";
import { UsageAreaChart } from "@/components/dashboard/charts";
import { cn } from "@/lib/utils";

type Kind = "table" | "settings" | "form" | "monitor" | "detail";

interface ModuleConfig {
  title: string;
  description: string;
  kind: Kind;
  icon: LucideIcon;
  primary?: string;
  columns?: string[];
  fields?: { label: string; placeholder: string; type?: string }[];
  stats?: { label: string; value: string; hint: string; icon: LucideIcon; tone?: "primary" | "accent" | "blue" | "amber" | "rose" }[];
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
  "/admin/branding": { title: "Branding", description: "Logo, accent colors, and email template styling.", kind: "form", icon: Palette, primary: "Save branding", fields: [{ label: "Brand name", placeholder: "DELETE API" }, { label: "Primary color", placeholder: "#4f46e5" }, { label: "Support email", placeholder: "support@deleteapi.com" }] },
  "/admin/faq-management": { title: "FAQ management", description: "Edit the questions shown on the public FAQ page.", kind: "table", icon: MessageSquare, primary: "Add question", columns: ["Question", "Category", "Status", "Updated"] },
  "/admin/documentation": { title: "Documentation", description: "Manage published guides, API references, and snippets.", kind: "table", icon: BookOpen, primary: "New page", columns: ["Page", "Section", "Status", "Updated"] },
  "/admin/seo-settings": { title: "SEO settings", description: "Meta titles, descriptions, sitemap, and social previews.", kind: "form", icon: Search, primary: "Save SEO", fields: [{ label: "Meta title", placeholder: "DELETE API — Download APIs" }, { label: "Meta description", placeholder: "Professional download APIs…" }, { label: "Canonical URL", placeholder: "https://deleteapi.com" }] },
  "/admin/general-settings": { title: "General settings", description: "Platform name, locale, timezone, and support contact.", kind: "settings", icon: Settings2, primary: "Save changes" },
  "/admin/security": { title: "Security", description: "Session policy, two-factor enforcement, and IP allowlists.", kind: "settings", icon: Lock, primary: "Update security" },
  "/admin/admin-profile": { title: "Admin profile", description: "Your account details, password, and active sessions.", kind: "detail", icon: KeyRound },
  "/admin/system-configuration": { title: "System configuration", description: "Environment variables, feature flags, and integrations.", kind: "settings", icon: Server, primary: "Save configuration" },

  // User
  "/dashboard/api-configuration": { title: "API configuration", description: "Defaults applied to every request made with your keys.", kind: "settings", icon: Settings2, primary: "Save configuration" },
  "/dashboard/api-status": { title: "API status", description: "Current health of every platform you depend on.", kind: "monitor", icon: Activity },
  "/dashboard/documentation": { title: "Documentation", description: "Guides, references, and copy-paste examples for every endpoint.", kind: "table", icon: BookOpen, columns: ["Guide", "Section", "Level", "Updated"] },
  "/dashboard/error-logs": { title: "Error logs", description: "Requests from your keys that returned an error.", kind: "table", icon: AlertTriangle, columns: ["Request ID", "Platform", "Error", "When"] },
  "/dashboard/invoices": { title: "Invoices", description: "Download receipts and review billing history.", kind: "table", icon: FileText, columns: ["Invoice", "Period", "Total", "Status"] },
  "/dashboard/notifications": { title: "Notifications", description: "Quota warnings, incident updates, and product news.", kind: "table", icon: Bell, columns: ["Notification", "Type", "Received", "Status"] },
  "/dashboard/pricing-plans": { title: "Pricing plans", description: "Compare allowances and change your subscription tier.", kind: "table", icon: CreditCard, columns: ["Plan", "Price", "Requests", "Status"] },
  "/dashboard/profile": { title: "Profile", description: "Your name, email, avatar, and account preferences.", kind: "detail", icon: Users },
  "/dashboard/request-logs": { title: "Request logs", description: "Every request made with your API keys.", kind: "table", icon: FileText, columns: ["Request ID", "Platform", "Endpoint", "Status"] },
  "/dashboard/security": { title: "Security", description: "Password, two-factor authentication, and active sessions.", kind: "settings", icon: Lock, primary: "Update security" },
  "/dashboard/settings": { title: "Settings", description: "Workspace preferences, notifications, and danger zone.", kind: "settings", icon: Settings2, primary: "Save settings" },
  "/dashboard/support-tickets": { title: "Support tickets", description: "Ask a question and track replies from the team.", kind: "table", icon: HelpCircle, primary: "New ticket", columns: ["Subject", "Priority", "Updated", "Status"] },
  "/dashboard/transactions": { title: "Transactions", description: "Payments and refunds associated with your account.", kind: "table", icon: DollarSign, columns: ["Reference", "Amount", "Method", "Status"] },
};

const names = ["Maya Chen", "Omar Haddad", "Lena Fischer", "Diego Ruiz", "Priya Nair", "Noah Park"];
const statuses = ["Active", "Pending", "Active", "Review", "Active", "Paused"];

function cellValue(column: string, index: number): string {
  const lower = column.toLowerCase();
  if (lower.includes("user") || lower.includes("customer") || lower.includes("requester") || lower.includes("recipient")) {
    return names[index % names.length];
  }
  if (lower.includes("email")) return `${names[index % names.length].split(" ")[0].toLowerCase()}@example.com`;
  if (lower.includes("status")) return statuses[index % statuses.length];
  if (lower.includes("amount") || lower.includes("total") || lower.includes("price")) return `$${[29, 9, 49, 0, 19, 99][index % 6]}`;
  if (lower.includes("plan")) return ["Pro", "Starter", "Free", "Pro", "Starter", "Enterprise"][index % 6];
  if (lower.includes("requests")) return `${[4230, 892, 11240, 640, 1890, 210][index % 6]}`;
  if (lower.includes("joined") || lower.includes("suspended") || lower.includes("updated") || lower.includes("renews") || lower.includes("period") || lower.includes("when") || lower.includes("seen") || lower.includes("received") || lower.includes("published") || lower.includes("last active")) {
    return ["Oct 21, 2026", "Sep 14, 2026", "Nov 02, 2026", "Aug 30, 2026", "Oct 08, 2026", "Jul 19, 2026"][index % 6];
  }
  if (lower.includes("method")) return ["POST", "POST", "GET", "POST", "GET", "POST"][index % 6];
  if (lower.includes("path") || lower.includes("endpoint")) return ["/v1/dlt/youtube/info", "/v1/dlt/tiktok/download", "/v1/dlt/account/quota", "/v1/dlt/instagram/info", "/v1/dlt/facebook/download", "/v1/dlt/account/keys"][index % 6];
  if (lower.includes("platform")) return ["YouTube", "Instagram", "Facebook", "TikTok", "YouTube", "TikTok"][index % 6];
  if (lower.includes("latency")) return ["112ms", "840ms", "64ms", "1.1s", "204ms", "388ms"][index % 6];
  if (lower.includes("priority")) return ["High", "Normal", "Low", "High", "Normal", "Low"][index % 6];
  if (lower.includes("error")) return ["QUOTA_EXCEEDED", "INVALID_URL", "UPSTREAM_ERROR", "RATE_LIMITED", "NOT_FOUND", "TIMEOUT"][index % 6];
  if (lower.includes("request id") || lower.includes("reference") || lower.includes("invoice")) return `dl_${["9f2c1a8b", "3d04e5f6", "7a1b2c3d", "5e6f7a8b", "1c2d3e4f", "9a8b7c6d"][index % 6]}`;
  if (lower.includes("reason")) return ["Payment failed", "Abuse report", "Policy violation", "Chargeback", "Spam", "Manual hold"][index % 6];
  if (lower.includes("channel") || lower.includes("type")) return ["Email", "In-app", "Email", "Webhook", "In-app", "Email"][index % 6];
  if (lower.includes("category") || lower.includes("section") || lower.includes("level")) return ["Getting started", "API reference", "Billing", "Advanced", "SDK", "Guides"][index % 6];
  if (lower.includes("slug") || lower.includes("module")) return ["youtube", "instagram", "facebook", "tiktok", "youtube", "tiktok"][index % 6];
  if (lower.includes("endpoints")) return ["2", "2", "2", "2", "2", "2"][index % 6];
  if (lower.includes("auth")) return ["Bearer", "Bearer", "Bearer", "Cookie", "Bearer", "Bearer"][index % 6];
  if (lower.includes("count")) return ["128", "64", "31", "12", "8", "3"][index % 6];
  if (lower.includes("question") || lower.includes("subject") || lower.includes("notification") || lower.includes("guide") || lower.includes("page") || lower.includes("title") || lower.includes("plan") || lower.includes("api")) {
    return ["How do I rotate a key?", "Download returned 429", "New quota warnings", "Quick start guide", "API reference", "Billing FAQ"][index % 6];
  }
  return ["—", "—", "—", "—", "—", "—"][index % 6];
}

function defaultStats(kind: Kind, config: ModuleConfig) {
  if (config.stats) return config.stats;
  switch (kind) {
    case "settings":
      return [
        { label: "Configuration items", value: "18", hint: "across 4 sections", icon: Settings2, tone: "primary" as const },
        { label: "Last updated", value: "2d ago", hint: "by admin@deleteapi.com", icon: Activity, tone: "accent" as const },
        { label: "Pending changes", value: "0", hint: "nothing staged", icon: ListChecks, tone: "blue" as const },
        { label: "Environment", value: "Production", hint: "us-east-1", icon: Server, tone: "amber" as const },
      ];
    case "form":
      return [
        { label: "Drafts", value: "3", hint: "not published", icon: FileText, tone: "primary" as const },
        { label: "Published", value: "24", hint: "live now", icon: CheckCircle2, tone: "accent" as const },
        { label: "Templates", value: "6", hint: "reusable", icon: Layers, tone: "blue" as const },
        { label: "Completion", value: "92%", hint: "fields filled", icon: Gauge, tone: "amber" as const },
      ];
    case "monitor":
      return [
        { label: "Uptime (30d)", value: "99.96%", hint: "no incidents", icon: CheckCircle2, tone: "accent" as const },
        { label: "Latency p95", value: "418ms", hint: "stable", icon: Gauge, tone: "primary" as const },
        { label: "Throughput", value: "184k", hint: "requests today", icon: Activity, tone: "blue" as const },
        { label: "Error rate", value: "1.2%", hint: "last 24 hours", icon: AlertTriangle, tone: "rose" as const },
      ];
    case "detail":
      return [
        { label: "Total requests", value: "12,450", hint: "lifetime", icon: Activity, tone: "primary" as const },
        { label: "Quota used", value: "84%", hint: "this period", icon: Gauge, tone: "amber" as const },
        { label: "Active keys", value: "3", hint: "1 unused", icon: KeyRound, tone: "accent" as const },
        { label: "Member since", value: "2025", hint: "verified account", icon: Users, tone: "blue" as const },
      ];
    default:
      return [
        { label: "Total records", value: "1,248", hint: "+34 this week", icon: Layers, tone: "primary" as const },
        { label: "Active", value: "1,102", hint: "88% of total", icon: CheckCircle2, tone: "accent" as const },
        { label: "Pending review", value: "46", hint: "needs attention", icon: AlertTriangle, tone: "amber" as const },
        { label: "Growth", value: "+12.4%", hint: "vs last period", icon: BarChart3, tone: "blue" as const },
      ];
  }
}

function defaultFields(config: ModuleConfig) {
  if (config.fields) return config.fields;
  return [
    { label: "Display name", placeholder: "My workspace" },
    { label: "Contact email", placeholder: "team@example.com", type: "email" },
    { label: "Description", placeholder: "Describe what this is used for…" },
  ];
}

const settingsGroups = [
  {
    title: "General",
    description: "Core behaviour for this module.",
    options: [
      { label: "Enable module", description: "Turn this feature on for all users.", on: true },
      { label: "Strict validation", description: "Reject requests that fail schema checks.", on: true },
    ],
  },
  {
    title: "Notifications",
    description: "How and when the team is alerted.",
    options: [
      { label: "Email alerts", description: "Notify admins on failures and quota events.", on: true },
      { label: "Weekly digest", description: "Send a Monday summary of activity.", on: false },
    ],
  },
];

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

  const kind = config.kind;
  const stats = defaultStats(kind, config);
  const [saved, setSaved] = React.useState(false);
  const [toggles, setToggles] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(settingsGroups.flatMap((group) => group.options.map((option) => [option.label, option.on]))),
  );

  const onSave = (event: React.FormEvent) => {
    event.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Module"
        title={config.title}
        description={config.description}
        actions={
          <>
            <button type="button" className="btn btn-outline">
              <FileText className="h-4 w-4" /> Export
            </button>
            <button type="submit" form="module-form" className="btn btn-primary">
              <Plus className="h-4 w-4" /> {config.primary ?? "New item"}
            </button>
          </>
        }
      />

      {saved && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm text-accent">
          <CheckCircle2 className="h-4 w-4" /> Changes saved successfully.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} hint={stat.hint} icon={stat.icon} tone={stat.tone} />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {kind === "table" && <TableContent config={config} />}
          {kind === "monitor" && <MonitorContent config={config} />}
          {kind === "detail" && <DetailContent config={config} />}
          {kind === "form" && (
            <FormContent config={config} saved={saved} onSave={onSave} />
          )}
          {kind === "settings" && (
            <SettingsContent toggles={toggles} setToggles={setToggles} onSave={onSave} />
          )}
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
            <h2 className="font-semibold">Module notes</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              This screen is wired to the dashboard design system. Data shown is demo
              content until the corresponding API endpoint is connected.
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-accent" /> UI ready for data
            </div>
          </div>

          <div className="surface p-5">
            <h2 className="font-semibold">Recent changes</h2>
            <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>Configuration reviewed · 2h ago</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>Record updated · yesterday</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                <span>Module initialized · 3d ago</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function TableContent({ config }: { config: ModuleConfig }) {
  const [query, setQuery] = React.useState("");
  const columns = config.columns ?? ["Name", "Status", "Updated", "Owner"];
  const rows = Array.from({ length: 6 }, (_, index) =>
    columns.map((column) => cellValue(column, index)),
  ).filter((row) =>
    query.trim()
      ? row.some((cell) => cell.toLowerCase().includes(query.toLowerCase()))
      : true,
  );

  return (
    <div className="surface overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Records</h2>
          <p className="text-xs text-muted-foreground">{rows.length} records shown</p>
        </div>
        <label className="relative w-full sm:w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter records…"
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
              {columns.map((column) => (
                <th key={column} className="px-5 py-3 font-semibold">
                  {column}
                </th>
              ))}
              <th className="px-5 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-5 py-10 text-center text-sm text-muted-foreground">
                  No records match “{query}”.
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-border/70 last:border-0 hover:bg-muted/40">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={cn(
                        "px-5 py-3",
                        cellIndex === 0 && "font-medium",
                        /^(Active|Operational|Paid|Completed)$/i.test(cell) && "text-accent",
                        /^(Pending|Review|Paused)$/i.test(cell) && "text-amber-600 dark:text-amber-400",
                        /^(Failed|Suspended)$/i.test(cell) && "text-destructive",
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                  <td className="px-5 py-3 text-right">
                    <button type="button" className="text-xs font-semibold text-primary hover:underline">
                      Open
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MonitorContent({ config }: { config: ModuleConfig }) {
  const services =
    config.services ??
    [
      { name: "API gateway", detail: "42ms · 0 errors" },
      { name: "Download workers", detail: "1.1s · 3 retries" },
      { name: "Quota service", detail: "3ms · healthy" },
      { name: "Database", detail: "6ms · replica in sync" },
    ];
  return (
    <div className="space-y-4">
      <div className="surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Traffic and errors</h2>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Healthy
          </span>
        </div>
        <UsageAreaChart />
      </div>
      <div className="surface p-5">
        <h2 className="font-semibold">Services</h2>
        <div className="mt-3 divide-y divide-border">
          {services.map((service) => (
            <div key={service.name} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                <span className="text-sm">{service.name}</span>
              </div>
              <span className="font-mono text-xs text-muted-foreground">{service.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailContent({ config }: { config: ModuleConfig }) {
  const fields = [
    ["Email", "maya@acme.dev"],
    ["Plan", "Starter"],
    ["Status", "Active"],
    ["Joined", "Oct 21, 2026"],
    ["API keys", "3 active"],
    ["Requests used", "4,230 / 5,000"],
  ];
  return (
    <div className="space-y-4">
      <div className="surface flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-xl font-bold text-white">
          MC
        </span>
        <div className="flex-1">
          <h2 className="text-xl font-bold">Maya Chen</h2>
          <p className="text-sm text-muted-foreground">maya@acme.dev</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-semibold text-accent">Verified</span>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">Starter</span>
          </div>
        </div>
        <button type="button" className="btn btn-outline">
          <Mail className="h-4 w-4" /> Email user
        </button>
      </div>
      <div className="surface overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold">Account details</h2>
        </div>
        <dl className="grid gap-0 sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-3 last:border-0">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="surface p-5">
        <h2 className="font-semibold">{config.title} activity</h2>
        <div className="mt-3 space-y-2.5 text-sm text-muted-foreground">
          {["Info request · youtube · 200 OK", "Download request · tiktok · 200 OK", "Key created · Production"].map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FormContent({
  config,
  saved,
  onSave,
}: {
  config: ModuleConfig;
  saved: boolean;
  onSave: (event: React.FormEvent) => void;
}) {
  const fields = defaultFields(config);
  return (
    <form id="module-form" onSubmit={onSave} className="surface p-6">
      <h2 className="font-semibold">{config.primary ?? "Create item"}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Fill in the fields below. Changes are validated before saving.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {fields.map((field, index) => (
          <div
            key={field.label}
            className={cn("space-y-1.5", index >= 2 && "sm:col-span-2")}
          >
            <label className="text-sm font-medium">{field.label}</label>
            {index >= 2 ? (
              <textarea
                rows={4}
                placeholder={field.placeholder}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            ) : (
              <input
                type={field.type ?? "text"}
                placeholder={field.placeholder}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-2">
        <button type="submit" className="btn btn-primary">
          <CheckCircle2 className="h-4 w-4" /> {saved ? "Saved" : "Save changes"}
        </button>
        <button type="reset" className="btn btn-outline">
          Reset
        </button>
      </div>
    </form>
  );
}

function SettingsContent({
  toggles,
  setToggles,
  onSave,
}: {
  toggles: Record<string, boolean>;
  setToggles: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onSave: (event: React.FormEvent) => void;
}) {
  return (
    <form id="module-form" onSubmit={onSave} className="space-y-4">
      {settingsGroups.map((group) => (
        <div key={group.title} className="surface p-6">
          <h2 className="font-semibold">{group.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
          <div className="mt-4 space-y-3">
            {group.options.map((option) => {
              const on = toggles[option.label] ?? option.on;
              return (
                <div key={option.label} className="flex items-start justify-between gap-4 rounded-lg border border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-label={option.label}
                    onClick={() =>
                      setToggles((current) => ({ ...current, [option.label]: !on }))
                    }
                    className={cn(
                      "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors",
                      on ? "bg-primary" : "bg-muted-foreground/30",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                        on ? "translate-x-[22px]" : "translate-x-0.5",
                      )}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div className="surface p-6">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Security</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Changes to security policy are logged and take effect immediately.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Session timeout</label>
            <select className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option>30 minutes</option>
              <option>1 hour</option>
              <option>24 hours</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Allowed origins</label>
            <input
              defaultValue="https://deleteapi.com"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      </div>
      <button type="submit" className="btn btn-primary">
        <CheckCircle2 className="h-4 w-4" /> Save settings
      </button>
    </form>
  );
}
