import { Trophy } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDecimal, formatNumber } from "@/lib/format";
import { AD_PLATFORM_LABELS } from "@/modules/clientes/constants";
import type { CampaignRow } from "@/server/clients/performance.service";

export function BestCampaignCard({ campaign }: { campaign: CampaignRow | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-brand-500" aria-hidden />
          Melhor campanha
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!campaign ? (
          <p className="text-sm text-ink-500">Sem campanhas no período selecionado.</p>
        ) : (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
            <div className="col-span-2 sm:col-span-3">
              <dt className="text-xs text-ink-500">Nome</dt>
              <dd className="font-medium text-ink-900">{campaign.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Plataforma</dt>
              <dd className="font-medium text-ink-900">{AD_PLATFORM_LABELS[campaign.platform]}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">ROAS</dt>
              <dd className="font-mono font-medium text-ink-900">{formatDecimal(campaign.metrics.roas)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Conversões</dt>
              <dd className="font-medium text-ink-900">{formatNumber(campaign.metrics.sales)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">CPA</dt>
              <dd className="font-medium text-ink-900">{formatCurrency(campaign.metrics.cpa, true)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Investimento</dt>
              <dd className="font-medium text-ink-900">{formatCurrency(campaign.metrics.investment)}</dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
