import type { NormalizedAdMetric, NormalizedCampaignMetric } from "@/server/integrations/ads-provider";

import type { MetaInsightsRow } from "./reporting";

/**
 * Converte uma linha bruta de `/insights` da Meta Marketing API para o
 * mesmo modelo interno usado pelo Google Ads (`NormalizedCampaignMetric`/
 * `NormalizedAdMetric` — ver server/integrations/ads-provider.ts). Isso é o
 * que permite o dashboard e o relatório tratarem Google Ads e Meta Ads de
 * forma idêntica sem saber qual plataforma originou o dado.
 *
 * Diferente do Google (que devolve tudo em "micros"), a Meta já devolve
 * `spend`/`action_values` na moeda real da conta — não há conversão a
 * fazer aqui, só parsing de string para número.
 *
 * Não implementado de fato nesta etapa (não há linha real para normalizar
 * ainda — `meta/ads/reporting.ts` nunca é alcançado). Mantido como
 * scaffold para deixar claro o mapeamento de campos esperado.
 */

interface RawCampaignInsightsRow {
  campaign_id?: string;
  campaign_name?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  actions?: { action_type: string; value: string }[];
  action_values?: { action_type: string; value: string }[];
  date_start?: string;
}

export function normalizeCampaignRow(row: MetaInsightsRow): NormalizedCampaignMetric | null {
  const raw = row as RawCampaignInsightsRow;
  if (!raw.campaign_id || !raw.date_start) return null;

  const conversions = sumActionValues(raw.actions);
  const conversionValue = sumActionValues(raw.action_values);

  return {
    externalCampaignId: raw.campaign_id,
    campaignName: raw.campaign_name ?? `Campanha ${raw.campaign_id}`,
    campaignStatus: "ACTIVE",
    date: new Date(raw.date_start),
    impressions: Number(raw.impressions ?? 0),
    clicks: Number(raw.clicks ?? 0),
    spend: Number(raw.spend ?? 0),
    conversions,
    conversionValue,
  };
}

interface RawAdInsightsRow {
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  actions?: { action_type: string; value: string }[];
  action_values?: { action_type: string; value: string }[];
  date_start?: string;
}

export function normalizeAdRow(row: MetaInsightsRow): NormalizedAdMetric | null {
  const raw = row as RawAdInsightsRow;
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
    conversions: sumActionValues(raw.actions),
    conversionValue: sumActionValues(raw.action_values),
  };
}

function sumActionValues(actions: { action_type: string; value: string }[] | undefined): number {
  if (!actions) return 0;
  return actions.reduce((sum, action) => sum + Number(action.value || 0), 0);
}
