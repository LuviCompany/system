"use client";

import { useRouter } from "next/navigation";

import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { formatNumber } from "@/lib/format";
import type { ClientSocialSummary } from "@/server/clients/social.service";

const columns: DataTableColumn<ClientSocialSummary>[] = [
  { key: "client", header: "Cliente", render: (row) => <span className="font-medium text-ink-900">{row.clientName}</span> },
  { key: "posts", header: "Posts", align: "right", render: (row) => formatNumber(row.posts) },
  { key: "reach", header: "Alcance", align: "right", render: (row) => formatNumber(row.reach) },
  { key: "engagement", header: "Engajamento", align: "right", render: (row) => formatNumber(row.engagement) },
  { key: "shares", header: "Compartilhamentos", align: "right", render: (row) => formatNumber(row.shares) },
  { key: "saves", header: "Salvamentos", align: "right", render: (row) => formatNumber(row.saves) },
  { key: "followers", header: "Seguidores", align: "right", render: (row) => formatNumber(row.followers) },
];

export function SocialClientsTable({ clients }: { clients: ClientSocialSummary[] }) {
  const router = useRouter();
  return (
    <DataTable
      columns={columns}
      data={clients}
      getRowId={(row) => row.clientId}
      onRowClick={(row) => router.push(`/social-media/${row.clientId}`)}
      emptyMessage="Nenhum cliente com conteúdo no período."
    />
  );
}
