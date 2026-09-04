import { callGooglePlaces } from "./client";
import { DETAILS_FIELD_MASK } from "./fields";
import { normalizeGooglePlaceDetails, type RawGooglePlaceDetails } from "./normalize";
import type { ProviderBusiness } from "../types";

/**
 * GooglePlacesDetailsService (item 8): busca os campos de contato/avaliação
 * de UM place, só quando explicitamente pedido (botão "Enriquecer") — nunca
 * automaticamente para todos os resultados de uma busca (item 9, custo).
 */
export async function getPlaceDetails(placeId: string): Promise<Partial<ProviderBusiness> | null> {
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;

  const raw = await callGooglePlaces<RawGooglePlaceDetails>(url, {
    method: "GET",
    fieldMask: DETAILS_FIELD_MASK,
  });

  return normalizeGooglePlaceDetails(raw);
}
