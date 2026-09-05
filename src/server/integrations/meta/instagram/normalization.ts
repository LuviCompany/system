import type { NormalizedSocialPost } from "@/server/integrations/social-media-provider";

import type { RawInstagramMediaItem } from "./posts";

/**
 * Converte um item bruto de `/media` + suas insights para o modelo interno
 * `NormalizedSocialPost` (mesmo formato usado por qualquer futuro provedor
 * de social media — ver server/integrations/social-media-provider.ts).
 * Não implementado de fato nesta etapa — scaffold do mapeamento esperado.
 */
interface RawMedia {
  id?: string;
  media_type?: string;
  caption?: string;
  timestamp?: string;
}

interface RawInsightsByMetric {
  reach?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saved?: number;
}

export function normalizeInstagramPost(media: RawInstagramMediaItem, insights: RawInsightsByMetric): NormalizedSocialPost | null {
  const raw = media as RawMedia;
  if (!raw.id || !raw.timestamp) return null;

  return {
    externalPostId: raw.id,
    type: raw.media_type ?? "IMAGE",
    caption: raw.caption ?? null,
    publishedAt: new Date(raw.timestamp),
    reach: insights.reach ?? 0,
    likes: insights.likes ?? 0,
    comments: insights.comments ?? 0,
    shares: insights.shares ?? 0,
    saves: insights.saved ?? 0,
  };
}
