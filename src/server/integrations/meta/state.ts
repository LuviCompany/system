import { jwtVerify, SignJWT } from "jose";

/**
 * Assinatura do `state` do OAuth da Meta — mesmo padrão de
 * server/integrations/google-ads/state.ts (não compartilhado em código de
 * propósito: cada integração deve poder evoluir sem acoplar uma na outra).
 */

const STATE_TTL_SECONDS = 60 * 10;

export interface MetaOAuthState {
  organizationId: string;
  clientId: string;
  userId: string;
  /** Qual produto Meta este fluxo está conectando — Ads ou Instagram (escopos diferentes). */
  scope: "ads" | "instagram";
}

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET não está definido.");
  }
  return new TextEncoder().encode(secret);
}

export async function signMetaOAuthState(payload: MetaOAuthState): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${STATE_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifyMetaOAuthState(token: string): Promise<MetaOAuthState | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const { organizationId, clientId, userId, scope } = payload as Record<string, unknown>;
    if (
      typeof organizationId !== "string" ||
      typeof clientId !== "string" ||
      typeof userId !== "string" ||
      (scope !== "ads" && scope !== "instagram")
    ) {
      return null;
    }
    return { organizationId, clientId, userId, scope };
  } catch {
    return null;
  }
}
