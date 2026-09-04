import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LogoFull } from "@/components/brand/logo";
import { PrintButton } from "@/components/clientes/print-button";
import { ReportContent } from "@/components/clientes/report-content";
import { requireSession } from "@/server/auth/session";
import { buildReportData } from "@/server/clients/report.service";

export const metadata: Metadata = { title: "Exportar relatório em PDF" };

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Página de exportação em PDF (etapa 24) — layout próprio (sem sidebar/header
 * do dashboard), pronto para impressão/"Salvar como PDF" do navegador:
 * funciona igualmente bem para impressão, WhatsApp, e-mail ou apresentação.
 */
export default async function RelatorioPdfPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireSession();
  const data = await buildReportData(session.organizationId, id);
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-canvas px-4 py-8 print:bg-white print:p-0">
      <style>{`
        @media print {
          @page { size: A4; margin: 16mm; }
          body { background: white !important; }
        }
      `}</style>
      <div className="mx-auto max-w-3xl print:hidden">
        <div className="mb-4 flex items-center justify-between">
          <LogoFull className="h-8" />
          <PrintButton />
        </div>
      </div>
      <div className="mx-auto max-w-3xl rounded-lg border border-border bg-surface p-8 shadow-card print:max-w-none print:rounded-none print:border-0 print:bg-white print:p-0 print:shadow-none">
        <ReportContent data={data} />
      </div>
    </div>
  );
}
