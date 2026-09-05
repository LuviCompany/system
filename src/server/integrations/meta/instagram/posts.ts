import { callMetaMarketingApi } from "../ads/client";

/**
 * Preparado para buscar posts via `/{ig-user-id}/media` (Instagram Graph
 * API) — campos esperados: id, caption, media_type, timestamp,
 * permalink. Não implementado nesta etapa (item 20).
 */
export interface RawInstagramMediaItem {
  [key: string]: unknown;
}

export async function fetchInstagramMedia(igUserId: string, accessToken: string): Promise<RawInstagramMediaItem[]> {
  return callMetaMarketingApi(`/${igUserId}/media`, { accessToken });
}
