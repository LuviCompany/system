import type { AdPlatform } from "@prisma/client";

import type { AccessibleAccount, AdsProvider, FetchReportParams, NormalizedAdMetric, NormalizedCampaignMetric, OAuthTokenSet } from "@/server/integrations/ads-provider";

import { listAccessibleCustomers } from "./client";
import { buildGoogleAdsAuthUrl, exchangeCodeForTokens, refreshAccessToken, revokeToken } from "./oauth";
import { normalizeAdRow, normalizeCampaignRow } from "./normalization";
import { fetchCustomerInfo, fetchRawAdReport, fetchRawCampaignReport } from "./reporting";

function stripCustomerResourceName(resourceName: string): string {
  return resourceName.replace("customers/", "");
}

/** Implementação de AdsProvider para Google Ads — a única classe deste arquivo que conhece o formato da API do Google. */
export class GoogleAdsProvider implements AdsProvider {
  readonly platform: AdPlatform = "GOOGLE_ADS";

  buildAuthUrl(state: string): string {
    return buildGoogleAdsAuthUrl(state);
  }

  async exchangeCodeForTokens(code: string): Promise<OAuthTokenSet> {
    return exchangeCodeForTokens(code);
  }

  async refreshAccessToken(refreshTokenValue: string): Promise<OAuthTokenSet> {
    return refreshAccessToken(refreshTokenValue);
  }

  async revokeToken(token: string): Promise<void> {
    return revokeToken(token);
  }

  async listAccessibleAccounts(accessToken: string): Promise<AccessibleAccount[]> {
    const resourceNames = await listAccessibleCustomers(accessToken);
    const customerIds = resourceNames.map(stripCustomerResourceName);

    const accounts = await Promise.all(
      customerIds.map(async (customerId) => {
        try {
          const info = await fetchCustomerInfo(customerId, accessToken);
          return { externalAccountId: customerId, name: info.name, currencyCode: info.currencyCode };
        } catch {
          // Uma conta específica pode falhar (ex: sem permissão de leitura de
          // metadados) sem que isso derrube a listagem inteira.
          return { externalAccountId: customerId, name: null, currencyCode: null };
        }
      }),
    );

    return accounts;
  }

  async fetchCampaignMetrics(params: FetchReportParams): Promise<NormalizedCampaignMetric[]> {
    const loginCustomerId = (params.metadata?.loginCustomerId as string | undefined) ?? null;
    const rows = await fetchRawCampaignReport({
      customerId: params.externalAccountId,
      accessToken: params.accessToken,
      loginCustomerId,
      period: params.period,
    });

    return rows.map(normalizeCampaignRow).filter((row): row is NormalizedCampaignMetric => row !== null);
  }

  async fetchAdMetrics(params: FetchReportParams): Promise<NormalizedAdMetric[]> {
    const loginCustomerId = (params.metadata?.loginCustomerId as string | undefined) ?? null;
    const rows = await fetchRawAdReport({
      customerId: params.externalAccountId,
      accessToken: params.accessToken,
      loginCustomerId,
      period: params.period,
    });

    return rows.map(normalizeAdRow).filter((row): row is NormalizedAdMetric => row !== null);
  }
}

export const googleAdsProvider = new GoogleAdsProvider();
