"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactDate, formatCurrency, formatDecimal, formatNumber } from "@/lib/format";

import { ChartTooltip } from "@/components/dashboard/chart-tooltip";

export interface TimeSeriesPoint {
  date: string;
  investment: number;
  revenue: number;
  leads: number;
  sales: number;
  roas: number;
}

function axisDate(value: string) {
  return formatCompactDate(new Date(value));
}

interface PerformanceChartsProps {
  series: TimeSeriesPoint[];
}

export function PerformanceCharts({ series }: PerformanceChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Investimento x Receita</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={series} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tickFormatter={axisDate} tick={{ fontSize: 11, fill: "var(--color-ink-500)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-ink-500)" }} axisLine={false} tickLine={false} width={56} />
              <Tooltip content={<ChartTooltip labelFormatter={(l) => axisDate(String(l))} valueFormatter={(v) => formatCurrency(Number(v))} />} />
              <Line type="monotone" dataKey="investment" name="Investimento" stroke="var(--color-ink-500)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="revenue" name="Receita" stroke="var(--color-brand-500)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>ROAS ao longo do tempo</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={series} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tickFormatter={axisDate} tick={{ fontSize: 11, fill: "var(--color-ink-500)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-ink-500)" }} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<ChartTooltip labelFormatter={(l) => axisDate(String(l))} valueFormatter={(v) => formatDecimal(Number(v))} />} />
              <Line type="monotone" dataKey="roas" name="ROAS" stroke="var(--color-brand-500)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Leads ao longo do tempo</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={series} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tickFormatter={axisDate} tick={{ fontSize: 11, fill: "var(--color-ink-500)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-ink-500)" }} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<ChartTooltip labelFormatter={(l) => axisDate(String(l))} valueFormatter={(v) => formatNumber(Number(v))} />} />
              <Line type="monotone" dataKey="leads" name="Leads" stroke="var(--color-info-500)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Conversões ao longo do tempo</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={series} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tickFormatter={axisDate} tick={{ fontSize: 11, fill: "var(--color-ink-500)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-ink-500)" }} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<ChartTooltip labelFormatter={(l) => axisDate(String(l))} valueFormatter={(v) => formatNumber(Number(v))} />} />
              <Line type="monotone" dataKey="sales" name="Vendas" stroke="var(--color-success-500)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
