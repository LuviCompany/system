import type { PeriodRange } from "@/modules/clientes/types";

import { searchGoogleAds, type GoogleAdsSearchRow } from "./client";

function toGoogleDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Consultas GAQL somente leitura (etapa 21 — nenhum endpoint `mutate` é
 * usado em lugar nenhum deste módulo). Só os campos realmente exibidos na UI
 * são pedidos (etapa 14 — "não buscar campos desnecessários").
 */

const CAMPAIGN_REPORT_QUERY = (period: PeriodRange) => `
  SELECT
    campaign.id,
    campaign.name,
    campaign.status,
    segments.date,
    metrics.impressions,
    metrics.clicks,
    metrics.cost_micros,
    metrics.conversions,
    metrics.conversions_value
  FROM campaign
  WHERE segments.date BETWEEN '${toGoogleDate(period.start)}' AND '${toGoogleDate(period.end)}'
    AND campaign.status != 'REMOVED'
`;

const AD_REPORT_QUERY = (period: PeriodRange) => `
  SELECT
    campaign.id,
    campaign.name,
    ad_group.id,
    ad_group.name,
    ad_group_ad.ad.id,
    ad_group_ad.ad.name,
    segments.date,
    metrics.impressions,
    metrics.clicks,
    metrics.cost_micros,
    metrics.conversions,
    metrics.conversions_value
  FROM ad_group_ad
  WHERE segments.date BETWEEN '${toGoogleDate(period.start)}' AND '${toGoogleDate(period.end)}'
    AND ad_group_ad.status != 'REMOVED'
`;

interface FetchOptions {
  customerId: string;
  accessToken: string;
  loginCustomerId?: string | null;
  period: PeriodRange;
}

export async function fetchRawCampaignReport(options: FetchOptions): Promise<GoogleAdsSearchRow[]> {
  return searchGoogleAds(options.customerId, CAMPAIGN_REPORT_QUERY(options.period), {
    accessToken: options.accessToken,
    loginCustomerId: options.loginCustomerId,
  });
}

export async function fetchRawAdReport(options: FetchOptions): Promise<GoogleAdsSearchRow[]> {
  return searchGoogleAds(options.customerId, AD_REPORT_QUERY(options.period), {
    accessToken: options.accessToken,
    loginCustomerId: options.loginCustomerId,
  });
}

interface CustomerInfoRow {
  customer?: { descriptiveName?: string; currencyCode?: string };
}

/** Busca nome + moeda da conta — usado na tela de seleção de conta (etapa 7) e para normalizar valores monetários (etapa 11). */
export async function fetchCustomerInfo(
  customerId: string,
  accessToken: string,
  loginCustomerId?: string | null,
): Promise<{ name: string | null; currencyCode: string | null }> {
  const rows = (await searchGoogleAds(customerId, "SELECT customer.descriptive_name, customer.currency_code FROM customer LIMIT 1", {
    accessToken,
    loginCustomerId,
  })) as CustomerInfoRow[];

  const row = rows[0];
  return {
    name: row?.customer?.descriptiveName ?? null,
    currencyCode: row?.customer?.currencyCode ?? null,
  };
}
