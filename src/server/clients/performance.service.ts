import type { AdPlatform } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { compareTotals, deriveMetrics, previousPeriodOf, sumTotals } from "@/modules/clientes/metrics";
import type { DerivedMetrics, FunnelStep, PeriodComparison, PeriodRange, RawMetricsTotals } from "@/modules/clientes/types";

interface MetricFilter {
  organizationId: string;
  clientId: string;
  period: PeriodRange;
  platform?: AdPlatform;
}

async function fetchTotals(filter: MetricFilter): Promise<RawMetricsTotals> {
  const rows = await prisma.performanceMetric.findMany({
    where: {
      organizationId: filter.organizationId,
      clientId: filter.clientId,
      date: { gte: filter.period.start, lte: filter.period.end },
      ...(filter.platform ? { platform: filter.platform } : {}),
    },
    select: { investment: true, reach: true, impressions: true, clicks: true, leads: true, sales: true, revenue: true },
  });

  return sumTotals(
    rows.map((r) => ({
      investment: Number(r.investment),
      reach: r.reach,
      impressions: r.impressions,
      clicks: r.clicks,
      leads: r.leads,
      sales: r.sales,
      revenue: Number(r.revenue),
    })),
  );
}

export async function getClientMetrics(filter: MetricFilter): Promise<DerivedMetrics> {
  return deriveMetrics(await fetchTotals(filter));
}

export async function getClientPeriodComparison(filter: MetricFilter): Promise<PeriodComparison> {
  const previousPeriod = previousPeriodOf(filter.period.start, filter.period.end);
  const [current, previous] = await Promise.all([
    fetchTotals(filter),
    fetchTotals({ ...filter, period: previousPeriod }),
  ]);
  return compareTotals(current, previous);
}

/** Série diária para os gráficos de investimento x receita, conversões, ROAS e leads ao longo do tempo. */
export async function getClientTimeSeries(filter: MetricFilter) {
  const rows = await prisma.performanceMetric.findMany({
    where: {
      organizationId: filter.organizationId,
      clientId: filter.clientId,
      date: { gte: filter.period.start, lte: filter.period.end },
      ...(filter.platform ? { platform: filter.platform } : {}),
    },
    select: { date: true, investment: true, revenue: true, leads: true, sales: true },
    orderBy: { date: "asc" },
  });

  const byDay = new Map<string, { investment: number; revenue: number; leads: number; sales: number }>();
  for (const row of rows) {
    const key = row.date.toISOString().slice(0, 10);
    const current = byDay.get(key) ?? { investment: 0, revenue: 0, leads: 0, sales: 0 };
    current.investment += Number(row.investment);
    current.revenue += Number(row.revenue);
    current.leads += row.leads;
    current.sales += row.sales;
    byDay.set(key, current);
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({
      date,
      investment: Math.round(values.investment),
      revenue: Math.round(values.revenue),
      leads: values.leads,
      sales: values.sales,
      roas: values.investment > 0 ? values.revenue / values.investment : 0,
    }));
}

/** Performance agregada por plataforma (Meta Ads vs Google Ads) no período. */
export async function getPerformanceByPlatform(filter: Omit<MetricFilter, "platform">) {
  const [meta, google] = await Promise.all([
    getClientMetrics({ ...filter, platform: "META_ADS" }),
    getClientMetrics({ ...filter, platform: "GOOGLE_ADS" }),
  ]);
  return [
    { platform: "META_ADS" as const, label: "Meta Ads", ...meta },
    { platform: "GOOGLE_ADS" as const, label: "Google Ads", ...google },
  ];
}

/** Funil de performance (etapa 8). Visitas e Oportunidades são derivadas de
 * cliques/leads reais com uma taxa fixa e documentada — nunca inventadas do
 * zero — até existir uma fonte real de analytics/pipeline conectada. */
export async function getClientFunnel(filter: MetricFilter): Promise<FunnelStep[]> {
  const totals = await fetchTotals(filter);
  const visits = Math.round(totals.clicks * 0.82);
  const opportunities = Math.round(totals.leads * 0.55);

  return [
    { key: "impressoes", label: "Impressões", value: totals.impressions },
    { key: "alcance", label: "Alcance", value: totals.reach },
    { key: "cliques", label: "Cliques", value: totals.clicks },
    { key: "visitas", label: "Visitas", value: visits },
    { key: "leads", label: "Leads", value: totals.leads },
    { key: "oportunidades", label: "Oportunidades", value: opportunities },
    { key: "vendas", label: "Vendas", value: totals.sales },
  ];
}

export interface CampaignRow {
  id: string;
  platform: AdPlatform;
  name: string;
  status: string;
  metrics: DerivedMetrics;
}

export async function listCampaignsWithMetrics(filter: MetricFilter & { status?: string }): Promise<CampaignRow[]> {
  const campaigns = await prisma.campaign.findMany({
    where: {
      organizationId: filter.organizationId,
      clientId: filter.clientId,
      ...(filter.platform ? { platform: filter.platform } : {}),
      ...(filter.status ? { status: filter.status as never } : {}),
    },
    orderBy: { name: "asc" },
  });

  const rows = await Promise.all(
    campaigns.map(async (campaign) => {
      const campaignRows = await prisma.performanceMetric.findMany({
        where: { campaignId: campaign.id, date: { gte: filter.period.start, lte: filter.period.end } },
        select: { investment: true, reach: true, impressions: true, clicks: true, leads: true, sales: true, revenue: true },
      });
      const campaignTotals = sumTotals(
        campaignRows.map((r) => ({
          investment: Number(r.investment),
          reach: r.reach,
          impressions: r.impressions,
          clicks: r.clicks,
          leads: r.leads,
          sales: r.sales,
          revenue: Number(r.revenue),
        })),
      );
      return {
        id: campaign.id,
        platform: campaign.platform,
        name: campaign.name,
        status: campaign.status,
        metrics: deriveMetrics(campaignTotals),
      };
    }),
  );

  return rows;
}

export async function getBestCampaign(filter: MetricFilter): Promise<CampaignRow | null> {
  const campaigns = await listCampaignsWithMetrics(filter);
  if (campaigns.length === 0) return null;
  return campaigns.reduce((best, current) => (current.metrics.roas > best.metrics.roas ? current : best));
}

export interface AdRow {
  id: string;
  platform: AdPlatform;
  name: string;
  campaignName: string;
  metrics: DerivedMetrics;
}

export async function listAdsWithMetrics(filter: MetricFilter): Promise<AdRow[]> {
  const ads = await prisma.ad.findMany({
    where: {
      organizationId: filter.organizationId,
      clientId: filter.clientId,
      ...(filter.platform ? { platform: filter.platform } : {}),
    },
    include: { campaign: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  const rows = await Promise.all(
    ads.map(async (ad) => {
      const adRows = await prisma.performanceMetric.findMany({
        where: { adId: ad.id, date: { gte: filter.period.start, lte: filter.period.end } },
        select: { investment: true, reach: true, impressions: true, clicks: true, leads: true, sales: true, revenue: true },
      });
      const totals = sumTotals(
        adRows.map((r) => ({
          investment: Number(r.investment),
          reach: r.reach,
          impressions: r.impressions,
          clicks: r.clicks,
          leads: r.leads,
          sales: r.sales,
          revenue: Number(r.revenue),
        })),
      );
      return {
        id: ad.id,
        platform: ad.platform,
        name: ad.name,
        campaignName: ad.campaign.name,
        metrics: deriveMetrics(totals),
      };
    }),
  );

  return rows.sort((a, b) => b.metrics.roas - a.metrics.roas);
}

export async function getBestAd(filter: MetricFilter): Promise<AdRow | null> {
  const ads = await listAdsWithMetrics(filter);
  return ads[0] ?? null;
}
