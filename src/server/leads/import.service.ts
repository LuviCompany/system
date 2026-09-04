import type { CsvLeadRow } from "@/modules/leads/csv";

import { createLead, findDuplicateLead } from "./lead.service";

export interface ImportRowResult extends CsvLeadRow {
  status: "new" | "duplicate" | "invalid";
  duplicateReason?: string;
}

/** Marca cada linha como nova, duplicada (por CNPJ/site/telefone/e-mail) ou inválida. */
export async function checkDuplicates(organizationId: string, rows: CsvLeadRow[]): Promise<ImportRowResult[]> {
  const results: ImportRowResult[] = [];

  for (const row of rows) {
    if (!row.isValid) {
      results.push({ ...row, status: "invalid" });
      continue;
    }

    const duplicate = await findDuplicateLead(organizationId, {
      cnpj: row.cnpj,
      website: row.website,
      phone: row.phone,
      email: row.email,
    });

    if (duplicate) {
      results.push({
        ...row,
        status: "duplicate",
        duplicateReason: `Já existe um lead com os mesmos dados: "${duplicate.company}".`,
      });
    } else {
      results.push({ ...row, status: "new" });
    }
  }

  return results;
}

export interface ImportSummary {
  imported: number;
  skipped: number;
}

/** Importa somente as linhas marcadas como "new" pelo cliente (após revisão do usuário). */
export async function importLeadRows(
  organizationId: string,
  actorUserId: string,
  rows: CsvLeadRow[],
): Promise<ImportSummary> {
  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row.isValid) {
      skipped += 1;
      continue;
    }

    const duplicate = await findDuplicateLead(organizationId, {
      cnpj: row.cnpj,
      website: row.website,
      phone: row.phone,
      email: row.email,
    });
    if (duplicate) {
      skipped += 1;
      continue;
    }

    await createLead(organizationId, actorUserId, {
      company: row.company,
      contactName: row.contactName,
      position: row.position,
      cnpj: row.cnpj,
      phone: row.phone,
      whatsapp: row.whatsapp,
      email: row.email,
      website: row.website,
      instagram: row.instagram,
      linkedin: row.linkedin,
      city: row.city,
      state: row.state,
      segment: row.segment,
      source: row.source,
      notes: row.notes,
      stage: "NOVOS",
      tagIds: [],
    });
    imported += 1;
  }

  return { imported, skipped };
}
