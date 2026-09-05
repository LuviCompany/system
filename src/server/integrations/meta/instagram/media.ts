import { callMetaMarketingApi } from "../ads/client";
import type { RawInstagramMediaItem } from "./posts";

/**
 * Preparado para buscar detalhes de uma mídia específica (tipo, thumbnail,
 * legenda completa) via `/{media-id}`. Não implementado nesta etapa.
 */
export async function fetchInstagramMediaDetails(mediaId: string, accessToken: string): Promise<RawInstagramMediaItem> {
  return callMetaMarketingApi(`/${mediaId}`, { accessToken });
}
