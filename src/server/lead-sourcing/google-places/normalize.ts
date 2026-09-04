import { BRAZIL_STATES } from "@/modules/leads/constants";

import type { ProviderBusiness } from "../types";

const BRAZIL_UF_SET = new Set<string>(BRAZIL_STATES);

export interface RawGooglePlace {
  id: string;
  displayName?: { text: string; languageCode?: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  primaryType?: string;
  types?: string[];
}

export interface RawGooglePlaceDetails {
  id: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
}

/**
 * Endereços do Google no Brasil seguem, em geral, o padrão
 * "..., Bairro, Cidade - UF, CEP, Brasil". Extrai cidade/UF só quando o
 * padrão bate com confiança (UF de 2 letras que existe de fato) — sem match,
 * devolve null em vez de arriscar um dado errado (nunca inventar, item 13).
 */
export function parseCityStateFromAddress(formattedAddress: string | undefined | null): {
  city: string | null;
  state: string | null;
} {
  if (!formattedAddress) return { city: null, state: null };

  const match = formattedAddress.match(/,\s*([^,]+?)\s*-\s*([A-Z]{2})\b/);
  if (!match) return { city: null, state: null };

  const [, city, state] = match;
  if (!BRAZIL_UF_SET.has(state)) return { city: null, state: null };

  return { city: city.trim(), state };
}

/**
 * Converte um resultado cru do Text Search em `ProviderBusiness`. `segment`
 * recebe o termo que o usuário buscou (não um dado do Google) — é o que
 * permite o critério SEGMENTO do ICP continuar funcionando para leads do
 * Google, já que a taxonomia de `primaryType` (inglês, ex: "dentist") não
 * corresponde ao vocabulário de segmento configurado no perfil de ICP.
 * `type` guarda o `primaryType` cru, só para exibição/transparência.
 */
export function normalizeGooglePlace(raw: RawGooglePlace, searchedSegment: string | null): ProviderBusiness {
  const { city, state } = parseCityStateFromAddress(raw.formattedAddress);

  return {
    externalId: raw.id,
    company: raw.displayName?.text?.trim() || "Empresa sem nome",
    segment: searchedSegment,
    type: raw.primaryType ?? null,
    address: raw.formattedAddress ?? null,
    city,
    state,
    phone: null,
    website: null,
    instagram: null,
    linkedin: null,
    email: null,
    cnpj: null,
    sourceUrl: null,
    rating: null,
    userRatingCount: null,
    employees: null,
    estimatedRevenue: null,
    adSpend: null,
    potentialValue: null,
    commercialMaturity: null,
    marketingNeed: null,
    technologyNeed: null,
    recurrencePotential: null,
    technologyStack: null,
  };
}

/** Converte a resposta do Place Details nos campos de enriquecimento — só o que veio, nada mais. */
export function normalizeGooglePlaceDetails(raw: RawGooglePlaceDetails): Partial<ProviderBusiness> {
  return {
    phone: raw.nationalPhoneNumber ?? raw.internationalPhoneNumber ?? null,
    website: raw.websiteUri ?? null,
    sourceUrl: raw.googleMapsUri ?? null,
    rating: typeof raw.rating === "number" ? raw.rating : null,
    userRatingCount: typeof raw.userRatingCount === "number" ? raw.userRatingCount : null,
  };
}
