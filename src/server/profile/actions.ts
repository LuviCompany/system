"use server";

import { createSessionToken, requireSession, setSessionCookie } from "@/server/auth/session";
import type { ActionResult } from "@/server/leads/actions";

import { updateOwnName, updateProfileNameSchema } from "./profile.service";

/**
 * Depois de salvar o nome novo, reemite o cookie de sessão com o nome
 * atualizado. A sessão é um JWT sem estado (server/auth/session.ts não
 * consulta o banco a cada request) — sem reemitir o cookie, o Header
 * continuaria mostrando o nome antigo até o usuário relogar.
 */
export async function updateProfileNameAction(input: unknown): Promise<ActionResult<{ name: string }>> {
  const session = await requireSession();
  const parsed = updateProfileNameSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const updated = await updateOwnName(session.userId, parsed.data);

  const token = await createSessionToken({
    userId: session.userId,
    organizationId: session.organizationId,
    role: session.role,
    name: updated.name,
    email: session.email,
  });
  await setSessionCookie(token);

  return { ok: true, data: { name: updated.name } };
}
