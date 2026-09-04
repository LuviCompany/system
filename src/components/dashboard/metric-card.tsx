import { TrendingDown, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: boolean;
  /** Variação percentual opcional (ex: vs. período anterior). Positivo = verde, negativo = vermelho. */
  trend?: number;
  trendLabel?: string;
}

export function MetricCard({ label, value, icon: Icon, accent = false, trend, trendLabel }: MetricCardProps) {
  const hasTrend = typeof trend === "number";
  const isPositive = hasTrend && trend >= 0;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink-500">{label}</p>
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md",
            accent ? "bg-brand-50 text-brand-500" : "bg-surface-sunken text-ink-500",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-ink-900">{value}</p>
      {hasTrend && (
        <div
          className={cn(
            "mt-2 inline-flex items-center gap-1 text-xs font-medium",
            isPositive ? "text-success-500" : "text-danger-500",
          )}
        >
          {isPositive ? <TrendingUp className="h-3.5 w-3.5" aria-hidden /> : <TrendingDown className="h-3.5 w-3.5" aria-hidden />}
          <span>{Math.abs(trend).toFixed(1)}%</span>
          {trendLabel && <span className="font-normal text-ink-400">{trendLabel}</span>}
        </div>
      )}
    </Card>
  );
}
