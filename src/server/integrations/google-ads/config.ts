/**
 * Única porta de entrada para as credenciais do Google Ads — nunca lidas fora
 * deste arquivo. Todas vêm de variáveis de ambiente (nunca em código, nunca
 * no client bundle) e nunca são logadas nem devolvidas ao cliente.
 */

export const GOOGLE_ADS_API_VERSION = "v19";
export const GOOGLE_ADS_OAUTH_SCOPE = "https://www.googleapis.com/auth/adwords";

export interface GoogleAdsCredentials {
  clientId: string;
  clientSecret: string;
  developerToken: string;
  redirectUri: string;
}

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

/** Devolve as 4 credenciais só quando TODAS estiverem presentes — nunca parcialmente configurado. */
export function getGoogleAdsCredentials(): GoogleAdsCredentials | undefined {
  const clientId = readEnv("GOOGLE_CLIENT_ID");
  const clientSecret = readEnv("GOOGLE_CLIENT_SECRET");
  const developerToken = readEnv("GOOGLE_ADS_DEVELOPER_TOKEN");
  const redirectUri = readEnv("GOOGLE_REDIRECT_URI");

  if (!clientId || !clientSecret || !developerToken || !redirectUri) {
    return undefined;
  }
  return { clientId, clientSecret, developerToken, redirectUri };
}

export function isGoogleAdsConfigured(): boolean {
  return Boolean(getGoogleAdsCredentials());
}

/** Lista, em português, exatamente quais variáveis faltam — usada na UI e nos logs de diagnóstico. */
export function listMissingGoogleAdsEnvVars(): string[] {
  const required = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_REDIRECT_URI"];
  return required.filter((name) => !readEnv(name));
}
