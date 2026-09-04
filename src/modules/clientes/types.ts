/** Intervalo de datas usado por todo o módulo Clientes (dashboard, campanhas, relatórios). */
export interface PeriodRange {
  start: Date;
  end: Date;
}

/** Métricas brutas agregadas de um conjunto de PerformanceMetric. */
export interface RawMetricsTotals {
  investment: number;
  reach: number;
  impressions: number;
  clicks: number;
  leads: number;
  sales: number;
  revenue: number;
}

/** Totais + métricas derivadas (CTR, CPC, CPL, CPA, ROAS), calculadas em runtime. */
export interface DerivedMetrics extends RawMetricsTotals {
  ctr: number; // %
  cpc: number;
  cpl: number;
  cpa: number;
  roas: number;
}

export interface PeriodComparison {
  current: DerivedMetrics;
  previous: DerivedMetrics;
  /** Variação percentual (current vs previous) por campo — null quando previous é 0. */
  variation: Record<keyof RawMetricsTotals | "ctr" | "cpc" | "cpl" | "cpa" | "roas", number | null>;
}

export interface FunnelStep {
  key: string;
  label: string;
  value: number;
}
