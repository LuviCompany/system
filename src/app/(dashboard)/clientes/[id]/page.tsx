import {
  BarChart3,
  DollarSign,
  Eye,
  MousePointerClick,
  Percent,
  ShoppingCart,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdsRanking } from "@/components/clientes/ads-ranking";
import { BestCampaignCard } from "@/components/clientes/best-campaign-card";
import { CampaignsTable } from "@/components/clientes/campaigns-table";
import { EditClientDrawer } from "@/components/clientes/edit-client-drawer";
import { FunnelSteps } from "@/components/clientes/funnel-steps";
import { PerformanceCharts } from "@/components/clientes/performance-charts";
import { PeriodSelector } from "@/components/clientes/period-selector";
import { PlatformSummaryCard } from "@/components/clientes/platform-summary-card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDecimal, formatNumber, formatPercent } from "@/lib/format";
import { CLIENT_HEALTH_BADGE_VARIANT, CLIENT_HEALTH_LABELS, type PeriodPreset } from "@/modules/clientes/constants";
import { buildInsights } from "@/modules/clientes/insights";
import { requireSession } from "@/server/auth/session";
import { getClientById } from "@/server/clients/client.service";
import { resolvePeriod } from "@/server/clients/period";
import {
  getBestAd,
  getBestCampaign,
  getClientFunnel,
  getClientPeriodComparison,
  getClientTimeSeries,
  getPerformanceByPlatform,
  listAdsWithMetrics,
  listCampaignsWithMetrics,
} from "@/server/clients/performance.service";
import { listTeamMembers } from "@/server/team/team.service";

export const metadata: Metadata = { title: "Dashboard do cliente" };

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ periodo?: string }>;
}

export default async function ClienteDashboardPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { periodo } = await searchParams;
  const session = await requireSession();

  const client = await getClientById(session.organizationId, id);
  if (!client) notFound();

  const preset = (periodo as PeriodPreset) ?? "30dias";
  const period = resolvePeriod(preset);
  const baseFilter = { organizationId: session.organizationId, clientId: id, period };

  const [comparison, funnel, platformBreakdown, campaigns, ads, bestCampaign, bestAd, timeSeries, teamMembers] = await Promise.all([
    getClientPeriodComparison(baseFilter),
    getClientFunnel(baseFilter),
    getPerformanceByPlatform(baseFilter),
    listCampaignsWithMetrics(baseFilter),
    listAdsWithMetrics(baseFilter),
    getBestCampaign(baseFilter),
    getBestAd(baseFilter),
    getClientTimeSeries(baseFilter),
    listTeamMembers(session.organizationId),
  ]);

  const insights = buildInsights(comparison);
  const metrics = comparison.current;
  const variation = comparison.variation;
  const meta = platformBreakdown.find((p) => p.platform === "META_ADS")!;
  const google = platformBreakdown.find((p) => p.platform === "GOOGLE_ADS")!;
  const metaConnected = client.platforms.some((p) => p.platform === "META_ADS" && p.status === "CONECTADO");
  const googleConnected = client.platforms.some((p) => p.platform === "GOOGLE_ADS" && p.status === "CONECTADO");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-ink-900">{client.tradeName ?? client.name}</h1>
            <Badge variant={CLIENT_HEALTH_BADGE_VARIANT[client.health]}>{CLIENT_HEALTH_LABELS[client.health]}</Badge>
            <Badge variant="brand">Dados MOCK</Badge>
          </div>
          <p className="text-sm text-ink-500">{client.segment ?? "Sem segmento"} · Responsável: {client.responsavel?.name ?? "Sem responsável"}</p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodSelector value={preset} />
          <Button variant="outline" asChild>
            <Link href={`/clientes/${client.id}/google-ads`}>Google Ads</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/clientes/${client.id}/integracoes`}>Integrações</Link>
          </Button>
          <EditClientDrawer
            clientId={client.id}
            teamMembers={teamMembers.map((m) => ({ id: m.id, name: m.name }))}
            initialValues={{
              name: client.name,
              tradeName: client.tradeName ?? "",
              cnpj: client.cnpj ?? "",
              website: client.website ?? "",
              instagram: client.instagram ?? "",
              segment: client.segment ?? "",
              email: client.email ?? "",
              phone: client.phone ?? "",
              responsavelId: client.responsavelId ?? "",
              status: client.status,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard label="Investimento" value={formatCurrency(metrics.investment)} icon={Wallet} trend={variation.investment ?? undefined} trendLabel="vs período anterior" />
        <MetricCard label="Alcance" value={formatNumber(metrics.reach)} icon={Eye} trend={variation.reach ?? undefined} trendLabel="vs período anterior" />
        <MetricCard label="Impressões" value={formatNumber(metrics.impressions)} icon={BarChart3} trend={variation.impressions ?? undefined} trendLabel="vs período anterior" />
        <MetricCard label="Cliques" value={formatNumber(metrics.clicks)} icon={MousePointerClick} trend={variation.clicks ?? undefined} trendLabel="vs período anterior" />
        <MetricCard label="CTR" value={formatPercent(metrics.ctr)} icon={Percent} trend={variation.ctr ?? undefined} trendLabel="vs período anterior" />
        <MetricCard label="CPC" value={formatCurrency(metrics.cpc, true)} icon={DollarSign} trend={variation.cpc ?? undefined} trendLabel="vs período anterior" />
        <MetricCard label="Leads" value={formatNumber(metrics.leads)} icon={Target} trend={variation.leads ?? undefined} trendLabel="vs período anterior" />
        <MetricCard label="CPL" value={formatCurrency(metrics.cpl, true)} icon={DollarSign} trend={variation.cpl ?? undefined} trendLabel="vs período anterior" />
        <MetricCard label="Vendas" value={formatNumber(metrics.sales)} icon={ShoppingCart} trend={variation.sales ?? undefined} trendLabel="vs período anterior" />
        <MetricCard label="CPA" value={formatCurrency(metrics.cpa, true)} icon={DollarSign} trend={variation.cpa ?? undefined} trendLabel="vs período anterior" />
        <MetricCard label="Receita" value={formatCurrency(metrics.revenue)} icon={DollarSign} accent trend={variation.revenue ?? undefined} trendLabel="vs período anterior" />
        <MetricCard label="ROAS" value={formatDecimal(metrics.roas)} icon={TrendingUp} accent trend={variation.roas ?? undefined} trendLabel="vs período anterior" />
      </div>

      <Card>
        <CardHeader><CardTitle>Funil de performance</CardTitle></CardHeader>
        <CardContent><FunnelSteps steps={funnel} /></CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PlatformSummaryCard
          title="Meta Ads"
          connected={metaConnected}
          activeCampaigns={campaigns.filter((c) => c.platform === "META_ADS" && c.status === "ATIVA").length}
          metrics={meta}
        />
        <PlatformSummaryCard
          title="Google Ads"
          connected={googleConnected}
          activeCampaigns={campaigns.filter((c) => c.platform === "GOOGLE_ADS" && c.status === "ATIVA").length}
          metrics={google}
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-ink-900">Campanhas</h2>
        <CampaignsTable campaigns={campaigns} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1"><BestCampaignCard campaign={bestCampaign} /></div>
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-ink-500" aria-hidden />
            <h2 className="text-sm font-semibold text-ink-900">Melhores anúncios</h2>
            {bestAd && <Badge variant="brand">🏆 {bestAd.name}</Badge>}
          </div>
          <AdsRanking ads={ads} />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-ink-900">Gráficos</h2>
        <PerformanceCharts series={timeSeries} />
      </div>

      <Card>
        <CardHeader><CardTitle>Insights</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2">
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                    insight.tone === "positivo" ? "bg-success-500" : insight.tone === "negativo" ? "bg-danger-500" : "bg-ink-400"
                  }`}
                  aria-hidden
                />
                <span className="text-ink-700">{insight.text}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
