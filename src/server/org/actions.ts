"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/server/auth/session";
import type { ActionResult } from "@/server/leads/actions";

import { organizationInputSchema, updateOrganization } from "./org.service";

export async function updateOrganizationAction(input: unknown): Promise<ActionResult> {
  const session = await requireRole(["ADMIN"]);
  const parsed = organizationInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await updateOrganization(session.organizationId, parsed.data);
  revalidatePath("/configuracoes");
  return { ok: true, data: undefined };
}
