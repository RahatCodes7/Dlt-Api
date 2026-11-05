"use client";

import * as React from "react";
import {
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
} from "lucide-react";
import { DashboardShell, type NavGroup, type NavItem } from "@/components/dashboard/shell";

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

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      navItems={navItems}
      groups={groups}
      roleLabel="Developer"
      planLabel="Starter"
      user={{ name: "Developer", email: "dev@example.com" }}
    >
      {children}
    </DashboardShell>
  );
}
