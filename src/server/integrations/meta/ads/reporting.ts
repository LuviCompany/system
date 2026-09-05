import type { PeriodRange } from "@/modules/clientes/types";

import { callMetaMarketingApi } from "./client";

/**
 * Campos que a Meta Marketing API devolveria no edge `/insights`
 * (documentados aqui para quando a implementação real acontecer — nada
 * disto é buscado de verdade nesta etapa):
 *
 *   campaign_id, campaign_name, adset_id, adset_name, ad_id, ad_name,
 *   spend, impressions, reach, clicks, ctr, cpc, actions (resultados,
 *   ex: onsite_conversion.purchase), cost_per_action_type, action_values
 *   (valor de conversão), date_start/date_stop
 *
 * Ver docs/meta-ads.md quando a etapa de implementação real acontecer.
 */

export interface MetaInsightsRow {
  [key: string]: unknown;
}

interface FetchOptions {
  externalAccountId: string;
  accessToken: string;
  period: PeriodRange;
}

/** Preparado para buscar insights por campanha. Não implementado nesta etapa (item 20). */
export async function fetchRawCampaignInsights(options: FetchOptions): Promise<MetaInsightsRow[]> {
  return callMetaMarketingApi(`/act_${options.externalAccountId}/insights`, { accessToken: options.accessToken });
}

/** Preparado para buscar insights por anúncio (nível `ad`, com breakdown de adset). Não implementado nesta etapa. */
export async function fetchRawAdInsights(options: FetchOptions): Promise<MetaInsightsRow[]> {
  return callMetaMarketingApi(`/act_${options.externalAccountId}/insights`, { accessToken: options.accessToken });
}
