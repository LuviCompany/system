import { FileText } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Relatórios" };

export default function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Relatórios</h1>
        <p className="text-sm text-ink-500">Relatórios consolidados de performance comercial.</p>
      </div>

      <EmptyState
        icon={FileText}
        title="Seus relatórios aparecerão aqui."
        description="A geração de relatórios de vendas e prospecção será implementada em uma próxima etapa."
      />
    </div>
  );
}
