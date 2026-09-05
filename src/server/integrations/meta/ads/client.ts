import { isMetaConfigured } from "../config";
import { MetaError } from "../errors";

const GRAPH_API_VERSION = "v21.0";
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Client HTTP de baixo nível para a Meta Marketing API — scaffold pronto
 * (URL base, versão da API), mas sem nenhuma chamada real ainda (item 20).
 * `getBaseUrl()` existe só para o próximo passo (implementação real) usar
 * sem precisar redescobrir a URL/versão certa.
 */
export function getMetaGraphBaseUrl(): string {
  return BASE_URL;
}

export interface MetaGraphRequestOptions {
  accessToken: string;
}

/** Preparado para chamar `/act_{accountId}/insights` com breakdown por campanha/anúncio. Não implementado nesta etapa. */
export async function callMetaMarketingApi<T>(path: string, options: MetaGraphRequestOptions): Promise<T> {
  if (!isMetaConfigured()) {
    throw new MetaError("NOT_CONFIGURED", "Integração com Meta Ads não configurada.");
  }
  void options.accessToken;
  throw new MetaError("NOT_CONFIGURED", `Chamada real à Meta Marketing API (${path}) ainda não implementada (etapa 6 é só arquitetura).`);
}
