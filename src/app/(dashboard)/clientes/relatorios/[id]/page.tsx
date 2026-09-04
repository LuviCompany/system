import { Download, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MarkReportReadyButton } from "@/components/clientes/mark-report-ready-button";
import { ReportContent } from "@/components/clientes/report-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireSession } from "@/server/auth/session";
import { buildReportData } from "@/server/clients/report.service";

export const metadata: Metadata = { title: "Preview do relatório" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RelatorioPreviewPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireSession();
  const data = await buildReportData(session.organizationId, id);
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-ink-900">Preview do relatório</h1>
          <Badge variant={data.report.status === "PRONTO" ? "success" : "neutral"}>
            {data.report.status === "PRONTO" ? "Pronto" : "Rascunho"}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/clientes/relatorios/${id}/editar`}>
              <Pencil className="h-4 w-4" aria-hidden />
              Editar
            </Link>
          </Button>
          <MarkReportReadyButton reportId={id} isReady={data.report.status === "PRONTO"} />
          <Button asChild>
            <Link href={`/clientes/relatorios/${id}/pdf`} target="_blank">
              <Download className="h-4 w-4" aria-hidden />
              Exportar PDF
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-8">
          <ReportContent data={data} />
        </CardContent>
      </Card>
    </div>
  );
}
