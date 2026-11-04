import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const features = [
  { name: "YouTube", desc: "Video info & download" },
  { name: "Instagram", desc: "Media info & download" },
  { name: "Facebook", desc: "Video info & download" },
  { name: "TikTok", desc: "Video info & download" },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">DLT</span>
            </div>
            <span className="font-bold text-xl tracking-tight">DELETE<span className="text-primary">API</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Home</Link>
            <Link href="/apis" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">APIs</Link>
            <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Pricing</Link>
            <Link href="/documentation" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Documentation</Link>
            <Link href="/status" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">API Status</Link>
            <Link href="/playground" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">API Playground</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:inline-block text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Login</Link>
            <Link href="/register" className="btn-primary text-sm px-5 py-2 rounded-lg">Get Started</Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-gray-200 dark:border-gray-700 bg-muted/50 mt-auto">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">DLT</span>
              </div>
              <span className="font-bold text-lg">DELETE<span className="text-primary">API</span></span>
            </div>
            <div className="text-sm text-muted-foreground">
              DELETE API Platform &copy; 2026. Built for developers.
            </div>
            <div className="flex items-center gap-4">
              <a href="/" className="text-muted-foreground hover:text-primary transition-colors text-sm">Home</a>
              <a href="/pricing" className="text-muted-foreground hover:text-primary transition-colors text-sm">Pricing</a>
              <a href="/documentation" className="text-muted-foreground hover:text-primary transition-colors text-sm">Documentation</a>
              <a href="/contact" className="text-muted-foreground hover:text-primary transition-colors text-sm">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
