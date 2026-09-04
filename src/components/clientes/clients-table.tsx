"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDecimal, formatDate } from "@/lib/format";
import { CLIENT_HEALTH_BADGE_VARIANT, CLIENT_HEALTH_LABELS, CLIENT_SEGMENTS, CLIENT_STATUS_LABELS } from "@/modules/clientes/constants";
import type { ClientRecord, ClientRowMetrics } from "@/server/clients/client.service";

export type ClientTableRow = ClientRecord & { metrics: ClientRowMetrics };

const ROAS_BUCKETS = [
  { value: "all", label: "Todos" },
  { value: "lt2", label: "Abaixo de 2x" },
  { value: "2to4", label: "Entre 2x e 4x" },
  { value: "gt4", label: "Acima de 4x" },
] as const;

interface ClientsTableProps {
  clients: ClientTableRow[];
}

export function ClientsTable({ clients }: ClientsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [segment, setSegment] = useState<string>("all");
  const [platform, setPlatform] = useState<string>("all");
  const [roasBucket, setRoasBucket] = useState<string>("all");

  const filtered = useMemo(() => {
    return clients.filter((client) => {
      if (search.trim()) {
        const term = search.trim().toLowerCase();
        const haystack = `${client.name} ${client.tradeName ?? ""} ${client.segment ?? ""}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (status !== "all" && client.status !== status) return false;
      if (segment !== "all" && client.segment !== segment) return false;
      if (platform === "META_ADS" && !client.metrics.metaConnected) return false;
      if (platform === "GOOGLE_ADS" && !client.metrics.googleConnected) return false;
      if (roasBucket === "lt2" && client.metrics.roas >= 2) return false;
      if (roasBucket === "2to4" && (client.metrics.roas < 2 || client.metrics.roas > 4)) return false;
      if (roasBucket === "gt4" && client.metrics.roas <= 4) return false;
      return true;
    });
  }, [clients, search, status, segment, platform, roasBucket]);

  const columns: DataTableColumn<ClientTableRow>[] = [
    {
      key: "name",
      header: "Cliente",
      render: (row) => (
        <div>
          <p className="font-medium text-ink-900">{row.tradeName ?? row.name}</p>
          <p className="text-xs text-ink-500">{row.segment ?? "Sem segmento"}</p>
        </div>
      ),
    },
    {
      key: "meta",
      header: "Meta Ads",
      render: (row) => (
        <Badge variant={row.metrics.metaConnected ? "success" : "neutral"}>
          {row.metrics.metaConnected ? "Conectado" : "Não conectado"}
        </Badge>
      ),
    },
    {
      key: "google",
      header: "Google Ads",
      render: (row) => (
        <Badge variant={row.metrics.googleConnected ? "success" : "neutral"}>
          {row.metrics.googleConnected ? "Conectado" : "Não conectado"}
        </Badge>
      ),
    },
    { key: "investment", header: "Investimento", align: "right", render: (row) => formatCurrency(row.metrics.investment) },
    { key: "revenue", header: "Receita", align: "right", render: (row) => formatCurrency(row.metrics.revenue) },
    { key: "roas", header: "ROAS", align: "right", render: (row) => formatDecimal(row.metrics.roas) },
    { key: "leads", header: "Leads", align: "right", render: (row) => row.metrics.leads },
    { key: "sales", header: "Vendas", align: "right", render: (row) => row.metrics.sales },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge variant={CLIENT_HEALTH_BADGE_VARIANT[row.health]}>{CLIENT_HEALTH_LABELS[row.health]}</Badge>,
    },
    { key: "updatedAt", header: "Última atualização", render: (row) => formatDate(row.updatedAt) },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden />
          <Input placeholder="Buscar cliente..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(CLIENT_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={roasBucket} onValueChange={setRoasBucket}>
          <SelectTrigger className="w-44"><SelectValue placeholder="ROAS" /></SelectTrigger>
          <SelectContent>
            {ROAS_BUCKETS.map((b) => (
              <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Plataforma" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as plataformas</SelectItem>
            <SelectItem value="META_ADS">Meta Ads</SelectItem>
            <SelectItem value="GOOGLE_ADS">Google Ads</SelectItem>
          </SelectContent>
        </Select>
        <Select value={segment} onValueChange={setSegment}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Segmento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os segmentos</SelectItem>
            {CLIENT_SEGMENTS.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        getRowId={(row) => row.id}
        onRowClick={(row) => router.push(`/clientes/${row.id}`)}
        emptyMessage="Nenhum cliente encontrado com esses filtros."
      />
    </div>
  );
}
