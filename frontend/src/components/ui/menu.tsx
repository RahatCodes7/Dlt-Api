"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface MenuProps {
  children?: React.ReactNode;
}

interface MenuTriggerProps {
  children?: React.ReactNode;
}

interface MenuContentProps {
  children?: React.ReactNode;
  className?: string;
}

interface MenuItemProps {
  children?: React.ReactNode;
  onSelect?: () => void;
  className?: string;
  disabled?: boolean;
}

interface MenuSeparatorProps {
  className?: string;
}

interface MenuLabelProps {
  children?: React.ReactNode;
  className?: string;
}

export function Menu({ children }: MenuProps) {
  return <>{children}</>;
}

export function MenuTrigger({ children }: MenuTriggerProps) {
  return <>{children}</>;
}

export function MenuContent({ children, className }: MenuContentProps) {
  return (
    <div
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-card p-1 text-card-foreground shadow-lg",
        className
      )}
    >
      {children}
    </div>
  );
}

export function MenuItem({ children, onSelect, className, disabled }: MenuItemProps) {
  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        disabled && "text-muted-foreground",
        className
      )}
      onClick={onSelect}
    >
      {children}
    </div>
  );
}

export function MenuSeparator({ className }: MenuSeparatorProps) {
  return (
    <div className={cn("-mx-1 h-px bg-border my-1", className)} />
  );
}

export function MenuLabel({ children, className }: MenuLabelProps) {
  return (
    <div className={cn("px-2 py-1.5 text-xs font-medium text-muted-foreground", className)}>
      {children}
    </div>
  );
}

export const MenuGroup = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
export const MenuPortal = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
export const MenuSub = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
export const MenuSubTrigger = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
export const MenuSubContent = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
export const MenuRadioGroup = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
export const MenuRadioItem = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
export const MenuShortcut = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <span className={cn("ml-auto text-xs text-muted-foreground", className)}>{children}</span>
);

export const Check = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
);
export const ChevronRight = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
);
