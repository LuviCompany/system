import { BarChart3 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdsRanking } from "@/components/clientes/ads-ranking";
import { BestCampaignCard } from "@/components/clientes/best-campaign-card";
import { CampaignsTable } from "@/components/clientes/campaigns-table";
import { PeriodSelector } from "@/components/clientes/period-selector";
import { PlatformSummaryCard } from "@/components/clientes/platform-summary-card";
import { SyncMetaButton } from "@/components/clientes/sync-meta-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";
import { INTEGRATION_STATUS_ICON, INTEGRATION_STATUS_LABELS, type PeriodPreset } from "@/modules/clientes/constants";
import { requireSession } from "@/server/auth/session";
import { getClientById } from "@/server/clients/client.service";
import { resolvePeriod } from "@/server/clients/period";
import {
  getBestAd,
  getBestCampaign,
  getClientMetrics,
  listAdsWithMetrics,
  listCampaignsWithMetrics,
} from "@/server/clients/performance.service";
import { getMetaConnection } from "@/server/integrations/meta/connection.service";

export const metadata: Metadata = { title: "Meta Ads" };

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ periodo?: string }>;
}

/** Dashboard real de Meta Ads (etapa 7) — só existe dado aqui depois de "Sincronizar agora". */
export default async function ClienteMetaAdsPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { periodo } = await searchParams;
  const session = await requireSession();

  const client = await getClientById(session.organizationId, id);
  if (!client) notFound();

  const connection = await getMetaConnection(session.organizationId, id, "META_ADS");
  const connected = connection?.status === "CONECTADO" || connection?.status === "SINCRONIZANDO";

  const preset = (periodo as PeriodPreset) ?? "30dias";
  const period = resolvePeriod(preset);
  const baseFilter = { organizationId: session.organizationId, clientId: id, period, platform: "META_ADS" as const };

  const [metrics, campaigns, ads, bestCampaign, bestAd] = connected
    ? await Promise.all([
        getClientMetrics(baseFilter),
        listCampaignsWithMetrics(baseFilter),
        listAdsWithMetrics(baseFilter),
        getBestCampaign(baseFilter),
        getBestAd(baseFilter),
      ])
    : [null, [], [], null, null];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-ink-900">Meta Ads — {client.tradeName ?? client.name}</h1>
            <Badge variant={connected ? "success" : "neutral"}>
              {connection ? `${INTEGRATION_STATUS_ICON[connection.status]} ${INTEGRATION_STATUS_LABELS[connection.status]}` : "⚪ Não conectado"}
            </Badge>
          </div>
          {connection?.lastSyncAt && <p className="text-sm text-ink-500">Última sincronização: {formatDate(connection.lastSyncAt)}</p>}
        </div>
        <div className="flex items-center gap-2">
          {connected && <PeriodSelector value={preset} />}
          {connected ? (
            <SyncMetaButton clientId={id} platform="META_ADS" />
          ) : (
            <Button asChild>
              <Link href={`/clientes/${id}/integracoes`}>Conectar Meta Ads</Link>
            </Button>
          )}
        </div>
      </div>

      {!connected ? (
        <EmptyState
          icon={BarChart3}
          title="Meta Ads ainda não conectado"
          description="Conecte a conta de anúncios da Meta deste cliente para ver campanhas, anúncios e métricas reais aqui."
          action={
            <Button asChild>
              <Link href={`/clientes/${id}/integracoes`}>Conectar Meta Ads</Link>
            </Button>
          }
        />
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Ainda não há dados sincronizados"
          description='Clique em "Sincronizar agora" para buscar campanhas e métricas reais desta conta.'
        />
      ) : (
        <>
          {metrics && <PlatformSummaryCard title="Resumo (Meta Ads)" connected activeCampaigns={campaigns.filter((c) => c.status === "ATIVA").length} metrics={metrics} />}

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-ink-900">Campanhas</h2>
            <CampaignsTable campaigns={campaigns} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <BestCampaignCard campaign={bestCampaign} />
            </div>
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-ink-900">Melhores anúncios</h2>
                {bestAd && <Badge variant="brand">🏆 {bestAd.name}</Badge>}
              </div>
              <AdsRanking ads={ads} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
