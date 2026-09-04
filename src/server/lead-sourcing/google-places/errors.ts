/**
 * Erro de domínio para qualquer falha ao chamar o Google Places — sempre
 * carrega uma mensagem amigável em português, pronta para mostrar ao usuário.
 * Nunca inclui a API key nem o corpo cru da resposta do Google (item 24).
 */
export class GooglePlacesError extends Error {
  constructor(
    public friendlyMessage: string,
    public httpStatus?: number,
  ) {
    super(friendlyMessage);
    this.name = "GooglePlacesError";
  }
}

export const GOOGLE_PLACES_NOT_CONFIGURED_MESSAGE =
  "Google Places não configurado. Adicione GOOGLE_MAPS_API_KEY ao ambiente.";

/** Mapeia status HTTP + `error.status` do corpo do Google para uma mensagem amigável (item 18). */
export function friendlyMessageFor(httpStatus: number, googleStatus?: string): string {
  if (httpStatus === 401 || googleStatus === "UNAUTHENTICATED") {
    return "Chave da API do Google Places inválida ou não autorizada.";
  }
  if (httpStatus === 403 || googleStatus === "PERMISSION_DENIED") {
    return "Acesso negado pelo Google Places. Verifique se a \"Places API (New)\" está habilitada e o faturamento ativo no Google Cloud.";
  }
  if (httpStatus === 429 || googleStatus === "RESOURCE_EXHAUSTED") {
    return "Limite de requisições do Google Places atingido. Tente novamente em instantes.";
  }
  if (httpStatus === 400 || googleStatus === "INVALID_ARGUMENT") {
    return "Consulta inválida para o Google Places.";
  }
  if (httpStatus >= 500) {
    return "O Google Places está indisponível no momento. Tente novamente.";
  }
  return "Não foi possível consultar o Google Places. Tente novamente.";
}
