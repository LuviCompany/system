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
  "Integração com a Meta Ads ainda não configurada — faltam variáveis de ambiente (ver docs/meta-ads.md).";

export const META_INSTAGRAM_NOT_IMPLEMENTED_MESSAGE =
  "Integração com o Instagram ainda não implementada — a arquitetura está pronta, mas esta etapa cobre somente Meta Ads.";

export function toMetaError(error: unknown): MetaError {
  if (error instanceof MetaError) return error;
  if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
    return new MetaError("TIMEOUT", "Tempo esgotado ao falar com a Meta. Tente novamente.");
  }
  return new MetaError("UNKNOWN", "Falha inesperada ao falar com a Meta.");
}

/** Corpo de erro típico da Graph API da Meta — mesmo envelope para OAuth e Marketing API. */
interface MetaGraphErrorBody {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
}

/**
 * Mapeia status HTTP + corpo de erro da Graph API para um MetaError amigável.
 * Código 190 (OAuthException) cobre token inválido/expirado/revogado — mesmo
 * papel que `invalid_grant` tem no mapper do Google Ads (exige reconexão).
 */
export function mapMetaGraphError(httpStatus: number, body: MetaGraphErrorBody | undefined): MetaError {
  const code = body?.error?.code;

  if (code === 190 || httpStatus === 401) {
    return new MetaError("INVALID_GRANT", "A autorização da Meta expirou ou foi revogada. É necessário reconectar a conta.", httpStatus);
  }
  if (code === 10 || code === 200 || code === 299 || httpStatus === 403) {
    return new MetaError(
      "PERMISSION_DENIED",
      "Acesso negado pela Meta. Verifique se o app tem a permissão ads_read aprovada e se a conta tem acesso de leitura.",
      httpStatus,
    );
  }
  if (code === 4 || code === 17 || code === 32 || code === 613 || httpStatus === 429) {
    return new MetaError("RATE_LIMITED", "Limite de requisições da Meta atingido. Tente novamente em instantes.", httpStatus);
  }
  if (httpStatus >= 500) {
    return new MetaError("SERVER_ERROR", "A Meta está indisponível no momento. Tente novamente.", httpStatus);
  }
  return new MetaError("UNKNOWN", body?.error?.message ?? "Não foi possível falar com a Meta. Tente novamente.", httpStatus);
}
