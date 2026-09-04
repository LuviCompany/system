import { Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { formatCurrency, formatDecimal, formatNumber, formatPercent } from "@/lib/format";
import { AD_PLATFORM_LABELS } from "@/modules/clientes/constants";
import type { AdRow } from "@/server/clients/performance.service";

interface AdsRankingProps {
  ads: AdRow[];
}

export function AdsRanking({ ads }: AdsRankingProps) {
  const columns: DataTableColumn<AdRow>[] = [
    {
      key: "name",
      header: "Anúncio",
      render: (row) => row.name,
    },
    { key: "platform", header: "Plataforma", render: (row) => <Badge variant="neutral">{AD_PLATFORM_LABELS[row.platform]}</Badge> },
    { key: "campaign", header: "Campanha", render: (row) => row.campaignName },
    { key: "impressions", header: "Impressões", align: "right", render: (row) => formatNumber(row.metrics.impressions) },
    { key: "clicks", header: "Cliques", align: "right", render: (row) => formatNumber(row.metrics.clicks) },
    { key: "ctr", header: "CTR", align: "right", render: (row) => formatPercent(row.metrics.ctr) },
    { key: "conversions", header: "Conversões", align: "right", render: (row) => formatNumber(row.metrics.sales) },
    { key: "cpa", header: "CPA", align: "right", render: (row) => formatCurrency(row.metrics.cpa, true) },
    { key: "revenue", header: "Receita", align: "right", render: (row) => formatCurrency(row.metrics.revenue) },
    { key: "roas", header: "ROAS", align: "right", render: (row) => formatDecimal(row.metrics.roas) },
  ];

  const columnsWithHighlight: DataTableColumn<AdRow>[] = [
    {
      key: "rank",
      header: "",
      width: "2.5rem",
      render: (row) => (ads[0]?.id === row.id ? <Trophy className="h-4 w-4 text-brand-500" aria-hidden /> : null),
    },
    ...columns,
  ];

  return <DataTable columns={columnsWithHighlight} data={ads} getRowId={(row) => row.id} emptyMessage="Nenhum anúncio encontrado." />;
}
