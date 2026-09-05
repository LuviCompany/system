/**
 * Erro de domínio para qualquer falha relacionada à integração Meta (Ads ou
 * Instagram) — mesmo formato do `GoogleAdsError`
 * (server/integrations/google-ads/errors.ts), para manter as duas
 * integrações consistentes sem compartilhar código entre plataformas.
 */

export type MetaErrorCode =
  | "NOT_CONFIGURED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "TIMEOUT"
  | "INVALID_GRANT"
  | "PERMISSION_DENIED"
  | "UNKNOWN";

export class MetaError extends Error {
  constructor(
    public code: MetaErrorCode,
    public friendlyMessage: string,
    public httpStatus?: number,
  ) {
    super(friendlyMessage);
    this.name = "MetaError";
  }
}

export const META_NOT_CONFIGURED_MESSAGE =
  "Integração com a Meta (Ads/Instagram) ainda não configurada — esta etapa só prepara a arquitetura, sem credenciais reais.";

export function toMetaError(error: unknown): MetaError {
  if (error instanceof MetaError) return error;
  if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
    return new MetaError("TIMEOUT", "Tempo esgotado ao falar com a Meta. Tente novamente.");
  }
  return new MetaError("UNKNOWN", "Falha inesperada ao falar com a Meta.");
}
