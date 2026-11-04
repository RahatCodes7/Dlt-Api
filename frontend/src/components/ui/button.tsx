"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "accent";
  size?: "sm" | "md" | "lg";
}

const buttonVariants = (props: { variant?: ButtonProps["variant"]; size?: ButtonProps["size"]; className?: string }) => {
  const { variant = "default", size = "md", className } = props;
  return cn(
    "inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
      accent: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/25 hover:shadow-accent/40",
    },
    {
      sm: "h-9 px-3",
      md: "h-10 px-4 py-2",
      lg: "h-11 px-8",
    }[size],
    className
  );
};

export function Button({ className, variant = "default", size = "md", asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={buttonVariants({ variant, size, className })} {...props} />
  );
}
