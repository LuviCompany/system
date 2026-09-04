"use server";

import { revalidatePath } from "next/cache";

import type { CsvLeadRow } from "@/modules/leads/csv";
import { requireSession } from "@/server/auth/session";
import type { ActionResult } from "@/server/leads/actions";

import { checkDuplicates, importLeadRows, type ImportRowResult, type ImportSummary } from "./import.service";

export async function checkDuplicatesAction(rows: CsvLeadRow[]): Promise<ActionResult<ImportRowResult[]>> {
  const session = await requireSession();
  const results = await checkDuplicates(session.organizationId, rows);
  return { ok: true, data: results };
}

export async function importLeadsAction(rows: CsvLeadRow[]): Promise<ActionResult<ImportSummary>> {
  const session = await requireSession();
  const summary = await importLeadRows(session.organizationId, session.userId, rows);
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  return { ok: true, data: summary };
}
