import type { NormalizedAdMetric, NormalizedCampaignMetric } from "@/server/integrations/ads-provider";

import type { GoogleAdsSearchRow } from "./client";

/**
 * Converte valores monetários do Google (sempre em "micros" — 1 unidade da
 * moeda = 1.000.000 micros) para a moeda real da conta (etapa 11). A moeda
 * em si (`currencyCode`) vem de `customer.currency_code` e é guardada à
 * parte (ver connection.service.ts) — este módulo nunca converte entre
 * moedas diferentes, só de micros para unidade.
 */
export function microsToCurrency(micros: string | number | undefined | null): number {
  if (micros === undefined || micros === null) return 0;
  return Number(micros) / 1_000_000;
}

interface RawCampaignRow {
  campaign?: { id?: string; name?: string; status?: string };
  segments?: { date?: string };
  metrics?: {
    impressions?: string | number;
    clicks?: string | number;
    costMicros?: string | number;
    conversions?: string | number;
    conversionsValue?: string | number;
  };
}

export function normalizeCampaignRow(row: GoogleAdsSearchRow): NormalizedCampaignMetric | null {
  const raw = row as RawCampaignRow;
  if (!raw.campaign?.id || !raw.segments?.date) return null;

  return {
    externalCampaignId: raw.campaign.id,
    campaignName: raw.campaign.name ?? `Campanha ${raw.campaign.id}`,
    campaignStatus: raw.campaign.status ?? "UNKNOWN",
    date: new Date(raw.segments.date),
    impressions: Number(raw.metrics?.impressions ?? 0),
    clicks: Number(raw.metrics?.clicks ?? 0),
    spend: microsToCurrency(raw.metrics?.costMicros),
    conversions: Number(raw.metrics?.conversions ?? 0),
    conversionValue: Number(raw.metrics?.conversionsValue ?? 0),
  };
}

interface RawAdRow {
  campaign?: { id?: string; name?: string };
  adGroup?: { id?: string; name?: string };
  adGroupAd?: { ad?: { id?: string; name?: string } };
  segments?: { date?: string };
  metrics?: {
    impressions?: string | number;
    clicks?: string | number;
    costMicros?: string | number;
    conversions?: string | number;
    conversionsValue?: string | number;
  };
}

export function normalizeAdRow(row: GoogleAdsSearchRow): NormalizedAdMetric | null {
  const raw = row as RawAdRow;
  const adId = raw.adGroupAd?.ad?.id;
  if (!raw.campaign?.id || !raw.adGroup?.id || !adId || !raw.segments?.date) return null;

  return {
    externalCampaignId: raw.campaign.id,
    campaignName: raw.campaign.name ?? `Campanha ${raw.campaign.id}`,
    externalAdGroupId: raw.adGroup.id,
    adGroupName: raw.adGroup.name ?? `Grupo ${raw.adGroup.id}`,
    externalAdId: adId,
    // Anúncios responsivos (RSA) não têm um único "nome" na API do Google —
    // nesse caso usamos um rótulo previsível em vez de deixar vazio.
    adName: raw.adGroupAd?.ad?.name ?? `Anúncio ${adId}`,
    date: new Date(raw.segments.date),
    impressions: Number(raw.metrics?.impressions ?? 0),
    clicks: Number(raw.metrics?.clicks ?? 0),
    spend: microsToCurrency(raw.metrics?.costMicros),
    conversions: Number(raw.metrics?.conversions ?? 0),
    conversionValue: Number(raw.metrics?.conversionsValue ?? 0),
  };
}
