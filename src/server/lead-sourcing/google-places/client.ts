import { getGoogleMapsApiKey } from "./config";
import { friendlyMessageFor, GooglePlacesError, GOOGLE_PLACES_NOT_CONFIGURED_MESSAGE } from "./errors";

const REQUEST_TIMEOUT_MS = 10_000;

interface CallOptions {
  method: "GET" | "POST";
  fieldMask: string;
  body?: unknown;
}

/**
 * Único ponto do projeto que efetivamente chama a Places API (New). Sempre
 * envia a chave via header `X-Goog-Api-Key` (nunca em query string, nunca no
 * corpo) e nunca a expõe em erros/logs devolvidos ao chamador — só o status
 * e a mensagem amigável saem daqui.
 */
export async function callGooglePlaces<T>(url: string, options: CallOptions): Promise<T> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    throw new GooglePlacesError(GOOGLE_PLACES_NOT_CONFIGURED_MESSAGE);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: options.method,
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": options.fieldMask,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      let googleStatus: string | undefined;
      try {
        const errorBody = (await response.json()) as { error?: { status?: string; message?: string } };
        googleStatus = errorBody.error?.status;
        console.error("[google-places] erro da API:", response.status, googleStatus, errorBody.error?.message);
      } catch {
        console.error("[google-places] erro da API sem corpo JSON:", response.status);
      }
      throw new GooglePlacesError(friendlyMessageFor(response.status, googleStatus), response.status);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof GooglePlacesError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new GooglePlacesError("Tempo de resposta do Google Places excedido. Tente novamente.");
    }
    console.error("[google-places] falha de rede:", error);
    throw new GooglePlacesError("Não foi possível conectar ao Google Places. Verifique sua conexão e tente novamente.");
  } finally {
    clearTimeout(timeout);
  }
}
