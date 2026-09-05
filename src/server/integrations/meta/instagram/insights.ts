import { callMetaMarketingApi } from "../ads/client";

/**
 * Preparado para buscar métricas de uma mídia via
 * `/{media-id}/insights?metric=reach,likes,comments,shares,saved`
 * (Instagram Graph API). Não implementado nesta etapa.
 */
export interface RawInstagramInsightsRow {
  [key: string]: unknown;
}

export async function fetchInstagramMediaInsights(mediaId: string, accessToken: string): Promise<RawInstagramInsightsRow[]> {
  return callMetaMarketingApi(`/${mediaId}/insights`, { accessToken });
}
