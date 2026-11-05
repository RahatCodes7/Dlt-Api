"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Users,
  Link as LinkIcon,
  Plus,
  CreditCard,
  FileText,
  Shield,
  BarChart3,
  Settings as SettingsIcon,
  HelpCircle,
  Bell,
  Cpu,
  Database,
  Lock,
  UserCog,
  BookOpen,
  KeyRound,
  Server,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardShell, type NavGroup, type NavItem } from "@/components/dashboard/shell";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const navItems: NavItem[] = [
  { name: "Overview", href: "/admin/dashboard", icon: LayoutDashboard, group: "overview" },
  { name: "All Users", href: "/admin/users/all", icon: Users, group: "users" },
  { name: "Active Users", href: "/admin/users/active", icon: Users, group: "users" },
  { name: "Suspended Users", href: "/admin/users/suspended", icon: Shield, group: "users" },
  { name: "User Details", href: "/admin/users/1", icon: UserCog, group: "users" },
  { name: "All APIs", href: "/admin/apis/all", icon: LinkIcon, group: "apis" },
  { name: "Add New API", href: "/admin/apis/add", icon: Plus, group: "apis" },
  { name: "API Configuration", href: "/admin/apis/configuration", icon: SettingsIcon, group: "apis" },
  { name: "API Endpoints", href: "/admin/apis/endpoints", icon: FileText, group: "apis" },
  { name: "API Monitoring", href: "/admin/apis/monitoring", icon: BarChart3, group: "apis" },
  { name: "All Plans", href: "/admin/plans/all", icon: CreditCard, group: "plans" },
  { name: "Create Plan", href: "/admin/plans/create", icon: Plus, group: "plans" },
  { name: "Edit Plans", href: "/admin/plans/edit", icon: SettingsIcon, group: "plans" },
  { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard, group: "plans" },
  { name: "Transactions", href: "/admin/transactions", icon: FileText, group: "finance" },
  { name: "Payment Verification", href: "/admin/payment-verification", icon: Shield, group: "finance" },
  { name: "Revenue Analytics", href: "/admin/revenue-analytics", icon: BarChart3, group: "finance" },
  { name: "Invoices", href: "/admin/invoices", icon: FileText, group: "finance" },
  { name: "API Logs", href: "/admin/api-logs", icon: FileText, group: "system" },
  { name: "Error Logs", href: "/admin/error-logs", icon: FileText, group: "system" },
  { name: "Rate Limits", href: "/admin/rate-limits", icon: Lock, group: "system" },
  { name: "Proxies", href: "/admin/proxy-management", icon: Database, group: "system", badge: "live" },
  { name: "Server Monitoring", href: "/admin/server-monitoring", icon: Cpu, group: "system" },
  { name: "Maintenance Mode", href: "/admin/maintenance-mode", icon: Server, group: "system" },
  { name: "Support Tickets", href: "/admin/support-tickets", icon: HelpCircle, group: "support" },
  { name: "Announcements", href: "/admin/announcements", icon: Bell, group: "support" },
  { name: "Notifications", href: "/admin/notifications", icon: Bell, group: "support" },
  { name: "Homepage Settings", href: "/admin/homepage-settings", icon: LayoutDashboard, group: "website" },
  { name: "Branding", href: "/admin/branding", icon: SettingsIcon, group: "website" },
  { name: "FAQ Management", href: "/admin/faq-management", icon: HelpCircle, group: "website" },
  { name: "Documentation", href: "/admin/documentation", icon: BookOpen, group: "website" },
  { name: "SEO Settings", href: "/admin/seo-settings", icon: SettingsIcon, group: "website" },
  { name: "General Settings", href: "/admin/general-settings", icon: SettingsIcon, group: "settings" },
  { name: "Security", href: "/admin/security", icon: Lock, group: "settings" },
  { name: "Admin Profile", href: "/admin/admin-profile", icon: KeyRound, group: "settings" },
  { name: "System Configuration", href: "/admin/system-configuration", icon: Cpu, group: "settings" },
];

const groups: NavGroup[] = [
  { key: "overview", label: "Overview" },
  { key: "users", label: "User management" },
  { key: "apis", label: "API management" },
  { key: "plans", label: "Subscriptions" },
  { key: "finance", label: "Finance" },
  { key: "system", label: "System" },
  { key: "support", label: "Support" },
  { key: "website", label: "Website" },
  { key: "settings", label: "Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/v1/auth/me`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        if (!data || data.role !== "admin") {
          router.replace("/dashboard");
          setAllowed(false);
        } else {
          setAllowed(true);
        }
      })
      .catch(() => {
        if (!active) return;
        router.replace("/login");
        setAllowed(false);
      });
    return () => {
      active = false;
    };
  }, [router]);

  if (allowed !== true) {
    return null;
  }

  return (
    <DashboardShell
      navItems={navItems}
      groups={groups}
      roleLabel="Admin"
      user={{ name: "Admin", email: "admin@deleteapi.com" }}
    >
      {children}
    </DashboardShell>
  );
}
