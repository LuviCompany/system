import type { CampaignStatus } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import type { PeriodRange } from "@/modules/clientes/types";
import type { NormalizedAdMetric, NormalizedCampaignMetric } from "@/server/integrations/ads-provider";

import { metaAdsProvider } from "./ads/provider";
import { getMetaConnection, getValidAccessToken, markSyncing, markSyncResult } from "./connection.service";
import { META_INSTAGRAM_NOT_IMPLEMENTED_MESSAGE, MetaError, toMetaError } from "./errors";

const SYNC_WINDOW_DAYS = 30;
const PLATFORM = "META_ADS" as const;

function syncWindow(): PeriodRange {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setDate(start.getDate() - (SYNC_WINDOW_DAYS - 1));
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function mapCampaignStatus(metaStatus: string): CampaignStatus {
  if (metaStatus === "PAUSED") return "PAUSADA";
  if (metaStatus === "ARCHIVED" || metaStatus === "DELETED") return "ENCERRADA";
  return "ATIVA";
}

function groupBy<T, K extends string>(rows: T[], keyOf: (row: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const row of rows) {
    const key = keyOf(row);
    const group = map.get(key);
    if (group) group.push(row);
    else map.set(key, [row]);
  }
  return map;
}

async function persistCampaignMetrics(
  organizationId: string,
  clientId: string,
  rows: NormalizedCampaignMetric[],
  period: PeriodRange,
): Promise<Map<string, string>> {
  const campaignIdByExternalId = new Map<string, string>();
  const byCampaign = groupBy(rows, (row) => row.externalCampaignId);

  for (const [externalCampaignId, group] of byCampaign) {
    const first = group[0];
    const campaign = await prisma.campaign.upsert({
      where: { clientId_platform_externalId: { clientId, platform: PLATFORM, externalId: externalCampaignId } },
      update: { name: first.campaignName, status: mapCampaignStatus(first.campaignStatus) },
      create: {
        organizationId,
        clientId,
        platform: PLATFORM,
        externalId: externalCampaignId,
        name: first.campaignName,
        status: mapCampaignStatus(first.campaignStatus),
      },
    });
    campaignIdByExternalId.set(externalCampaignId, campaign.id);

    // Mesmo raciocínio do Google Ads: apagar e recriar a janela sincronizada
    // evita duplicar linhas a cada clique em "Sincronizar agora".
    await prisma.performanceMetric.deleteMany({
      where: { campaignId: campaign.id, adId: null, date: { gte: period.start, lte: period.end } },
    });
    await prisma.performanceMetric.createMany({
      data: group.map((row) => ({
        organizationId,
        clientId,
        campaignId: campaign.id,
        platform: PLATFORM,
        date: row.date,
        investment: row.spend,
        reach: 0,
        impressions: row.impressions,
        clicks: row.clicks,
        leads: 0,
        sales: Math.round(row.conversions),
        revenue: row.conversionValue,
      })),
    });
  }

  return campaignIdByExternalId;
}

async function persistAdMetrics(
  organizationId: string,
  clientId: string,
  rows: NormalizedAdMetric[],
  period: PeriodRange,
  campaignIdByExternalId: Map<string, string>,
): Promise<void> {
  const byAd = groupBy(rows, (row) => row.externalAdId);

  for (const [externalAdId, group] of byAd) {
    const first = group[0];

    let campaignId = campaignIdByExternalId.get(first.externalCampaignId);
    if (!campaignId) {
      // Acontece quando um anúncio aparece no relatório de anúncios mas a
      // campanha correspondente não veio no relatório de campanhas (raro,
      // ex: diferença de fuso na fronteira do período).
      const campaign = await prisma.campaign.upsert({
        where: { clientId_platform_externalId: { clientId, platform: PLATFORM, externalId: first.externalCampaignId } },
        update: { name: first.campaignName },
        create: { organizationId, clientId, platform: PLATFORM, externalId: first.externalCampaignId, name: first.campaignName },
      });
      campaignId = campaign.id;
      campaignIdByExternalId.set(first.externalCampaignId, campaignId);
    }

    const ad = await prisma.ad.upsert({
      where: { clientId_platform_externalId: { clientId, platform: PLATFORM, externalId: externalAdId } },
      update: { name: first.adName, adGroupName: first.adGroupName, adGroupExternalId: first.externalAdGroupId, campaignId },
      create: {
        organizationId,
        clientId,
        campaignId,
        platform: PLATFORM,
        externalId: externalAdId,
        name: first.adName,
        adGroupName: first.adGroupName,
        adGroupExternalId: first.externalAdGroupId,
      },
    });

    await prisma.performanceMetric.deleteMany({
      where: { adId: ad.id, date: { gte: period.start, lte: period.end } },
    });
    await prisma.performanceMetric.createMany({
      data: group.map((row) => ({
        organizationId,
        clientId,
        campaignId,
        adId: ad.id,
        platform: PLATFORM,
        date: row.date,
        investment: row.spend,
        reach: 0,
        impressions: row.impressions,
        clicks: row.clicks,
        leads: 0,
        sales: Math.round(row.conversions),
        revenue: row.conversionValue,
      })),
    });
  }
}

export type MetaSyncResult = { ok: true; campaigns: number; ads: number } | { ok: false; error: string };

/** "Sincronizar agora": busca campanhas + anúncios dos últimos 30 dias via Insights e regrava no PostgreSQL. Somente leitura. */
export async function syncMetaAdsForClient(organizationId: string, clientId: string): Promise<MetaSyncResult> {
  await markSyncing(organizationId, clientId, "META_ADS");

  try {
    const connection = await getMetaConnection(organizationId, clientId, "META_ADS");
    if (!connection?.externalAccountId) {
      throw new MetaError("UNAUTHORIZED", "Nenhuma conta de anúncios Meta selecionada para este cliente.");
    }

    const accessToken = await getValidAccessToken(organizationId, clientId, "META_ADS");
    const period = syncWindow();

    const [campaignRows, adRows] = await Promise.all([
      metaAdsProvider.fetchCampaignMetrics({ externalAccountId: connection.externalAccountId, accessToken, period }),
      metaAdsProvider.fetchAdMetrics({ externalAccountId: connection.externalAccountId, accessToken, period }),
    ]);

    const campaignIdByExternalId = await persistCampaignMetrics(organizationId, clientId, campaignRows, period);
    await persistAdMetrics(organizationId, clientId, adRows, period, campaignIdByExternalId);

    await markSyncResult(organizationId, clientId, "META_ADS", { ok: true });
    return { ok: true, campaigns: campaignIdByExternalId.size, ads: new Set(adRows.map((r) => r.externalAdId)).size };
  } catch (error) {
    const mapped = toMetaError(error);
    await markSyncResult(organizationId, clientId, "META_ADS", { ok: false, error: mapped.friendlyMessage });
    return { ok: false, error: mapped.friendlyMessage };
  }
}

export type InstagramSyncResult = { ok: true; posts: number } | { ok: false; error: string };

/** Instagram permanece não implementado nesta etapa (item 12 do escopo) — arquitetura preparada, sem chamada real. */
export async function syncInstagramForClient(organizationId: string, clientId: string): Promise<InstagramSyncResult> {
  await markSyncing(organizationId, clientId, "INSTAGRAM");
  await markSyncResult(organizationId, clientId, "INSTAGRAM", { ok: false, error: META_INSTAGRAM_NOT_IMPLEMENTED_MESSAGE });
  return { ok: false, error: META_INSTAGRAM_NOT_IMPLEMENTED_MESSAGE };
}
