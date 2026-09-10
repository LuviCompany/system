import { z } from "zod";

import { prisma } from "@/server/db/prisma";

/**
 * "Perfil" aqui é só o que o próprio usuário pode editar de si mesmo — nome.
 * Diferente de server/team/team.service.ts (um ADMIN editando outro
 * usuário: papel, ativo/inativo), aqui não há campo de role/active porque
 * o próprio usuário nunca deve poder se promover.
 */
export const updateProfileNameSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome."),
});

export type UpdateProfileNameInput = z.infer<typeof updateProfileNameSchema>;

export async function updateOwnName(userId: string, input: UpdateProfileNameInput) {
  return prisma.user.update({
    where: { id: userId },
    data: { name: input.name },
    select: { id: true, name: true, email: true, role: true },
  });
}
