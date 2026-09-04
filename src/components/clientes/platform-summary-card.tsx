import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDecimal, formatNumber, formatPercent } from "@/lib/format";
import type { DerivedMetrics } from "@/modules/clientes/types";

interface PlatformSummaryCardProps {
  title: string;
  connected: boolean;
  activeCampaigns: number;
  metrics: DerivedMetrics;
}

export function PlatformSummaryCard({ title, connected, activeCampaigns, metrics }: PlatformSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <Badge variant={connected ? "success" : "neutral"}>{connected ? "Conectado" : "Não conectado"}</Badge>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-xs text-ink-500">Campanhas ativas: <span className="font-medium text-ink-900">{activeCampaigns}</span></p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
          <div><dt className="text-xs text-ink-500">Investimento</dt><dd className="font-medium text-ink-900">{formatCurrency(metrics.investment)}</dd></div>
          <div><dt className="text-xs text-ink-500">Alcance</dt><dd className="font-medium text-ink-900">{formatNumber(metrics.reach)}</dd></div>
          <div><dt className="text-xs text-ink-500">Impressões</dt><dd className="font-medium text-ink-900">{formatNumber(metrics.impressions)}</dd></div>
          <div><dt className="text-xs text-ink-500">Cliques</dt><dd className="font-medium text-ink-900">{formatNumber(metrics.clicks)}</dd></div>
          <div><dt className="text-xs text-ink-500">CTR</dt><dd className="font-medium text-ink-900">{formatPercent(metrics.ctr)}</dd></div>
          <div><dt className="text-xs text-ink-500">CPC</dt><dd className="font-medium text-ink-900">{formatCurrency(metrics.cpc, true)}</dd></div>
          <div><dt className="text-xs text-ink-500">Resultados</dt><dd className="font-medium text-ink-900">{formatNumber(metrics.leads)}</dd></div>
          <div><dt className="text-xs text-ink-500">CPL</dt><dd className="font-medium text-ink-900">{formatCurrency(metrics.cpl, true)}</dd></div>
          <div><dt className="text-xs text-ink-500">CPA</dt><dd className="font-medium text-ink-900">{formatCurrency(metrics.cpa, true)}</dd></div>
          <div><dt className="text-xs text-ink-500">Receita</dt><dd className="font-medium text-ink-900">{formatCurrency(metrics.revenue)}</dd></div>
          <div><dt className="text-xs text-ink-500">ROAS</dt><dd className="font-medium text-ink-900">{formatDecimal(metrics.roas)}</dd></div>
        </dl>
      </CardContent>
    </Card>
  );
}
