import Link from "next/link";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
  showWordmark = true,
  size = "md",
}: {
  className?: string;
  href?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const box = {
    sm: "h-7 w-7 rounded-lg",
    md: "h-9 w-9 rounded-xl",
    lg: "h-11 w-11 rounded-2xl",
  }[size];
  const icon = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" }[size];
  const text = { sm: "text-base", md: "text-lg", lg: "text-xl" }[size];

  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="DELETE API home"
    >
      <span
        className={cn(
          "relative flex items-center justify-center bg-gradient-to-br from-primary via-primary to-accent text-white shadow-lg shadow-primary/25 transition-transform duration-300 group-hover:scale-105",
          box,
        )}
      >
        <Download className={icon} strokeWidth={2.4} aria-hidden="true" />
      </span>
      {showWordmark && (
        <span className={cn("font-bold tracking-tight", text)}>
          DELETE<span className="text-primary">API</span>
        </span>
      )}
    </Link>
  );
}
