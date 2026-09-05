import { prisma } from "@/server/db/prisma";
import { decryptToken, encryptToken } from "@/server/security/token-crypto";
import type { AccessibleAccount, OAuthTokenSet } from "@/server/integrations/ads-provider";

import { GoogleAdsError } from "./errors";
import { googleAdsProvider } from "./provider";

const PLATFORM = "GOOGLE_ADS" as const;

/** Só existe uma conexão Google Ads por Client — sempre escopada por organizationId (multi-tenant, etapa 6). */
export async function getGoogleAdsConnection(organizationId: string, clientId: string) {
  return prisma.clientPlatform.findFirst({
    where: { organizationId, clientId, platform: PLATFORM },
  });
}

/** Etapa 2 — grava o primeiro par de tokens após o callback OAuth. A conexão só fica CONECTADO depois da seleção de conta (etapa 7). */
export async function saveInitialTokens(organizationId: string, clientId: string, tokens: OAuthTokenSet): Promise<void> {
  await prisma.clientPlatform.upsert({
    where: { clientId_platform: { clientId, platform: PLATFORM } },
    update: {
      accessTokenEncrypted: encryptToken(tokens.accessToken),
      refreshTokenEncrypted: tokens.refreshToken ? encryptToken(tokens.refreshToken) : undefined,
      tokenExpiresAt: tokens.expiresAt,
      status: "NAO_CONECTADO",
      externalAccountId: null,
      lastSyncError: null,
    },
    create: {
      organizationId,
      clientId,
      platform: PLATFORM,
      status: "NAO_CONECTADO",
      accessTokenEncrypted: encryptToken(tokens.accessToken),
      refreshTokenEncrypted: tokens.refreshToken ? encryptToken(tokens.refreshToken) : null,
      tokenExpiresAt: tokens.expiresAt,
    },
  });
}

/** Etapa 7 — lista as contas Google Ads acessíveis pela conexão ainda não finalizada. */
export async function listAccessibleAccountsForClient(organizationId: string, clientId: string): Promise<AccessibleAccount[]> {
  const connection = await getGoogleAdsConnection(organizationId, clientId);
  if (!connection?.accessTokenEncrypted) {
    throw new GoogleAdsError("UNAUTHORIZED", "Nenhuma autorização do Google Ads pendente para este cliente.");
  }

  const accessToken = decryptToken(connection.accessTokenEncrypted);
  return googleAdsProvider.listAccessibleAccounts(accessToken);
}

/** Etapa 7 — finaliza a conexão depois que o usuário escolhe a conta (customer). */
export async function finalizeAccountSelection(organizationId: string, clientId: string, account: AccessibleAccount): Promise<void> {
  await prisma.clientPlatform.update({
    where: { clientId_platform: { clientId, platform: PLATFORM } },
    data: {
      externalAccountId: account.externalAccountId,
      accountLabel: account.name ?? account.externalAccountId,
      status: "CONECTADO",
      connectedAt: new Date(),
      metadata: account.currencyCode ? { currencyCode: account.currencyCode } : undefined,
      lastSyncError: null,
    },
  });
}

const TOKEN_REFRESH_BUFFER_MS = 60_000;

export interface ValidAccessToken {
  accessToken: string;
  loginCustomerId?: string;
}

/**
 * Devolve um access token válido para a conexão, renovando via refresh token
 * quando necessário (o access token do Google expira em ~1h). Nunca devolve
 * o refresh token — ele nunca sai deste service (etapa 4).
 */
export async function getValidAccessToken(organizationId: string, clientId: string): Promise<ValidAccessToken> {
  const connection = await getGoogleAdsConnection(organizationId, clientId);
  if (!connection || connection.status !== "CONECTADO" || !connection.accessTokenEncrypted) {
    throw new GoogleAdsError("UNAUTHORIZED", "Cliente não tem uma conexão Google Ads ativa.");
  }

  const isExpired = !connection.tokenExpiresAt || connection.tokenExpiresAt.getTime() - TOKEN_REFRESH_BUFFER_MS <= Date.now();
  const metadata = (connection.metadata as { loginCustomerId?: string } | null) ?? null;

  if (!isExpired) {
    return { accessToken: decryptToken(connection.accessTokenEncrypted), loginCustomerId: metadata?.loginCustomerId };
  }

  if (!connection.refreshTokenEncrypted) {
    throw new GoogleAdsError("INVALID_GRANT", "Conexão do Google Ads sem refresh token — é necessário reconectar.");
  }

  try {
    const refreshed = await googleAdsProvider.refreshAccessToken(decryptToken(connection.refreshTokenEncrypted));
    await prisma.clientPlatform.update({
      where: { id: connection.id },
      data: {
        accessTokenEncrypted: encryptToken(refreshed.accessToken),
        tokenExpiresAt: refreshed.expiresAt,
      },
    });
    return { accessToken: refreshed.accessToken, loginCustomerId: metadata?.loginCustomerId };
  } catch (error) {
    if (error instanceof GoogleAdsError && error.code === "INVALID_GRANT") {
      await prisma.clientPlatform.update({
        where: { id: connection.id },
        data: { status: "ERRO", lastSyncStatus: "ERRO", lastSyncError: error.friendlyMessage },
      });
    }
    throw error;
  }
}

export async function markSyncing(organizationId: string, clientId: string): Promise<void> {
  await prisma.clientPlatform.updateMany({
    where: { organizationId, clientId, platform: PLATFORM },
    data: { status: "SINCRONIZANDO" },
  });
}

export async function markSyncResult(
  organizationId: string,
  clientId: string,
  result: { ok: true } | { ok: false; error: string },
): Promise<void> {
  const now = new Date();
  await prisma.clientPlatform.updateMany({
    where: { organizationId, clientId, platform: PLATFORM },
    data: result.ok
      ? { status: "CONECTADO", lastSyncAt: now, lastSyncStatus: "SUCESSO", lastSyncError: null }
      : { status: "ERRO", lastSyncAt: now, lastSyncStatus: "ERRO", lastSyncError: result.error },
  });
}

/** Etapa 23 — desconecta: revoga o token junto ao Google e apaga os tokens locais. Métricas já sincronizadas NÃO são apagadas. */
export async function disconnectGoogleAds(organizationId: string, clientId: string): Promise<void> {
  const connection = await getGoogleAdsConnection(organizationId, clientId);
  if (!connection) return;

  if (connection.refreshTokenEncrypted) {
    try {
      await googleAdsProvider.revokeToken(decryptToken(connection.refreshTokenEncrypted));
    } catch {
      // Best-effort: mesmo que a revogação junto ao Google falhe, ainda
      // removemos as credenciais localmente — a aplicação nunca deve ficar
      // "presa" com um token que o usuário pediu para desconectar.
    }
  }

  await prisma.clientPlatform.update({
    where: { id: connection.id },
    data: {
      status: "NAO_CONECTADO",
      externalAccountId: null,
      accessTokenEncrypted: null,
      refreshTokenEncrypted: null,
      tokenExpiresAt: null,
      connectedAt: null,
      lastSyncStatus: null,
      lastSyncError: null,
    },
  });
}
