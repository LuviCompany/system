import type { SocialPlatform } from "@prisma/client";

import type {
  FetchPostsParams,
  NormalizedEngagement,
  NormalizedSocialPost,
  SocialAccessibleAccount,
  SocialMediaProvider,
} from "@/server/integrations/social-media-provider";

import { MetaError } from "../errors";
import { buildMetaAuthUrl, exchangeCodeForTokens, revokeToken } from "../oauth";
import { fetchTopEngagedUsers as fetchTopEngagedUsersStub } from "./engagement";

/**
 * Implementação de SocialMediaProvider para Instagram — mesma ideia de
 * MetaAdsProvider (server/integrations/meta/ads/provider.ts): a interface
 * já está completa, mas nenhuma chamada real acontece nesta etapa (item 20).
 */
export class InstagramProvider implements SocialMediaProvider {
  readonly platform: SocialPlatform = "INSTAGRAM";

  buildAuthUrl(state: string): string {
    return buildMetaAuthUrl(state);
  }

  async exchangeCodeForTokens(code: string): Promise<{ accessToken: string; refreshToken: string | null; expiresAt: Date | null }> {
    await exchangeCodeForTokens(code);
    throw new MetaError("NOT_CONFIGURED", "Instagram ainda não implementado.");
  }

  async revokeToken(token: string): Promise<void> {
    return revokeToken(token);
  }

  async listAccessibleAccounts(): Promise<SocialAccessibleAccount[]> {
    throw new MetaError("NOT_CONFIGURED", "Listagem de contas do Instagram ainda não implementada.");
  }

  async fetchPosts(params: FetchPostsParams): Promise<NormalizedSocialPost[]> {
    void params;
    throw new MetaError("NOT_CONFIGURED", "Busca de posts do Instagram ainda não implementada.");
  }

  async fetchTopEngagedUsers(params: FetchPostsParams): Promise<NormalizedEngagement[]> {
    void params;
    return fetchTopEngagedUsersStub();
  }
}

export const instagramProvider = new InstagramProvider();
