"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/server/auth/session";
import type { ActionResult } from "@/server/leads/actions";

import { GooglePlacesError } from "./google-places/errors";
import { leadSearchImportInputSchema, leadSearchInputSchema } from "./schema";
import {
  enrichLeadSearchResult,
  importLeadSearchResults,
  runLeadSearch,
  type ImportLeadSearchResultsSummary,
  type LeadSearchResultForClient,
  type LeadSearchRunResult,
} from "./search.service";

function friendlyErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof GooglePlacesError) return error.friendlyMessage;
  console.error("[lead-sourcing] erro inesperado:", error);
  return fallback;
}

export async function searchLeadSourceAction(input: unknown): Promise<ActionResult<LeadSearchRunResult>> {
  const session = await requireSession();
  const parsed = leadSearchInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados de busca inválidos." };
  }

  try {
    const result = await runLeadSearch(session, parsed.data);
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: friendlyErrorMessage(error, "Não foi possível concluir a busca. Tente novamente.") };
  }
}

export async function addLeadSearchResultsToCrmAction(input: unknown): Promise<ActionResult<ImportLeadSearchResultsSummary>> {
  const session = await requireSession();
  const parsed = leadSearchImportInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Seleção inválida." };
  }

  const summary = await importLeadSearchResults(
    session.organizationId,
    session.userId,
    parsed.data.queryId,
    parsed.data.resultIds,
  );

  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/qualificacao");
  revalidatePath("/dashboard");
  revalidatePath("/encontrar-leads");

  return { ok: true, data: summary };
}

export async function enrichLeadSearchResultAction(resultId: string): Promise<ActionResult<LeadSearchResultForClient>> {
  const session = await requireSession();
  try {
    const result = await enrichLeadSearchResult(session.organizationId, resultId);
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: friendlyErrorMessage(error, "Não foi possível enriquecer este lead. Tente novamente.") };
  }
}
