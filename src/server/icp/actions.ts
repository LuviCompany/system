"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/server/auth/session";
import type { ActionResult } from "@/server/leads/actions";

import {
  activateIcpProfile,
  createIcpProfile,
  deleteIcpProfile,
  icpProfileInputSchema,
  updateIcpProfile,
} from "./icp.service";

function revalidateIcpPaths() {
  revalidatePath("/icp");
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/qualificacao");
  revalidatePath("/dashboard");
}

export async function createIcpProfileAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  const parsed = icpProfileInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const profile = await createIcpProfile(session.organizationId, parsed.data);
  revalidateIcpPaths();
  return { ok: true, data: { id: profile.id } };
}

export async function updateIcpProfileAction(id: string, input: unknown): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = icpProfileInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await updateIcpProfile(session.organizationId, id, parsed.data);
  revalidateIcpPaths();
  return { ok: true, data: undefined };
}

export async function deleteIcpProfileAction(id: string): Promise<ActionResult> {
  const session = await requireSession();
  await deleteIcpProfile(session.organizationId, id);
  revalidateIcpPaths();
  return { ok: true, data: undefined };
}

export async function activateIcpProfileAction(id: string): Promise<ActionResult> {
  const session = await requireSession();
  await activateIcpProfile(session.organizationId, id);
  revalidateIcpPaths();
  return { ok: true, data: undefined };
}
