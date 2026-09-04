import type { Metadata } from "next";

import { ReportBuilderForm } from "@/components/clientes/report-builder-form";
import { requireSession } from "@/server/auth/session";
import { listClients } from "@/server/clients/client.service";
import { createReportAction } from "@/server/clients/report.actions";

export const metadata: Metadata = { title: "Criar relatório" };

export default async function NovoRelatorioPage() {
  const session = await requireSession();
  const clients = await listClients(session.organizationId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Criar relatório</h1>
        <p className="text-sm text-ink-500">Selecione o cliente, o período, as plataformas, as seções e as métricas do relatório.</p>
      </div>
      <ReportBuilderForm
        clients={clients.map((c) => ({ id: c.id, name: c.name, tradeName: c.tradeName }))}
        onSubmit={createReportAction}
      />
    </div>
  );
}
