import { isMetaConfigured } from "./config";
import { markSyncResult, markSyncing } from "./connection.service";
import { META_NOT_CONFIGURED_MESSAGE } from "./errors";

export type MetaSyncResult = { ok: true; campaigns: number; ads: number } | { ok: false; error: string };

/**
 * Orquestra a sincronização de Meta Ads — mesmo formato de
 * server/integrations/google-ads/sync.ts (fetch -> normaliza -> upsert em
 * Campaign/Ad/PerformanceMetric), mas etapa 6 não implementa a chamada real
 * à Marketing API (item 20). Fica pronto para só trocar o corpo do `if` por
 * uma chamada real de `meta/ads/reporting.ts` quando a integração existir.
 */
export async function syncMetaAdsForClient(organizationId: string, clientId: string): Promise<MetaSyncResult> {
  await markSyncing(organizationId, clientId, "META_ADS");

  if (!isMetaConfigured()) {
    await markSyncResult(organizationId, clientId, "META_ADS", { ok: false, error: META_NOT_CONFIGURED_MESSAGE });
    return { ok: false, error: META_NOT_CONFIGURED_MESSAGE };
  }

  // Não alcançável nesta etapa — meta/oauth.ts sempre lança NOT_CONFIGURED
  // antes de chegar aqui. Mantido para documentar o próximo passo real.
  await markSyncResult(organizationId, clientId, "META_ADS", { ok: false, error: META_NOT_CONFIGURED_MESSAGE });
  return { ok: false, error: META_NOT_CONFIGURED_MESSAGE };
}

export type InstagramSyncResult = { ok: true; posts: number } | { ok: false; error: string };

/** Orquestra a sincronização de posts/insights do Instagram — mesmo raciocínio de syncMetaAdsForClient acima. */
export async function syncInstagramForClient(organizationId: string, clientId: string): Promise<InstagramSyncResult> {
  await markSyncing(organizationId, clientId, "INSTAGRAM");

  if (!isMetaConfigured()) {
    await markSyncResult(organizationId, clientId, "INSTAGRAM", { ok: false, error: META_NOT_CONFIGURED_MESSAGE });
    return { ok: false, error: META_NOT_CONFIGURED_MESSAGE };
  }

  await markSyncResult(organizationId, clientId, "INSTAGRAM", { ok: false, error: META_NOT_CONFIGURED_MESSAGE });
  return { ok: false, error: META_NOT_CONFIGURED_MESSAGE };
}
