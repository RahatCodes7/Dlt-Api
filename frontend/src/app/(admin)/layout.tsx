"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LayoutDashboard, Users, Link as LinkIcon, Plus, CreditCard, FileText, Shield, BarChart3, Settings as SettingsIcon, HelpCircle, Bell, Cpu, Database, Lock, UserCog, LogOut, BookOpen } from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, group: "overview" },
  { name: "All Users", href: "/admin/users/all", icon: Users, group: "users" },
  { name: "Active Users", href: "/admin/users/active", icon: Users, group: "users" },
  { name: "Suspended Users", href: "/admin/users/suspended", icon: Users, group: "users" },
  { name: "User Details", href: "/admin/users/[id]", icon: UserCog, group: "users" },
  { name: "All APIs", href: "/admin/apis/all", icon: LinkIcon, group: "apis" },
  { name: "Add New API", href: "/admin/apis/add", icon: Plus, group: "apis" },
  { name: "API Configuration", href: "/admin/apis/configuration", icon: SettingsIcon, group: "apis" },
  { name: "API Endpoints", href: "/admin/apis/endpoints", icon: FileText, group: "apis" },
  { name: "API Monitoring", href: "/admin/apis/monitoring", icon: BarChart3, group: "apis" },
  { name: "All Plans", href: "/admin/plans/all", icon: CreditCard, group: "plans" },
  { name: "Create Plan", href: "/admin/plans/create", icon: Plus, group: "plans" },
  { name: "Edit Plans", href: "/admin/plans/edit", icon: SettingsIcon, group: "plans" },
  { name: "Subscription Records", href: "/admin/subscriptions", icon: CreditCard, group: "plans" },
  { name: "Transactions", href: "/admin/transactions", icon: FileText, group: "finance" },
  { name: "Payment Verification", href: "/admin/payment-verification", icon: Shield, group: "finance" },
  { name: "Revenue Analytics", href: "/admin/revenue-analytics", icon: BarChart3, group: "finance" },
  { name: "Invoices", href: "/admin/invoices", icon: FileText, group: "finance" },
  { name: "API Logs", href: "/admin/api-logs", icon: FileText, group: "system" },
  { name: "Error Logs", href: "/admin/error-logs", icon: FileText, group: "system" },
  { name: "Rate Limits", href: "/admin/rate-limits", icon: Lock, group: "system" },
  { name: "Proxy Management", href: "/admin/proxy-management", icon: Database, group: "system" },
  { name: "Server Monitoring", href: "/admin/server-monitoring", icon: Cpu, group: "system" },
  { name: "Maintenance Mode", href: "/admin/maintenance-mode", icon: Lock, group: "system" },
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
  { name: "Admin Profile", href: "/admin/admin-profile", icon: UserCog, group: "settings" },
  { name: "System Configuration", href: "/admin/system-configuration", icon: Cpu, group: "settings" },
];

const groups = [
  { key: "overview", label: "OVERVIEW" },
  { key: "users", label: "USER MANAGEMENT" },
  { key: "apis", label: "API MANAGEMENT" },
  { key: "plans", label: "SUBSCRIPTION MANAGEMENT" },
  { key: "finance", label: "FINANCE" },
  { key: "system", label: "SYSTEM MANAGEMENT" },
  { key: "support", label: "CUSTOMER SUPPORT" },
  { key: "website", label: "WEBSITE MANAGEMENT" },
  { key: "settings", label: "SETTINGS" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const admin = { name: "Admin", email: "admin@deleteapi.com", avatar: undefined };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 left-0 z-20 h-full w-64 bg-card border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 -translate-x-full md:translate-x-0 lg:static md:block">
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-primary font-bold text-lg">DLT</span>
            <span className="font-bold text-sm tracking-tight">DELETE<span className="text-primary">API</span></span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 text-muted-foreground hover:text-primary">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 p-4 space-y-2">
          {groups.map((group) => {
            const items = navItems.filter((i) => i.group === group.key);
            if (items.length === 0) return null;
            return (
              <div key={group.key} className="mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">{group.label}</h3>
                <div className="space-y-1">
                  {items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-primary"}`}>
                        <item.icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
            <Avatar src={admin.avatar} alt={admin.name} className="h-8 w-8" />
            <div className="hidden sm:block">
              <p className="text-sm font-medium">{admin.name}</p>
              <p className="text-xs text-muted-foreground">{admin.email}</p>
            </div>
          </div>
        </div>
      </nav>

      {sidebarOpen && (
        <div className="fixed inset-0 z-10 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="md:hidden lg:hidden flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700 bg-background z-20">
        <button onClick={() => setSidebarOpen(true)} className="p-2 text-muted-foreground hover:text-primary">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <h1 className="text-lg font-bold">Control Center</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>

      <main className="md:pl-64 lg:pl-64 pt-16 px-6 py-8 md:py-12">
        {children}
      </main>
    </div>
  );
}
