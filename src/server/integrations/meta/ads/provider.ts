import type { AdPlatform } from "@prisma/client";

import type { AccessibleAccount, AdsProvider, FetchReportParams, NormalizedAdMetric, NormalizedCampaignMetric, OAuthTokenSet } from "@/server/integrations/ads-provider";

import { MetaError } from "../errors";
import { buildMetaAuthUrl, exchangeCodeForTokens, revokeToken } from "../oauth";
import { normalizeAdRow, normalizeCampaignRow } from "./normalization";
import { fetchRawAdInsights, fetchRawCampaignInsights } from "./reporting";

/**
 * Implementação de AdsProvider para Meta Ads — espelha exatamente a forma
 * de server/integrations/google-ads/provider.ts (mesma interface,
 * implementação isolada). Etapa 6: toda chamada real cai em `oauth.ts`/
 * `client.ts`, que lançam `NOT_CONFIGURED` de propósito (item 20 — nenhum
 * OAuth ou chamada real à API da Meta nesta etapa).
 */
export class MetaAdsProvider implements AdsProvider {
  readonly platform: AdPlatform = "META_ADS";

  buildAuthUrl(state: string): string {
    return buildMetaAuthUrl(state);
  }

  async exchangeCodeForTokens(code: string): Promise<OAuthTokenSet> {
    await exchangeCodeForTokens(code);
    throw new MetaError("NOT_CONFIGURED", "Meta Ads ainda não implementado.");
  }

  async refreshAccessToken(): Promise<OAuthTokenSet> {
    throw new MetaError("NOT_CONFIGURED", "Renovação de token do Meta Ads ainda não implementada.");
  }

  async revokeToken(token: string): Promise<void> {
    return revokeToken(token);
  }

  async listAccessibleAccounts(): Promise<AccessibleAccount[]> {
    throw new MetaError("NOT_CONFIGURED", "Listagem de contas do Meta Ads ainda não implementada.");
  }

  async fetchCampaignMetrics(params: FetchReportParams): Promise<NormalizedCampaignMetric[]> {
    const rows = await fetchRawCampaignInsights({ externalAccountId: params.externalAccountId, accessToken: params.accessToken, period: params.period });
    return rows.map(normalizeCampaignRow).filter((row): row is NormalizedCampaignMetric => row !== null);
  }

  async fetchAdMetrics(params: FetchReportParams): Promise<NormalizedAdMetric[]> {
    const rows = await fetchRawAdInsights({ externalAccountId: params.externalAccountId, accessToken: params.accessToken, period: params.period });
    return rows.map(normalizeAdRow).filter((row): row is NormalizedAdMetric => row !== null);
  }
}

export const metaAdsProvider = new MetaAdsProvider();
