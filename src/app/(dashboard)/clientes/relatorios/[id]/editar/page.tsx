import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ReportBuilderForm } from "@/components/clientes/report-builder-form";
import { REPORT_METRIC_DEFS, REPORT_SECTION_DEFS } from "@/modules/clientes/constants";
import { requireSession } from "@/server/auth/session";
import { listClients } from "@/server/clients/client.service";
import { getReportById } from "@/server/clients/report.service";
import { updateReportAction } from "@/server/clients/report.actions";

export const metadata: Metadata = { title: "Editar relatório" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarRelatorioPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireSession();
  const [report, clients] = await Promise.all([getReportById(session.organizationId, id), listClients(session.organizationId)]);
  if (!report) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Editar relatório</h1>
        <p className="text-sm text-ink-500">{report.title}</p>
      </div>
      <ReportBuilderForm
        clients={clients.map((c) => ({ id: c.id, name: c.name, tradeName: c.tradeName }))}
        submitLabel="Salvar alterações"
        initialValues={{
          clientId: report.clientId,
          title: report.title,
          periodStart: report.periodStart.toISOString().slice(0, 10),
          periodEnd: report.periodEnd.toISOString().slice(0, 10),
          platforms: report.platforms,
          sections: report.sections.map((s) => ({
            key: s.key,
            label: REPORT_SECTION_DEFS.find((d) => d.key === s.key)?.label ?? s.key,
            order: s.order,
            enabled: s.enabled,
          })),
          metrics: report.metrics.map((m) => ({
            key: m.key,
            label: REPORT_METRIC_DEFS.find((d) => d.key === m.key)?.label ?? m.key,
            enabled: m.enabled,
          })),
        }}
        onSubmit={updateReportAction.bind(null, id)}
      />
    </div>
  );
}
