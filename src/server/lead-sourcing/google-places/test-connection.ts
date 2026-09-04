import { callGooglePlaces } from "./client";
import { isGooglePlacesConfigured } from "./config";
import { GooglePlacesError, GOOGLE_PLACES_NOT_CONFIGURED_MESSAGE } from "./errors";
import { SEARCH_FIELD_MASK } from "./fields";

const SEARCH_TEXT_URL = "https://places.googleapis.com/v1/places:searchText";

export interface TestConnectionResult {
  ok: boolean;
  error?: string;
}

/**
 * Botão "Testar conexão" (item 23): uma única consulta controlada e barata
 * (maxResultCount: 1, FieldMask mínimo), sem gravar nada no banco — não é
 * uma busca de verdade, só uma checagem de conectividade/credenciais.
 */
export async function testGooglePlacesConnection(): Promise<TestConnectionResult> {
  if (!isGooglePlacesConfigured()) {
    return { ok: false, error: GOOGLE_PLACES_NOT_CONFIGURED_MESSAGE };
  }

  try {
    await callGooglePlaces(SEARCH_TEXT_URL, {
      method: "POST",
      fieldMask: SEARCH_FIELD_MASK,
      body: {
        textQuery: "empresas em São Paulo",
        languageCode: "pt-BR",
        regionCode: "BR",
        maxResultCount: 1,
      },
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof GooglePlacesError) return { ok: false, error: error.friendlyMessage };
    return { ok: false, error: "Não foi possível conectar ao Google Places." };
  }
}
