import { z } from "zod";

import { prisma } from "@/server/db/prisma";
import { hashPassword } from "@/server/auth/password";

const ROLE_VALUES = ["ADMIN", "GESTOR", "VENDEDOR"] as const;

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome."),
  email: z.string().trim().email("E-mail inválido."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
  role: z.enum(ROLE_VALUES),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome."),
  role: z.enum(ROLE_VALUES),
  active: z.coerce.boolean(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export class EmailAlreadyInUseError extends Error {
  constructor() {
    super("Já existe um usuário com este e-mail.");
    this.name = "EmailAlreadyInUseError";
  }
}

export async function listTeamMembers(organizationId: string) {
  return prisma.user.findMany({
    where: { organizationId },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function createTeamMember(organizationId: string, input: CreateUserInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new EmailAlreadyInUseError();
  }

  const passwordHash = await hashPassword(input.password);
  return prisma.user.create({
    data: {
      organizationId,
      name: input.name,
      email: input.email,
      role: input.role,
      passwordHash,
    },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });
}

export async function updateTeamMember(organizationId: string, id: string, input: UpdateUserInput) {
  await prisma.user.findFirstOrThrow({ where: { id, organizationId } });
  return prisma.user.update({
    where: { id },
    data: input,
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });
}
