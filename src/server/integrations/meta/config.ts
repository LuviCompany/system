/**
 * Única porta de entrada para as credenciais da Meta (Facebook Login —
 * compartilhado entre Meta Ads e Instagram, já que ambos usam o mesmo OAuth
 * da plataforma Meta, só com escopos diferentes).
 *
 * Etapa 7: Meta Ads passa a ser uma integração real (somente `ads_read`).
 * Instagram continua como arquitetura preparada, mas NÃO solicita nenhuma
 * permissão — ver META_INSTAGRAM_OAUTH_SCOPES (definido, não usado ainda) e
 * o bloqueio explícito em api/integrations/meta/connect/route.ts.
 */

/** Único escopo pedido nesta etapa — somente leitura de anúncios, sem `ads_management`. */
export const META_ADS_OAUTH_SCOPES = ["ads_read"];

/** Preparado para quando Instagram for implementado — não é solicitado em nenhum fluxo real nesta etapa. */
export const META_INSTAGRAM_OAUTH_SCOPES = ["instagram_basic", "instagram_manage_insights", "pages_read_engagement"];

export interface MetaCredentials {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

export function getMetaCredentials(): MetaCredentials | undefined {
  const appId = readEnv("META_APP_ID");
  const appSecret = readEnv("META_APP_SECRET");
  const redirectUri = readEnv("META_REDIRECT_URI");

  if (!appId || !appSecret || !redirectUri) {
    return undefined;
  }
  return { appId, appSecret, redirectUri };
}

export function isMetaConfigured(): boolean {
  return Boolean(getMetaCredentials());
}

/** Lista, em português, exatamente quais variáveis faltam — mesma UX já usada pelo Google Ads. */
export function listMissingMetaEnvVars(): string[] {
  const required = ["META_APP_ID", "META_APP_SECRET", "META_REDIRECT_URI"];
  return required.filter((name) => !readEnv(name));
}
