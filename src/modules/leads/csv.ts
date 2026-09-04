import Papa from "papaparse";

import { LEAD_SOURCE_VALUES, type LeadSourceValue } from "@/modules/leads/constants";

export const CSV_COLUMNS = [
  "company_name",
  "contact_name",
  "position",
  "cnpj",
  "phone",
  "whatsapp",
  "email",
  "website",
  "instagram",
  "linkedin",
  "city",
  "state",
  "segment",
  "source",
  "score",
  "notes",
] as const;

export interface CsvLeadRow {
  rowNumber: number;
  company: string;
  contactName?: string;
  position?: string;
  cnpj?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  instagram?: string;
  linkedin?: string;
  city?: string;
  state?: string;
  segment?: string;
  source: LeadSourceValue;
  icpScore: number;
  notes?: string;
  isValid: boolean;
  validationError?: string;
}

function clean(value: unknown): string | undefined {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : undefined;
}

function parseSource(value: unknown): LeadSourceValue {
  const text = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  return (LEAD_SOURCE_VALUES as readonly string[]).includes(text) ? (text as LeadSourceValue) : "IMPORTACAO_CSV";
}

function parseScore(value: unknown): number {
  const parsed = Number.parseInt(String(value ?? "0"), 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(100, Math.max(0, parsed));
}

export interface ParseCsvResult {
  rows: CsvLeadRow[];
  headerErrors: string[];
}

/** Parser puro (roda no navegador para o preview e no servidor para a importação final). */
export function parseLeadsCsv(fileContent: string): ParseCsvResult {
  const result = Papa.parse<Record<string, string>>(fileContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  const headerErrors: string[] = [];
  const foundHeaders = result.meta.fields ?? [];
  if (!foundHeaders.includes("company_name")) {
    headerErrors.push('A coluna obrigatória "company_name" não foi encontrada no arquivo.');
  }

  const rows: CsvLeadRow[] = result.data.map((raw, index) => {
    const company = clean(raw.company_name);
    return {
      rowNumber: index + 2, // +1 pelo cabeçalho, +1 por índice base 1
      company: company ?? "",
      contactName: clean(raw.contact_name),
      position: clean(raw.position),
      cnpj: clean(raw.cnpj),
      phone: clean(raw.phone),
      whatsapp: clean(raw.whatsapp),
      email: clean(raw.email),
      website: clean(raw.website),
      instagram: clean(raw.instagram),
      linkedin: clean(raw.linkedin),
      city: clean(raw.city),
      state: clean(raw.state),
      segment: clean(raw.segment),
      source: parseSource(raw.source),
      icpScore: parseScore(raw.score),
      notes: clean(raw.notes),
      isValid: Boolean(company),
      validationError: company ? undefined : "Empresa (company_name) é obrigatória.",
    };
  });

  return { rows, headerErrors };
}
