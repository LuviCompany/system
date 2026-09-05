import { getMetaCredentials, META_OAUTH_SCOPES } from "./config";
import { MetaError } from "./errors";

/**
 * Fluxo OAuth da Meta (Facebook Login) — estrutura pronta, mas etapa 6 não
 * implementa a chamada real (item 20: "Não implementar OAuth real da
 * Meta"). Toda função aqui verifica a configuração e lança `NOT_CONFIGURED`
 * antes de qualquer tentativa de rede — não existe nenhum `fetch` real neste
 * arquivo, de propósito.
 */

const AUTH_ENDPOINT = "https://www.facebook.com/v21.0/dialog/oauth";

function requireCredentials() {
  const credentials = getMetaCredentials();
  if (!credentials) {
    throw new MetaError("NOT_CONFIGURED", "Integração com a Meta não configurada nesta instalação.");
  }
  return credentials;
}

/** Monta a URL de autorização da Meta — só é chamada de fato quando `isMetaConfigured()` for true (nunca nesta etapa). */
export function buildMetaAuthUrl(state: string): string {
  const credentials = requireCredentials();

  const params = new URLSearchParams({
    client_id: credentials.appId,
    redirect_uri: credentials.redirectUri,
    response_type: "code",
    scope: META_OAUTH_SCOPES.join(","),
    state,
  });

  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

/** Preparado para trocar o `code` do callback por um access token de curta duração + trocar por um de longa duração. Não implementado nesta etapa. */
export async function exchangeCodeForTokens(code: string): Promise<never> {
  requireCredentials();
  void code;
  throw new MetaError("NOT_CONFIGURED", "Troca de código OAuth da Meta ainda não implementada (etapa 6 é só arquitetura).");
}

/** Preparado para revogar o acesso concedido (DELETE .../permissions na Graph API). Não implementado nesta etapa. */
export async function revokeToken(token: string): Promise<void> {
  requireCredentials();
  void token;
  throw new MetaError("NOT_CONFIGURED", "Revogação de token da Meta ainda não implementada (etapa 6 é só arquitetura).");
}
