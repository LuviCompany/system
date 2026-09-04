import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { formatDate, formatNumber, formatPercent } from "@/lib/format";
import { SOCIAL_CONTENT_TYPE_LABELS } from "@/modules/clientes/constants";
import type { SocialContentType } from "@prisma/client";

export interface ContentRow {
  id: string;
  caption: string | null;
  type: SocialContentType;
  publishedAt: Date;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagement: number;
  engagementRate: number;
}

export function ContentTable({ posts }: { posts: ContentRow[] }) {
  const columns: DataTableColumn<ContentRow>[] = [
    { key: "caption", header: "Conteúdo", render: (row) => row.caption ?? "Sem legenda" },
    { key: "date", header: "Data", render: (row) => formatDate(row.publishedAt) },
    { key: "type", header: "Tipo", render: (row) => SOCIAL_CONTENT_TYPE_LABELS[row.type] },
    { key: "reach", header: "Alcance", align: "right", render: (row) => formatNumber(row.reach) },
    { key: "likes", header: "Curtidas", align: "right", render: (row) => formatNumber(row.likes) },
    { key: "comments", header: "Comentários", align: "right", render: (row) => formatNumber(row.comments) },
    { key: "shares", header: "Compartilhamentos", align: "right", render: (row) => formatNumber(row.shares) },
    { key: "saves", header: "Salvamentos", align: "right", render: (row) => formatNumber(row.saves) },
    { key: "engagement", header: "Engajamento", align: "right", render: (row) => formatNumber(row.engagement) },
    { key: "engagementRate", header: "Taxa de engajamento", align: "right", render: (row) => formatPercent(row.engagementRate) },
  ];

  return <DataTable columns={columns} data={posts} getRowId={(row) => row.id} emptyMessage="Nenhum conteúdo publicado no período." />;
}
