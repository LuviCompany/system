import type { Metadata } from "next";

import { CsvImportWizard } from "@/components/import/csv-import-wizard";

export const metadata: Metadata = { title: "Importar Leads" };

export default function ImportarLeadsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Importar Leads</h1>
        <p className="text-sm text-ink-500">
          Envie uma planilha CSV para importar leads em lote. Duplicados são detectados por CNPJ, site, telefone ou e-mail.
        </p>
      </div>

      <CsvImportWizard />
    </div>
  );
}
