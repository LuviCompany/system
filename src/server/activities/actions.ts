"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/server/auth/session";
import type { ActionResult } from "@/server/leads/actions";

import { activityInputSchema, createActivity } from "./activity.service";

export async function createActivityAction(input: unknown): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = activityInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await createActivity(session.organizationId, session.userId, parsed.data);
  revalidatePath(`/leads/${parsed.data.leadId}`);
  revalidatePath("/atividades");
  return { ok: true, data: undefined };
}
