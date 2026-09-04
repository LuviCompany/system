"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDecimal, formatNumber, formatPercent } from "@/lib/format";
import { AD_PLATFORM_LABELS, CAMPAIGN_STATUS_LABELS } from "@/modules/clientes/constants";
import type { CampaignRow } from "@/server/clients/performance.service";

interface CampaignsTableProps {
  campaigns: CampaignRow[];
}

export function CampaignsTable({ campaigns }: CampaignsTableProps) {
  const [platform, setPlatform] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(
    () =>
      campaigns.filter((c) => {
        if (platform !== "all" && c.platform !== platform) return false;
        if (status !== "all" && c.status !== status) return false;
        return true;
      }),
    [campaigns, platform, status],
  );

  const columns: DataTableColumn<CampaignRow>[] = [
    { key: "platform", header: "Plataforma", render: (row) => <Badge variant="neutral">{AD_PLATFORM_LABELS[row.platform]}</Badge> },
    { key: "name", header: "Campanha", render: (row) => <span className="font-medium text-ink-900">{row.name}</span> },
    { key: "status", header: "Status", render: (row) => CAMPAIGN_STATUS_LABELS[row.status as keyof typeof CAMPAIGN_STATUS_LABELS] },
    { key: "investment", header: "Investimento", align: "right", render: (row) => formatCurrency(row.metrics.investment) },
    { key: "impressions", header: "Impressões", align: "right", render: (row) => formatNumber(row.metrics.impressions) },
    { key: "clicks", header: "Cliques", align: "right", render: (row) => formatNumber(row.metrics.clicks) },
    { key: "ctr", header: "CTR", align: "right", render: (row) => formatPercent(row.metrics.ctr) },
    { key: "conversions", header: "Conversões", align: "right", render: (row) => formatNumber(row.metrics.sales) },
    { key: "cpa", header: "CPA", align: "right", render: (row) => formatCurrency(row.metrics.cpa, true) },
    { key: "revenue", header: "Receita", align: "right", render: (row) => formatCurrency(row.metrics.revenue) },
    { key: "roas", header: "ROAS", align: "right", render: (row) => formatDecimal(row.metrics.roas) },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Plataforma" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as plataformas</SelectItem>
            <SelectItem value="META_ADS">Meta Ads</SelectItem>
            <SelectItem value="GOOGLE_ADS">Google Ads</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(CAMPAIGN_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} data={filtered} getRowId={(row) => row.id} emptyMessage="Nenhuma campanha encontrada." />
    </div>
  );
}
