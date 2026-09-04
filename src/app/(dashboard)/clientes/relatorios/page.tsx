import { FileBarChart, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ReportRowActions } from "@/components/clientes/report-row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";
import { requireSession } from "@/server/auth/session";
import { listReports, type ReportRecord } from "@/server/clients/report.service";

export const metadata: Metadata = { title: "Relatórios de clientes" };

export default async function ClientesRelatoriosPage() {
  const session = await requireSession();
  const reports = await listReports(session.organizationId);

  const columns: DataTableColumn<ReportRecord>[] = [
    { key: "title", header: "Relatório", render: (row) => <span className="font-medium text-ink-900">{row.title}</span> },
    { key: "client", header: "Cliente", render: (row) => row.client.tradeName ?? row.client.name },
    { key: "period", header: "Período", render: (row) => `${formatDate(row.periodStart)} — ${formatDate(row.periodEnd)}` },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge variant={row.status === "PRONTO" ? "success" : "neutral"}>{row.status === "PRONTO" ? "Pronto" : "Rascunho"}</Badge>,
    },
    { key: "updatedAt", header: "Atualizado em", render: (row) => formatDate(row.updatedAt) },
    { key: "actions", header: "", align: "right", render: (row) => <ReportRowActions reportId={row.id} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Relatórios</h1>
          <p className="text-sm text-ink-500">Relatórios de performance por cliente, prontos para exportar em PDF.</p>
        </div>
        <Button asChild>
          <Link href="/clientes/relatorios/novo">
            <Plus className="h-4 w-4" aria-hidden />
            Criar relatório
          </Link>
        </Button>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          icon={FileBarChart}
          title="Nenhum relatório criado ainda."
          description="Crie um relatório escolhendo cliente, período, plataformas e métricas."
        />
      ) : (
        <DataTable columns={columns} data={reports} getRowId={(row) => row.id} />
      )}
    </div>
  );
}
