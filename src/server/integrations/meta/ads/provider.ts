import type { AdPlatform } from "@prisma/client";

import type { AccessibleAccount, AdsProvider, FetchReportParams, NormalizedAdMetric, NormalizedCampaignMetric, OAuthTokenSet } from "@/server/integrations/ads-provider";

import { META_ADS_OAUTH_SCOPES } from "../config";
import { buildMetaAuthUrl, exchangeCodeForTokens, refreshAccessToken, revokeToken } from "../oauth";
import { fetchCampaignStatuses, listAdAccounts } from "./client";
import { normalizeAdRow, normalizeCampaignRow } from "./normalization";
import { fetchRawAdInsights, fetchRawCampaignInsights } from "./reporting";

function stripAdAccountPrefix(id: string): string {
  return id.startsWith("act_") ? id.slice(4) : id;
}

/** Implementação de AdsProvider para Meta Ads (etapa 7 — somente leitura, somente ads_read). */
export class MetaAdsProvider implements AdsProvider {
  readonly platform: AdPlatform = "META_ADS";

  buildAuthUrl(state: string): string {
    return buildMetaAuthUrl(state, META_ADS_OAUTH_SCOPES);
  }

  async exchangeCodeForTokens(code: string): Promise<OAuthTokenSet> {
    return exchangeCodeForTokens(code);
  }

  async refreshAccessToken(currentAccessToken: string): Promise<OAuthTokenSet> {
    return refreshAccessToken(currentAccessToken);
  }

  async revokeToken(token: string): Promise<void> {
    return revokeToken(token);
  }

  async listAccessibleAccounts(accessToken: string): Promise<AccessibleAccount[]> {
    const accounts = await listAdAccounts(accessToken);
    return accounts.map((account) => ({
      externalAccountId: stripAdAccountPrefix(account.id),
      name: account.name ?? null,
      currencyCode: account.currency ?? null,
    }));
  }

  async fetchCampaignMetrics(params: FetchReportParams): Promise<NormalizedCampaignMetric[]> {
    const [rows, statusByCampaignId] = await Promise.all([
      fetchRawCampaignInsights({ externalAccountId: params.externalAccountId, accessToken: params.accessToken, period: params.period }),
      fetchCampaignStatuses(params.externalAccountId, params.accessToken),
    ]);
    return rows.map((row) => normalizeCampaignRow(row, statusByCampaignId)).filter((row): row is NormalizedCampaignMetric => row !== null);
  }

  async fetchAdMetrics(params: FetchReportParams): Promise<NormalizedAdMetric[]> {
    const rows = await fetchRawAdInsights({ externalAccountId: params.externalAccountId, accessToken: params.accessToken, period: params.period });
    return rows.map(normalizeAdRow).filter((row): row is NormalizedAdMetric => row !== null);
  }
}

export const metaAdsProvider = new MetaAdsProvider();
