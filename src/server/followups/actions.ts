"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/server/auth/session";
import type { ActionResult } from "@/server/leads/actions";

import { completeFollowUp, createFollowUp, followUpInputSchema } from "./followup.service";

export async function createFollowUpAction(input: unknown): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = followUpInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await createFollowUp(session.organizationId, parsed.data);
  revalidatePath("/dashboard");
  revalidatePath("/follow-ups");
  revalidatePath(`/leads/${parsed.data.leadId}`);
  return { ok: true, data: undefined };
}

export async function completeFollowUpAction(id: string): Promise<ActionResult> {
  const session = await requireSession();
  await completeFollowUp(session.organizationId, id);
  revalidatePath("/dashboard");
  revalidatePath("/follow-ups");
  return { ok: true, data: undefined };
}
