import type { OAuthTokenSet } from "@/server/integrations/ads-provider";

import { getGoogleAdsCredentials, GOOGLE_ADS_OAUTH_SCOPE } from "./config";
import { GoogleAdsError, mapGoogleOAuthError, toGoogleAdsError } from "./errors";

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const REVOKE_ENDPOINT = "https://oauth2.googleapis.com/revoke";

const REQUEST_TIMEOUT_MS = 15_000;

function requireCredentials() {
  const credentials = getGoogleAdsCredentials();
  if (!credentials) {
    throw new GoogleAdsError("NOT_CONFIGURED", "Integração com Google Ads não configurada.");
  }
  return credentials;
}

/** Monta a URL de autorização do Google (etapa 2). `state` carrega clientId/organizationId assinados — ver server/integrations/google-ads/state.ts. */
export function buildGoogleAdsAuthUrl(state: string): string {
  const credentials = requireCredentials();

  const params = new URLSearchParams({
    client_id: credentials.clientId,
    redirect_uri: credentials.redirectUri,
    response_type: "code",
    scope: GOOGLE_ADS_OAUTH_SCOPE,
    access_type: "offline",
    // "consent" garante que o Google devolva um refresh_token mesmo que o
    // usuário já tenha autorizado esta aplicação antes.
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });

  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

async function postToTokenEndpoint(body: URLSearchParams): Promise<OAuthTokenSet> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: controller.signal,
    });

    const json = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw mapGoogleOAuthError(response.status, json);
    }

    const expiresInSeconds: number | undefined = json?.expires_in;
    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token ?? null,
      expiresAt: expiresInSeconds ? new Date(Date.now() + expiresInSeconds * 1000) : null,
      scope: json.scope,
    };
  } catch (error) {
    throw toGoogleAdsError(error);
  } finally {
    clearTimeout(timeout);
  }
}

/** Troca o `code` do callback OAuth pelo primeiro par access/refresh token. */
export async function exchangeCodeForTokens(code: string): Promise<OAuthTokenSet> {
  const credentials = requireCredentials();

  return postToTokenEndpoint(
    new URLSearchParams({
      code,
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      redirect_uri: credentials.redirectUri,
      grant_type: "authorization_code",
    }),
  );
}

/** Renova o access token a partir do refresh token guardado. */
export async function refreshAccessToken(refreshToken: string): Promise<OAuthTokenSet> {
  const credentials = requireCredentials();

  return postToTokenEndpoint(
    new URLSearchParams({
      refresh_token: refreshToken,
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      grant_type: "refresh_token",
    }),
  );
}

/** Revoga um token (access ou refresh) junto ao Google — usado ao desconectar (etapa 23). */
export async function revokeToken(token: string): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(REVOKE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }),
      signal: controller.signal,
    });

    // O Google devolve 200 mesmo se o token já estava inválido/expirado —
    // só tratamos como erro real uma falha de rede/servidor.
    if (!response.ok && response.status >= 500) {
      throw new GoogleAdsError("SERVER_ERROR", "Não foi possível revogar o acesso junto ao Google agora.");
    }
  } catch (error) {
    throw toGoogleAdsError(error);
  } finally {
    clearTimeout(timeout);
  }
}
