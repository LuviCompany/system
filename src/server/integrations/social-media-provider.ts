import type { SocialPlatform } from "@prisma/client";

import type { PeriodRange } from "@/modules/clientes/types";

/**
 * Contrato genérico para um provedor de social media (Instagram hoje, outras
 * redes no futuro) — etapa 6. Mesma ideia de `AdsProvider`
 * (server/integrations/ads-provider.ts): cada provedor implementa isto no
 * seu próprio módulo, sem nenhum código aqui conhecer detalhes de uma rede
 * específica.
 *
 * Todos os métodos são SOMENTE LEITURA — não existe (e não deve ser
 * adicionado) nenhum método de publicação/edição/exclusão de conteúdo.
 */

export interface SocialAccessibleAccount {
  /** Id da conta na plataforma externa (ex: Instagram Business Account id). */
  externalAccountId: string;
  name: string | null;
  username: string | null;
}

export interface NormalizedSocialPost {
  externalPostId: string;
  type: string;
  caption: string | null;
  publishedAt: Date;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

/**
 * Interação individual num post. OPCIONAL por natureza — muitas plataformas/
 * permissões não devolvem identificação de usuário. Um provedor que não
 * consiga fornecer isso simplesmente nunca chama `fetchTopEngagedUsers`
 * (ou devolve array vazio) — nunca inventar usuários (etapa 12).
 */
export interface NormalizedEngagement {
  userIdentifier: string;
  interactionCount: number;
  source: string;
}

export interface FetchPostsParams {
  externalAccountId: string;
  accessToken: string;
  period: PeriodRange;
}

export interface SocialMediaProvider {
  readonly platform: SocialPlatform;

  buildAuthUrl(state: string): string;
  exchangeCodeForTokens(code: string): Promise<{ accessToken: string; refreshToken: string | null; expiresAt: Date | null }>;
  revokeToken(token: string): Promise<void>;

  listAccessibleAccounts(accessToken: string): Promise<SocialAccessibleAccount[]>;

  fetchPosts(params: FetchPostsParams): Promise<NormalizedSocialPost[]>;

  /** Devolve [] quando a plataforma/permissão não fornece dado individual — nunca inventa usuários. */
  fetchTopEngagedUsers(params: FetchPostsParams): Promise<NormalizedEngagement[]>;
}
