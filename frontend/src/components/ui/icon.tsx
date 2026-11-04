"use client";

import * as React from "react";
import {
  Play,
  Zap,
  Code2,
  BarChart3,
  ShieldCheck,
  TrendingUp,
  Clock,
  Layers,
  Check,
  Rocket,
  Mail,
  Lock,
  User,
  AlertCircle,
  Smartphone,
} from "lucide-react";

const IconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  Play,
  Zap,
  Code2,
  BarChart3,
  ShieldCheck,
  TrendingUp,
  Clock,
  Layers,
  Check,
  Rocket,
  Mail,
  Lock,
  User,
  AlertCircle,
  Smartphone,
};

interface IconProps {
  name: string;
  className?: string;
  size?: number;
}

export function Icon({ name, className, size }: IconProps) {
  const IconComponent = IconMap[name];
  if (!IconComponent) return null;
  return <IconComponent className={className} size={size} />;
}
