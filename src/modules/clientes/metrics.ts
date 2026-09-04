import type { DerivedMetrics, PeriodComparison, RawMetricsTotals } from "./types";

const EMPTY_TOTALS: RawMetricsTotals = {
  investment: 0,
  reach: 0,
  impressions: 0,
  clicks: 0,
  leads: 0,
  sales: 0,
  revenue: 0,
};

export function emptyTotals(): RawMetricsTotals {
  return { ...EMPTY_TOTALS };
}

export function sumTotals(rows: RawMetricsTotals[]): RawMetricsTotals {
  return rows.reduce<RawMetricsTotals>(
    (acc, row) => ({
      investment: acc.investment + row.investment,
      reach: acc.reach + row.reach,
      impressions: acc.impressions + row.impressions,
      clicks: acc.clicks + row.clicks,
      leads: acc.leads + row.leads,
      sales: acc.sales + row.sales,
      revenue: acc.revenue + row.revenue,
    }),
    emptyTotals(),
  );
}

function safeDiv(a: number, b: number): number {
  return b > 0 ? a / b : 0;
}

/** Calcula as métricas derivadas (nunca armazenadas) a partir dos totais brutos. */
export function deriveMetrics(totals: RawMetricsTotals): DerivedMetrics {
  return {
    ...totals,
    ctr: safeDiv(totals.clicks, totals.impressions) * 100,
    cpc: safeDiv(totals.investment, totals.clicks),
    cpl: safeDiv(totals.investment, totals.leads),
    cpa: safeDiv(totals.investment, totals.sales),
    roas: safeDiv(totals.revenue, totals.investment),
  };
}

function variationOf(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export function compareTotals(currentTotals: RawMetricsTotals, previousTotals: RawMetricsTotals): PeriodComparison {
  const current = deriveMetrics(currentTotals);
  const previous = deriveMetrics(previousTotals);

  return {
    current,
    previous,
    variation: {
      investment: variationOf(current.investment, previous.investment),
      reach: variationOf(current.reach, previous.reach),
      impressions: variationOf(current.impressions, previous.impressions),
      clicks: variationOf(current.clicks, previous.clicks),
      leads: variationOf(current.leads, previous.leads),
      sales: variationOf(current.sales, previous.sales),
      revenue: variationOf(current.revenue, previous.revenue),
      ctr: variationOf(current.ctr, previous.ctr),
      cpc: variationOf(current.cpc, previous.cpc),
      cpl: variationOf(current.cpl, previous.cpl),
      cpa: variationOf(current.cpa, previous.cpa),
      roas: variationOf(current.roas, previous.roas),
    },
  };
}

/** Deriva o intervalo anterior de mesma duração, imediatamente antes de `start`. */
export function previousPeriodOf(start: Date, end: Date): { start: Date; end: Date } {
  const durationMs = end.getTime() - start.getTime();
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - durationMs);
  return { start: previousStart, end: previousEnd };
}
