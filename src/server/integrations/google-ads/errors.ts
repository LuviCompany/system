/**
 * Erro de domínio para qualquer falha ao chamar o Google Ads (OAuth ou API de
 * relatórios) — sempre carrega uma mensagem amigável em português. NUNCA
 * inclui client secret, developer token, access token ou refresh token (etapa
 * 20/24) — só o texto amigável e um `code` categorizando a falha.
 */

export type GoogleAdsErrorCode =
  | "NOT_CONFIGURED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "TIMEOUT"
  | "INVALID_GRANT"
  | "PERMISSION_DENIED"
  | "UNKNOWN";

export class GoogleAdsError extends Error {
  constructor(
    public code: GoogleAdsErrorCode,
    public friendlyMessage: string,
    public httpStatus?: number,
  ) {
    super(friendlyMessage);
    this.name = "GoogleAdsError";
  }
}

export const GOOGLE_ADS_NOT_CONFIGURED_MESSAGE =
  "Integração com Google Ads não configurada. Faltam variáveis de ambiente (ver docs/google-ads.md).";

/** Corpo de erro típico da API REST do Google Ads. */
interface GoogleAdsApiErrorBody {
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

/** Corpo de erro típico do endpoint OAuth (/token). */
interface GoogleOAuthErrorBody {
  error?: string;
  error_description?: string;
}

/** Mapeia status HTTP + corpo da resposta do Google Ads (relatórios) para um GoogleAdsError amigável (etapa 20). */
export function mapGoogleAdsApiError(httpStatus: number, body: GoogleAdsApiErrorBody | undefined): GoogleAdsError {
  const status = body?.error?.status;

  if (httpStatus === 401 || status === "UNAUTHENTICATED") {
    return new GoogleAdsError("UNAUTHORIZED", "Sessão do Google Ads expirada ou inválida. Reconecte a conta.", httpStatus);
  }
  if (httpStatus === 403 || status === "PERMISSION_DENIED") {
    return new GoogleAdsError(
      "PERMISSION_DENIED",
      "Acesso negado pelo Google Ads. Verifique se o developer token está aprovado e se a conta escolhida tem permissão de leitura.",
      httpStatus,
    );
  }
  if (httpStatus === 429 || status === "RESOURCE_EXHAUSTED") {
    return new GoogleAdsError("RATE_LIMITED", "Limite de requisições do Google Ads atingido. Tente novamente em instantes.", httpStatus);
  }
  if (httpStatus >= 500) {
    return new GoogleAdsError("SERVER_ERROR", "O Google Ads está indisponível no momento. Tente novamente.", httpStatus);
  }
  return new GoogleAdsError("UNKNOWN", "Não foi possível consultar o Google Ads. Tente novamente.", httpStatus);
}

/** Mapeia erros do endpoint OAuth (troca/renovação de token) — trata especialmente `invalid_grant`. */
export function mapGoogleOAuthError(httpStatus: number, body: GoogleOAuthErrorBody | undefined): GoogleAdsError {
  if (body?.error === "invalid_grant") {
    return new GoogleAdsError(
      "INVALID_GRANT",
      "A autorização do Google Ads expirou ou foi revogada. É necessário reconectar a conta.",
      httpStatus,
    );
  }
  if (httpStatus === 401) {
    return new GoogleAdsError("UNAUTHORIZED", "Credenciais OAuth do Google Ads inválidas.", httpStatus);
  }
  if (httpStatus >= 500) {
    return new GoogleAdsError("SERVER_ERROR", "O Google está indisponível no momento. Tente novamente.", httpStatus);
  }
  return new GoogleAdsError("UNKNOWN", "Não foi possível autenticar com o Google Ads.", httpStatus);
}

export function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
}

export function toGoogleAdsError(error: unknown): GoogleAdsError {
  if (error instanceof GoogleAdsError) return error;
  if (isTimeoutError(error)) {
    return new GoogleAdsError("TIMEOUT", "Tempo esgotado ao falar com o Google Ads. Tente novamente.");
  }
  return new GoogleAdsError("UNKNOWN", "Falha inesperada ao falar com o Google Ads.");
}
