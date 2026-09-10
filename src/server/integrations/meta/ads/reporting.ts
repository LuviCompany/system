import type { PeriodRange } from "@/modules/clientes/types";

import { fetchInsights, type MetaInsightsRow } from "./client";

/**
 * Consultas de Insights (somente leitura) contra a Meta Marketing API — só
 * os campos realmente usados pela UI são pedidos (mesmo princípio do
 * Google Ads: não buscar campos desnecessários). Diferente do Google,
 * `spend` já vem na unidade normal da moeda da conta (nunca em micros).
 */

const CAMPAIGN_FIELDS = ["campaign_id", "campaign_name", "impressions", "clicks", "spend"];
const AD_FIELDS = ["ad_id", "ad_name", "adset_id", "adset_name", "campaign_id", "campaign_name", "impressions", "clicks", "spend"];

function toMetaDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface FetchOptions {
  externalAccountId: string;
  accessToken: string;
  period: PeriodRange;
}

export async function fetchRawCampaignInsights(options: FetchOptions): Promise<MetaInsightsRow[]> {
  return fetchInsights(options.externalAccountId, options.accessToken, {
    level: "campaign",
    fields: CAMPAIGN_FIELDS,
    since: toMetaDate(options.period.start),
    until: toMetaDate(options.period.end),
  });
}

export async function fetchRawAdInsights(options: FetchOptions): Promise<MetaInsightsRow[]> {
  return fetchInsights(options.externalAccountId, options.accessToken, {
    level: "ad",
    fields: AD_FIELDS,
    since: toMetaDate(options.period.start),
    until: toMetaDate(options.period.end),
  });
}
