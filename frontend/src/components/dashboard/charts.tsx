"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { usageData } from "@/lib/usage";



const tooltipStyle = {
  backgroundColor: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: "0.6rem",
  fontSize: "12px",
  color: "var(--color-foreground)",
};

export function UsageAreaChart({ data = usageData }: { data?: typeof usageData }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="errorFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-destructive)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="var(--color-destructive)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
            width={48}
          />
          <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "var(--color-border)" }} />
          <Area
            type="monotone"
            dataKey="requests"
            stroke="var(--color-primary)"
            strokeWidth={2.5}
            fill="url(#usageFill)"
            name="Requests"
          />
          <Area
            type="monotone"
            dataKey="errors"
            stroke="var(--color-destructive)"
            strokeWidth={1.5}
            fill="url(#errorFill)"
            name="Errors"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const revenueData = [
  { month: "Jun", revenue: 4200 },
  { month: "Jul", revenue: 5100 },
  { month: "Aug", revenue: 4800 },
  { month: "Sep", revenue: 6300 },
  { month: "Oct", revenue: 7200 },
  { month: "Nov", revenue: 8600 },
];

export function RevenueBarChart() {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={revenueData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
            width={52}
          />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-muted)" }} />
          <Bar dataKey="revenue" fill="var(--color-primary)" radius={[6, 6, 0, 0]} name="Revenue" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
