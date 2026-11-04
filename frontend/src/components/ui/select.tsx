"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children?: React.ReactNode;
}

export function Select({ className, label, error, children, id, ...props }: SelectProps) {
  const selectId = id || React.useId();
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-foreground mb-1">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Textarea({ className, label, error, helperText, id, ...props }: TextareaProps) {
  const textareaId = id || React.useId();
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-foreground mb-1">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
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

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Switch({ className, label, id, ...props }: SwitchProps) {
  const switchId = id || React.useId();
  return (
    <div className={cn("items-center", className)}>
      <input
        type="checkbox"
        id={switchId}
        className="peer sr-only"
        {...props}
      />
      {label && (
        <label
          htmlFor={switchId}
          className="ml-2 text-sm font-medium text-foreground peer-checked:text-primary"
        >
          {label}
        </label>
      )}
    </div>
  );
}

interface SeparatorProps extends React.HTMLAttributes<HTMLHRElement> {
  title?: string;
  className?: string;
}

export function Separator({ className, title, children, ...props }: SeparatorProps) {
  return (
    <div className={cn("relative flex w-full items-center gap-1.5 text-muted-foreground", className)} {...props}>
      <div className="flex-grow border-t" />
      {title || children ? (
        <span className="px-2 text-xs font-medium">{title}</span>
      ) : null}
      <div className="flex-grow border-t" />
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

interface ToastProps {
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning";
}

export function Toast({ title, description, variant = "default" }: ToastProps) {
  const colors = {
    default: "bg-background text-foreground border-gray-200 dark:border-gray-700",
    destructive: "bg-destructive text-destructive-foreground border-destructive",
    success: "bg-emerald-50 text-emerald-900 border-emerald-200",
    warning: "bg-amber-50 text-amber-900 border-amber-200",
  };
  return (
    <div className={cn("flex items-center gap-3 p-4 rounded-xl border shadow-lg", colors[variant])}>
      {variant === "success" && (
        <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {variant === "destructive" && (
        <svg className="h-5 w-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v6z" />
        </svg>
      )}
      <div>
        <h4 className="font-semibold">{title}</h4>
        {description && <p className="text-sm opacity-90">{description}</p>}
      </div>
    </div>
  );
}

interface DataTableProps {
  columns: string[];
  data: Record<string, unknown>[];
  renderRow: (item: Record<string, unknown>, index: number) => React.ReactNode;
}

export function DataTable({ columns, data, renderRow }: DataTableProps) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-background">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-muted-foreground">
            {columns.map((col) => (
              <th key={col} className="h-10 px-4 text-left font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="border-b hover:bg-muted/30">
              {renderRow(item, index)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
