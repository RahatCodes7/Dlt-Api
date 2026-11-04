"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LayoutDashboard, Rocket, Link as LinkIcon, Key, Play, BarChart3, CreditCard, FileText, BookOpen, HelpCircle, User, Shield, Bell, Settings as SettingsIcon, LogOut } from "lucide-react";

const navItems = [
  { name: "Overview", href: "/dashboard/overview", icon: LayoutDashboard, group: "main" },
  { name: "Quick Start", href: "/dashboard/quick-start", icon: Rocket, group: "main" },
  { name: "My APIs", href: "/dashboard/my-apis", icon: LinkIcon, group: "api" },
  { name: "API Keys", href: "/dashboard/api-keys", icon: Key, group: "api" },
  { name: "API Playground", href: "/dashboard/api-playground", icon: Play, group: "api" },
  { name: "API Configuration", href: "/dashboard/api-configuration", icon: SettingsIcon, group: "api" },
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

const groups = [
  { key: "main", label: "MAIN" },
  { key: "api", label: "API MANAGEMENT" },
  { key: "analytics", label: "ANALYTICS" },
  { key: "billing", label: "BILLING" },
  { key: "developer", label: "DEVELOPER" },
  { key: "account", label: "ACCOUNT" },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const user = { name: "Developer", email: "dev@example.com", avatar: undefined };

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
            <Avatar src={user.avatar} alt={user.name} className="h-8 w-8" />
            <div className="hidden sm:block">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-10 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Top bar for mobile */}
      <div className="md:hidden lg:hidden flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700 bg-background z-20">
        <button onClick={() => setSidebarOpen(true)} className="p-2 text-muted-foreground hover:text-primary">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <h1 className="text-lg font-bold">Dashboard</h1>
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
