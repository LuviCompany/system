import type { IntegrationPlatform } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { decryptToken, encryptToken } from "@/server/security/token-crypto";
import type { AccessibleAccount } from "@/server/integrations/ads-provider";

import { MetaError } from "./errors";
import { metaAdsProvider } from "./ads/provider";

/**
 * CRUD da conexão Meta (Ads e Instagram) — reaproveita a MESMA tabela
 * `ClientPlatform` já usada pelo Google Ads (etapa 5) e pelo módulo Clientes
 * mock (etapa 4). Nenhuma tabela nova (item 13 — "não duplicar
 * estruturas"). `platform` diferencia META_ADS de INSTAGRAM — ambos podem
 * coexistir para o mesmo Client, cada um com seu próprio token (Instagram
 * tipicamente usa uma Instagram Business Account específica).
 */

export async function getMetaConnection(organizationId: string, clientId: string, platform: Extract<IntegrationPlatform, "META_ADS" | "INSTAGRAM">) {
  return prisma.clientPlatform.findFirst({ where: { organizationId, clientId, platform } });
}

/** Verdadeiro só quando existe uma conexão de fato (nunca confiar só no campo `status`, que pode ser resquício de dado mock). */
export function isGenuinelyConnected(connection: { externalAccountId: string | null; accessTokenEncrypted: string | null } | null): boolean {
  return Boolean(connection?.externalAccountId && connection.accessTokenEncrypted);
}

export async function saveInitialTokens(
  organizationId: string,
  clientId: string,
  platform: Extract<IntegrationPlatform, "META_ADS" | "INSTAGRAM">,
  tokens: { accessToken: string; refreshToken: string | null; expiresAt: Date | null },
): Promise<void> {
  await prisma.clientPlatform.upsert({
    where: { clientId_platform: { clientId, platform } },
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
      platform,
      status: "NAO_CONECTADO",
      accessTokenEncrypted: encryptToken(tokens.accessToken),
      refreshTokenEncrypted: tokens.refreshToken ? encryptToken(tokens.refreshToken) : null,
      tokenExpiresAt: tokens.expiresAt,
    },
  });
}

export async function markSyncing(organizationId: string, clientId: string, platform: Extract<IntegrationPlatform, "META_ADS" | "INSTAGRAM">): Promise<void> {
  await prisma.clientPlatform.updateMany({ where: { organizationId, clientId, platform }, data: { status: "SINCRONIZANDO" } });
}

export async function markSyncResult(
  organizationId: string,
  clientId: string,
  platform: Extract<IntegrationPlatform, "META_ADS" | "INSTAGRAM">,
  result: { ok: true } | { ok: false; error: string },
): Promise<void> {
  const now = new Date();
  await prisma.clientPlatform.updateMany({
    where: { organizationId, clientId, platform },
    data: result.ok
      ? { status: "CONECTADO", lastSyncAt: now, lastSyncStatus: "SUCESSO", lastSyncError: null }
      : { status: "ERRO", lastSyncAt: now, lastSyncStatus: "ERRO", lastSyncError: result.error },
  });
}

/** Desconecta: revoga o acesso junto à Meta (best-effort) e apaga os tokens locais. Métricas já sincronizadas NÃO são apagadas. */
export async function disconnectMeta(organizationId: string, clientId: string, platform: Extract<IntegrationPlatform, "META_ADS" | "INSTAGRAM">): Promise<void> {
  const connection = await getMetaConnection(organizationId, clientId, platform);
  if (!connection) return;

  // A Meta revoga pelo access token (não existe refresh token separado —
  // ver oauth.ts). Best-effort: mesmo que a revogação falhe, ainda
  // removemos as credenciais localmente.
  if (connection.accessTokenEncrypted && platform === "META_ADS") {
    try {
      await providerFor(platform).revokeToken(decryptToken(connection.accessTokenEncrypted));
    } catch {
      // ignora — nunca deve travar a desconexão local
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

/** Único provedor real nesta etapa — Instagram continua sem implementação (item 12 do escopo). */
function providerFor(platform: Extract<IntegrationPlatform, "META_ADS" | "INSTAGRAM">) {
  if (platform !== "META_ADS") {
    throw new MetaError("NOT_CONFIGURED", "Integração com o Instagram ainda não implementada.");
  }
  return metaAdsProvider;
}

/** Lista as contas de anúncio acessíveis pela conexão ainda não finalizada (depois do callback OAuth, antes da seleção de conta). */
export async function listAccessibleAccountsForClient(
  organizationId: string,
  clientId: string,
  platform: Extract<IntegrationPlatform, "META_ADS" | "INSTAGRAM">,
): Promise<AccessibleAccount[]> {
  const connection = await getMetaConnection(organizationId, clientId, platform);
  if (!connection?.accessTokenEncrypted) {
    throw new MetaError("UNAUTHORIZED", "Nenhuma autorização da Meta pendente para este cliente.");
  }

  const accessToken = decryptToken(connection.accessTokenEncrypted);
  return providerFor(platform).listAccessibleAccounts(accessToken);
}

/** Finaliza a conexão depois que o usuário escolhe a conta de anúncios. */
export async function finalizeAccountSelection(
  organizationId: string,
  clientId: string,
  platform: Extract<IntegrationPlatform, "META_ADS" | "INSTAGRAM">,
  account: AccessibleAccount,
): Promise<void> {
  void organizationId;
  await prisma.clientPlatform.update({
    where: { clientId_platform: { clientId, platform } },
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

/**
 * Devolve um access token válido, renovando (troca por um novo token de
 * longa duração — ver oauth.ts) quando está a menos de 1 minuto de expirar.
 * Diferente do Google, não há refresh token separado: a própria renovação
 * usa o access token atual.
 */
export async function getValidAccessToken(
  organizationId: string,
  clientId: string,
  platform: Extract<IntegrationPlatform, "META_ADS" | "INSTAGRAM">,
): Promise<string> {
  const connection = await getMetaConnection(organizationId, clientId, platform);
  if (!connection || connection.status !== "CONECTADO" || !connection.accessTokenEncrypted) {
    throw new MetaError("UNAUTHORIZED", "Cliente não tem uma conexão Meta Ads ativa.");
  }

  const currentAccessToken = decryptToken(connection.accessTokenEncrypted);
  const isExpired = !connection.tokenExpiresAt || connection.tokenExpiresAt.getTime() - TOKEN_REFRESH_BUFFER_MS <= Date.now();

  if (!isExpired) {
    return currentAccessToken;
  }

  try {
    const refreshed = await providerFor(platform).refreshAccessToken(currentAccessToken);
    await prisma.clientPlatform.update({
      where: { id: connection.id },
      data: {
        accessTokenEncrypted: encryptToken(refreshed.accessToken),
        tokenExpiresAt: refreshed.expiresAt,
      },
    });
    return refreshed.accessToken;
  } catch (error) {
    if (error instanceof MetaError && error.code === "INVALID_GRANT") {
      await prisma.clientPlatform.update({
        where: { id: connection.id },
        data: { status: "ERRO", lastSyncStatus: "ERRO", lastSyncError: error.friendlyMessage },
      });
    }
    throw error;
  }
}
