"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/server/auth/session";
import type { ActionResult } from "@/server/leads/actions";

import {
  createTeamMember,
  createUserSchema,
  EmailAlreadyInUseError,
  updateTeamMember,
  updateUserSchema,
} from "./team.service";

export async function createTeamMemberAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole(["ADMIN"]);
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const user = await createTeamMember(session.organizationId, parsed.data);
    revalidatePath("/equipe");
    return { ok: true, data: { id: user.id } };
  } catch (error) {
    if (error instanceof EmailAlreadyInUseError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

export async function updateTeamMemberAction(userId: string, input: unknown): Promise<ActionResult> {
  const session = await requireRole(["ADMIN"]);
  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await updateTeamMember(session.organizationId, userId, parsed.data);
  revalidatePath("/equipe");
  return { ok: true, data: undefined };
}
