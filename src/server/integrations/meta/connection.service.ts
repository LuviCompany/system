import type { IntegrationPlatform } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { decryptToken, encryptToken } from "@/server/security/token-crypto";

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

/** Preparado para desconectar de verdade (revogar + limpar tokens) quando o OAuth real existir. Mantém métricas já sincronizadas. */
export async function disconnectMeta(organizationId: string, clientId: string, platform: Extract<IntegrationPlatform, "META_ADS" | "INSTAGRAM">): Promise<void> {
  const connection = await getMetaConnection(organizationId, clientId, platform);
  if (!connection) return;

  if (connection.refreshTokenEncrypted) {
    // Nesta etapa a revogação real nunca roda (oauth.ts sempre lança
    // NOT_CONFIGURED) — o decrypt aqui só existe para deixar o fluxo
    // completo e pronto para quando a integração real existir.
    try {
      decryptToken(connection.refreshTokenEncrypted);
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
