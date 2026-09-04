import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE = "luvi_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 dias

export type UserRole = "ADMIN" | "GESTOR" | "VENDEDOR";

export interface SessionPayload {
  userId: string;
  organizationId: string;
  role: UserRole;
  name: string;
  email: string;
}

function isUserRole(value: unknown): value is UserRole {
  return value === "ADMIN" || value === "GESTOR" || value === "VENDEDOR";
}

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET não está definido. Configure-o em .env antes de emitir sessões.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const { userId, organizationId, role, name, email } = payload as Record<string, unknown>;
    if (
      typeof userId !== "string" ||
      typeof organizationId !== "string" ||
      !isUserRole(role) ||
      typeof name !== "string" ||
      typeof email !== "string"
    ) {
      return null;
    }
    return { userId, organizationId, role, name, email };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Para uso em Server Components/Pages dentro de rotas protegidas.
 * O `proxy.ts` já bloqueia o acesso não autenticado antes de chegar aqui;
 * esta função é a segunda camada de defesa (ex: token expirado entre a
 * verificação do proxy e o render da página).
 */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/** Garante que a sessão atual tenha um dos papéis informados; caso contrário, redireciona. */
export async function requireRole(roles: UserRole[], redirectTo = "/dashboard"): Promise<SessionPayload> {
  const session = await requireSession();
  if (!roles.includes(session.role)) {
    redirect(redirectTo);
  }
  return session;
}
