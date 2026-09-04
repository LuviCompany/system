"use client";

import { CheckCircle2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { LoadingState } from "@/components/ui/loading-state";
import { CSV_COLUMNS, parseLeadsCsv, type CsvLeadRow } from "@/modules/leads/csv";
import { checkDuplicatesAction, importLeadsAction } from "@/server/leads/import-actions";
import type { ImportRowResult } from "@/server/leads/import.service";

type Step = "upload" | "checking" | "preview" | "importing" | "done";

const STATUS_LABEL: Record<ImportRowResult["status"], { label: string; variant: "success" | "warning" | "danger" }> = {
  new: { label: "Novo", variant: "success" },
  duplicate: { label: "Duplicado", variant: "warning" },
  invalid: { label: "Inválido", variant: "danger" },
};

export function CsvImportWizard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportRowResult[]>([]);
  const [summary, setSummary] = useState<{ imported: number; skipped: number } | null>(null);

  async function handleFile(file: File) {
    setError(null);
    const text = await file.text();
    const { rows: parsedRows, headerErrors } = parseLeadsCsv(text);

    if (headerErrors.length > 0) {
      setError(headerErrors[0]);
      return;
    }
    if (parsedRows.length === 0) {
      setError("O arquivo não contém nenhuma linha de dados.");
      return;
    }

    setStep("checking");
    const result = await checkDuplicatesAction(parsedRows);
    if (!result.ok) {
      setError(result.error);
      setStep("upload");
      return;
    }
    setRows(result.data);
    setStep("preview");
  }

  async function handleConfirmImport() {
    setStep("importing");
    const result = await importLeadsAction(rows as CsvLeadRow[]);
    if (result.ok) {
      setSummary(result.data);
      setStep("done");
      router.refresh();
    } else {
      setError(result.error);
      setStep("preview");
    }
  }

  function reset() {
    setStep("upload");
    setRows([]);
    setSummary(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const columns: DataTableColumn<ImportRowResult>[] = [
    { key: "row", header: "Linha", width: "70px", render: (row) => row.rowNumber },
    { key: "company", header: "Empresa", render: (row) => row.company || "—" },
    { key: "email", header: "E-mail", render: (row) => row.email ?? "—" },
    { key: "cnpj", header: "CNPJ", render: (row) => row.cnpj ?? "—" },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const status = STATUS_LABEL[row.status];
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
    {
      key: "reason",
      header: "Observação",
      render: (row) => row.duplicateReason ?? row.validationError ?? "—",
    },
  ];

  const newCount = rows.filter((r) => r.status === "new").length;
  const duplicateCount = rows.filter((r) => r.status === "duplicate").length;
  const invalidCount = rows.filter((r) => r.status === "invalid").length;

  return (
    <div className="space-y-6">
      {step === "upload" && (
        <div className="rounded-lg border border-dashed border-border-strong bg-surface p-8 text-center">
          <Upload className="mx-auto h-8 w-8 text-ink-400" aria-hidden />
          <p className="mt-3 text-sm font-medium text-ink-800">Envie um arquivo CSV com os leads</p>
          <p className="mt-1 text-xs text-ink-500">
            Colunas esperadas: {CSV_COLUMNS.join(", ")}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            id="csv-file-input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <label htmlFor="csv-file-input">
            <Button asChild className="mt-4">
              <span>Selecionar arquivo</span>
            </Button>
          </label>
          {error && (
            <p role="alert" className="mt-4 rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-600">
              {error}
            </p>
          )}
        </div>
      )}

      {step === "checking" && <LoadingState label="Verificando duplicados..." />}

      {step === "preview" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="success">{newCount} novos</Badge>
            <Badge variant="warning">{duplicateCount} duplicados</Badge>
            <Badge variant="danger">{invalidCount} inválidos</Badge>
          </div>

          <DataTable columns={columns} data={rows} getRowId={(row) => String(row.rowNumber)} />

          {error && (
            <p role="alert" className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-600">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={reset}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmImport} disabled={newCount === 0}>
              Importar {newCount} lead{newCount === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      )}

      {step === "importing" && <LoadingState label="Importando leads..." />}

      {step === "done" && summary && (
        <div className="rounded-lg border border-border bg-surface p-8 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-success-500" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-ink-900">Importação concluída</p>
          <p className="mt-1 text-sm text-ink-600">
            {summary.imported} lead{summary.imported === 1 ? "" : "s"} importado{summary.imported === 1 ? "" : "s"}, {summary.skipped} ignorado{summary.skipped === 1 ? "" : "s"} (duplicados ou inválidos).
          </p>
          <Button className="mt-4" variant="outline" onClick={reset}>
            Importar outro arquivo
          </Button>
        </div>
      )}
    </div>
  );
}
