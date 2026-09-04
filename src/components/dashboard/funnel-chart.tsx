"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatNumber } from "@/lib/format";

import { ChartTooltip } from "./chart-tooltip";

interface FunnelChartProps {
  data: { stage: string; label: string; count: number }[];
}

export function FunnelChart({ data }: FunnelChartProps) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke="var(--color-border)" />
        <XAxis type="number" tick={{ fontSize: 12, fill: "var(--color-ink-500)" }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 12, fill: "var(--color-ink-700)" }}
          axisLine={false}
          tickLine={false}
          width={100}
        />
        <Tooltip content={<ChartTooltip valueFormatter={(value) => formatNumber(Number(value))} />} />
        <Bar dataKey="count" name="Leads" fill="var(--color-brand-500)" radius={[0, 4, 4, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}
