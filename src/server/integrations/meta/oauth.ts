import type { OAuthTokenSet } from "@/server/integrations/ads-provider";

import { getMetaCredentials } from "./config";
import { mapMetaGraphError, MetaError, toMetaError } from "./errors";

/**
 * Fluxo OAuth da Meta (Facebook Login) — etapa 7, implementação real
 * somente para Meta Ads (escopo `ads_read`, ver config.ts). Diferente do
 * Google, a Meta não tem um refresh token separado: um token de curta
 * duração (code -> ~1-2h) é trocado por um de longa duração (~60 dias) via
 * `fb_exchange_token`, e "renovar" significa repetir essa mesma troca
 * usando o token atual antes que ele expire (ver refreshAccessToken).
 */

const GRAPH_API_VERSION = "v21.0";
const OAUTH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const AUTH_ENDPOINT = "https://www.facebook.com/v21.0/dialog/oauth";
const REQUEST_TIMEOUT_MS = 15_000;

function requireCredentials() {
  const credentials = getMetaCredentials();
  if (!credentials) {
    throw new MetaError("NOT_CONFIGURED", "Integração com a Meta Ads não configurada.");
  }
  return credentials;
}

/** Monta a URL de autorização da Meta — `scopes` é passado explicitamente pelo chamador (nunca usa um escopo "padrão" implícito). */
export function buildMetaAuthUrl(state: string, scopes: string[]): string {
  const credentials = requireCredentials();

  const params = new URLSearchParams({
    client_id: credentials.appId,
    redirect_uri: credentials.redirectUri,
    response_type: "code",
    scope: scopes.join(","),
    state,
  });

  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

interface MetaTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

async function getGraphJson<T>(url: URL): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { method: "GET", signal: controller.signal });
    const json = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw mapMetaGraphError(response.status, json);
    }
    return json as T;
  } catch (error) {
    throw toMetaError(error);
  } finally {
    clearTimeout(timeout);
  }
}

/** Troca um token de curta duração (ou o token atual, ao renovar) por um de longa duração (~60 dias). */
async function exchangeForLongLivedToken(shortLivedToken: string): Promise<OAuthTokenSet> {
  const credentials = requireCredentials();

  const url = new URL(`${OAUTH_BASE_URL}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", credentials.appId);
  url.searchParams.set("client_secret", credentials.appSecret);
  url.searchParams.set("fb_exchange_token", shortLivedToken);

  const json = await getGraphJson<MetaTokenResponse>(url);
  const expiresInSeconds = json.expires_in;

  return {
    accessToken: json.access_token,
    // A Meta não devolve um refresh token separado — "renovar" é trocar o
    // token atual de novo por outro de longa duração (refreshAccessToken).
    refreshToken: null,
    expiresAt: expiresInSeconds ? new Date(Date.now() + expiresInSeconds * 1000) : null,
  };
}

/** Troca o `code` do callback OAuth pelo token de curta duração e já devolve o de longa duração. */
export async function exchangeCodeForTokens(code: string): Promise<OAuthTokenSet> {
  const credentials = requireCredentials();

  const url = new URL(`${OAUTH_BASE_URL}/oauth/access_token`);
  url.searchParams.set("client_id", credentials.appId);
  url.searchParams.set("client_secret", credentials.appSecret);
  url.searchParams.set("redirect_uri", credentials.redirectUri);
  url.searchParams.set("code", code);

  const json = await getGraphJson<MetaTokenResponse>(url);
  return exchangeForLongLivedToken(json.access_token);
}

/** "Renova" o access token trocando o atual por um novo de longa duração antes que expire. */
export async function refreshAccessToken(currentAccessToken: string): Promise<OAuthTokenSet> {
  requireCredentials();
  return exchangeForLongLivedToken(currentAccessToken);
}

/** Revoga o acesso concedido pelo usuário ao app. */
export async function revokeToken(token: string): Promise<void> {
  requireCredentials();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = new URL(`${OAUTH_BASE_URL}/me/permissions`);
    url.searchParams.set("access_token", token);

    const response = await fetch(url, { method: "DELETE", signal: controller.signal });
    const json = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw mapMetaGraphError(response.status, json);
    }
  } catch (error) {
    throw toMetaError(error);
  } finally {
    clearTimeout(timeout);
  }
}
