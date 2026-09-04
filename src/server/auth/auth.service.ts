import { z } from "zod";

import { prisma } from "@/server/db/prisma";

import { verifyPassword } from "./password";
import { createSessionToken, type SessionPayload } from "./session";

export const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export class InvalidCredentialsError extends Error {
  constructor() {
    super("E-mail ou senha inválidos.");
    this.name = "InvalidCredentialsError";
  }
}

export class UserInactiveError extends Error {
  constructor() {
    super("Este usuário está desativado. Fale com um administrador.");
    this.name = "UserInactiveError";
  }
}

/**
 * Autentica um usuário e retorna um token de sessão assinado.
 * Lança InvalidCredentialsError sem distinguir "usuário não existe" de
 * "senha incorreta", para não vazar quais e-mails estão cadastrados.
 */
export async function login(input: LoginInput): Promise<string> {
  const { email, password } = loginSchema.parse(input);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new InvalidCredentialsError();
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new InvalidCredentialsError();
  }

  if (!user.active) {
    throw new UserInactiveError();
  }

  const payload: SessionPayload = {
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role,
    name: user.name,
    email: user.email,
  };

  return createSessionToken(payload);
}
