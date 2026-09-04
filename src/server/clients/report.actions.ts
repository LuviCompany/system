"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/server/auth/session";

import { reportInputSchema } from "./report.schema";
import { createReport, deleteReport, duplicateReport, markReportReady, updateReport } from "./report.service";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export async function createReportAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  const parsed = reportInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const report = await createReport(session.organizationId, parsed.data);
  revalidatePath("/clientes/relatorios");
  return { ok: true, data: { id: report.id } };
}

export async function updateReportAction(reportId: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  const parsed = reportInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const report = await updateReport(session.organizationId, reportId, parsed.data);
  revalidatePath("/clientes/relatorios");
  revalidatePath(`/clientes/relatorios/${reportId}`);
  return { ok: true, data: { id: report.id } };
}

export async function duplicateReportAction(reportId: string): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  const report = await duplicateReport(session.organizationId, reportId);
  revalidatePath("/clientes/relatorios");
  return { ok: true, data: { id: report.id } };
}

export async function markReportReadyAction(reportId: string): Promise<ActionResult> {
  const session = await requireSession();
  await markReportReady(session.organizationId, reportId);
  revalidatePath("/clientes/relatorios");
  revalidatePath(`/clientes/relatorios/${reportId}`);
  return { ok: true, data: undefined };
}

export async function deleteReportAction(reportId: string): Promise<ActionResult> {
  const session = await requireSession();
  await deleteReport(session.organizationId, reportId);
  revalidatePath("/clientes/relatorios");
  return { ok: true, data: undefined };
}
