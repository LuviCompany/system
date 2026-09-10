import type { NormalizedAdMetric, NormalizedCampaignMetric } from "@/server/integrations/ads-provider";

import type { MetaInsightsRow } from "./client";

/**
 * Converte uma linha de Insights (spend já na moeda da conta, nunca em
 * micros) para o modelo interno. IMPORTANTE: `conversions`/`conversionValue`
 * ficam sempre em 0 nesta etapa — a Meta não tem um campo único
 * "conversions" como o Google (`metrics.conversions`); o dado real está
 * espalhado num array `actions[]` com dezenas de tipos de evento possíveis
 * (lead, purchase, onsite_conversion.*, ...), e qual(is) tipo(s) contar
 * como conversão é uma decisão de negócio que não foi especificada — não
 * inventamos esse número. impressions/clicks/spend são inequívocos e vêm
 * reais. Ver docs/meta-ads.md para revisitar isso numa próxima etapa.
 */

interface RawInsightsRow {
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  date_start?: string;
  impressions?: string | number;
  clicks?: string | number;
  spend?: string | number;
}

export function normalizeCampaignRow(row: MetaInsightsRow, statusByCampaignId: Map<string, string>): NormalizedCampaignMetric | null {
  const raw = row as RawInsightsRow;
  if (!raw.campaign_id || !raw.date_start) return null;

  return {
    externalCampaignId: raw.campaign_id,
    campaignName: raw.campaign_name ?? `Campanha ${raw.campaign_id}`,
    campaignStatus: statusByCampaignId.get(raw.campaign_id) ?? "UNKNOWN",
    date: new Date(raw.date_start),
    impressions: Number(raw.impressions ?? 0),
    clicks: Number(raw.clicks ?? 0),
    spend: Number(raw.spend ?? 0),
    conversions: 0,
    conversionValue: 0,
  };
}

export function normalizeAdRow(row: MetaInsightsRow): NormalizedAdMetric | null {
  const raw = row as RawInsightsRow;
  if (!raw.campaign_id || !raw.adset_id || !raw.ad_id || !raw.date_start) return null;

  return {
    externalCampaignId: raw.campaign_id,
    campaignName: raw.campaign_name ?? `Campanha ${raw.campaign_id}`,
    externalAdGroupId: raw.adset_id,
    adGroupName: raw.adset_name ?? `Conjunto ${raw.adset_id}`,
    externalAdId: raw.ad_id,
    adName: raw.ad_name ?? `Anúncio ${raw.ad_id}`,
    date: new Date(raw.date_start),
    impressions: Number(raw.impressions ?? 0),
    clicks: Number(raw.clicks ?? 0),
    spend: Number(raw.spend ?? 0),
    conversions: 0,
    conversionValue: 0,
  };
}
