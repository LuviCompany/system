import { jwtVerify, SignJWT } from "jose";

/**
 * O parâmetro `state` do OAuth precisa ser opaco e à prova de adulteração —
 * é ele que amarra o callback do Google de volta ao cliente/organização
 * corretos (nunca confiar em query params soltos vindos do navegador para
 * isso). Reaproveita o mesmo padrão de assinatura JWT de server/auth/session.ts,
 * com expiração curta (só precisa sobreviver ao tempo do usuário na tela de
 * consentimento do Google).
 */

const STATE_TTL_SECONDS = 60 * 10; // 10 minutos

export interface GoogleAdsOAuthState {
  organizationId: string;
  clientId: string;
  userId: string;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET não está definido.");
  }
  return new TextEncoder().encode(secret);
}

export async function signOAuthState(payload: GoogleAdsOAuthState): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${STATE_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifyOAuthState(token: string): Promise<GoogleAdsOAuthState | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const { organizationId, clientId, userId } = payload as Record<string, unknown>;
    if (typeof organizationId !== "string" || typeof clientId !== "string" || typeof userId !== "string") {
      return null;
    }
    return { organizationId, clientId, userId };
  } catch {
    return null;
  }
}
