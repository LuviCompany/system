import type { AdPlatform } from "@prisma/client";

import type { PeriodRange } from "@/modules/clientes/types";

/**
 * Contrato genérico para um provedor de mídia paga (Google Ads, e no futuro
 * Meta Ads) — etapa 5. Cada provedor implementa esta interface isoladamente
 * em seu próprio módulo (ex: server/integrations/google-ads/provider.ts);
 * nada aqui conhece detalhes de nenhuma plataforma específica.
 *
 * Todos os métodos desta etapa são SOMENTE LEITURA — não existe (e não deve
 * ser adicionado aqui) nenhum método de escrita (criar campanha, pausar,
 * editar orçamento).
 */

export interface OAuthTokenSet {
  accessToken: string;
  /** Nulo quando a resposta de refresh não devolve um novo refresh token (comportamento normal do Google). */
  refreshToken: string | null;
  expiresAt: Date | null;
  scope?: string;
}

export interface AccessibleAccount {
  /** Id da conta na plataforma externa (ex: Google Ads Customer ID, só dígitos). */
  externalAccountId: string;
  name: string | null;
  currencyCode?: string | null;
}

/** Uma linha de métrica de campanha já normalizada — nunca o formato bruto da API. */
export interface NormalizedCampaignMetric {
  externalCampaignId: string;
  campaignName: string;
  campaignStatus: string;
  date: Date;
  impressions: number;
  clicks: number;
  /** Investimento na moeda da própria conta (já convertido de micros). */
  spend: number;
  conversions: number;
  conversionValue: number;
}

/** Uma linha de métrica de anúncio já normalizada. */
export interface NormalizedAdMetric {
  externalCampaignId: string;
  campaignName: string;
  externalAdGroupId: string;
  adGroupName: string;
  externalAdId: string;
  adName: string;
  date: Date;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  conversionValue: number;
}

export interface FetchReportParams {
  externalAccountId: string;
  accessToken: string;
  period: PeriodRange;
  /** Metadados específicos do provedor (ex: login-customer-id de um MCC do Google). */
  metadata?: Record<string, unknown> | null;
}

export interface AdsProvider {
  readonly platform: AdPlatform;

  /** Monta a URL de autorização OAuth (o `state` deve ser opaco e verificável no callback). */
  buildAuthUrl(state: string): string;

  /** Troca o `code` do callback OAuth pelo primeiro par de tokens. */
  exchangeCodeForTokens(code: string): Promise<OAuthTokenSet>;

  /** Usa o refresh token para obter um novo access token quando o atual expirou. */
  refreshAccessToken(refreshToken: string): Promise<OAuthTokenSet>;

  /** Revoga o token junto à plataforma (usado ao desconectar). */
  revokeToken(token: string): Promise<void>;

  /** Lista as contas que o usuário autorizado pode acessar, para a etapa de seleção de conta. */
  listAccessibleAccounts(accessToken: string): Promise<AccessibleAccount[]>;

  fetchCampaignMetrics(params: FetchReportParams): Promise<NormalizedCampaignMetric[]>;

  fetchAdMetrics(params: FetchReportParams): Promise<NormalizedAdMetric[]>;
}

export type { PeriodRange };
