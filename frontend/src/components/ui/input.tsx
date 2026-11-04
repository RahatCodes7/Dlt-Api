"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({ className, type = "text", label, error, helperText, id, ...props }: InputProps) {
  const inputId = id || React.useId();
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-foreground mb-1">
          {label}
        </label>
      )}
      <input
        type={type}
        id={inputId}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      {helperText && <p className="mt-1 text-sm text-muted-foreground">{helperText}</p>}
    </div>
  );
}

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
  children?: React.ReactNode;
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        {
          default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
          secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
          destructive: "border-transparent bg-destructive text-destructive-foreground",
          outline: "border-input bg-transparent",
          success: "border-transparent bg-emerald-100 text-emerald-700",
          warning: "border-transparent bg-amber-100 text-amber-700",
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface AvatarProps extends React.HTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  className?: string;
}

export function Avatar({ src, alt = "User", className }: AvatarProps) {
  return (
    <img
      src={src || "https://ui-avatars.com/api/?name=" + encodeURIComponent(alt)}
      alt={alt}
      className={cn("rounded-full h-8 w-8 object-cover border border-gray-200 dark:border-gray-700", className)}
    />
  );
}
