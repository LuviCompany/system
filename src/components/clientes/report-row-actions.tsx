"use client";

import { Copy, Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { deleteReportAction, duplicateReportAction } from "@/server/clients/report.actions";

export function ReportRowActions({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon" asChild title="Visualizar">
        <Link href={`/clientes/relatorios/${reportId}`}>
          <Eye className="h-4 w-4" aria-hidden />
        </Link>
      </Button>
      <Button variant="ghost" size="icon" asChild title="Editar">
        <Link href={`/clientes/relatorios/${reportId}/editar`}>
          <Pencil className="h-4 w-4" aria-hidden />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        title="Duplicar"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await duplicateReportAction(reportId);
            if (result.ok) router.push(`/clientes/relatorios/${result.data.id}/editar`);
          })
        }
      >
        <Copy className="h-4 w-4" aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        title="Excluir"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            if (!confirm("Excluir este relatório?")) return;
            await deleteReportAction(reportId);
            router.refresh();
          })
        }
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
}
