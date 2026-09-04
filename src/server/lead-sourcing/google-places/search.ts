import { callGooglePlaces } from "./client";
import { SEARCH_FIELD_MASK } from "./fields";
import { normalizeGooglePlace, type RawGooglePlace } from "./normalize";
import type { ProviderBusiness } from "../types";

const SEARCH_TEXT_URL = "https://places.googleapis.com/v1/places:searchText";
/** Máximo de resultados por página aceito pela Places API (New) Text Search. */
const PAGE_SIZE = 20;
/**
 * Trava dura de segurança — nunca mais que isso, mesmo que a quantidade
 * pedida fosse maior (item 7: "não fazer loops infinitos"). Nossa própria UI
 * já limita a quantidade a 10/20/30/50, então 3 páginas (até 60) sempre cobre.
 */
const MAX_PAGES = 3;
/** Pequena pausa antes de usar um `pageToken` — o token pode não ficar válido instantaneamente. */
const PAGE_TOKEN_DELAY_MS = 300;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface TextSearchParams {
  segment?: string;
  city?: string;
  state?: string;
  keyword?: string;
  quantity: number;
}

/**
 * Monta a consulta em texto livre a partir dos campos do formulário (item 6):
 * "segmento (+ palavra-chave) em cidade, UF". Sem cidade/estado, busca só o
 * assunto; sem segmento nem palavra-chave, cai num termo genérico.
 */
export function buildTextQuery({ segment, city, state, keyword }: TextSearchParams): string {
  const subject = [segment, keyword].filter(Boolean).join(" ").trim() || "empresas";
  const location = [city, state].filter(Boolean).join(", ");
  return location ? `${subject} em ${location}` : subject;
}

interface SearchTextResponse {
  places?: RawGooglePlace[];
  nextPageToken?: string;
}

/**
 * Text Search (New) com paginação limitada e segura. Devolve `ProviderBusiness[]`
 * já normalizados — nenhum campo de contato/avaliação é pedido aqui (ver
 * fields.ts): isso é enriquecimento sob demanda, separado (details.ts).
 */
export async function searchTextPlaces(params: TextSearchParams): Promise<ProviderBusiness[]> {
  const query = buildTextQuery(params);
  const quantity = Math.min(params.quantity, 50);

  const rawResults: RawGooglePlace[] = [];
  let pageToken: string | undefined;
  let pages = 0;

  do {
    if (pageToken) await sleep(PAGE_TOKEN_DELAY_MS);

    const body: Record<string, unknown> = {
      textQuery: query,
      languageCode: "pt-BR",
      regionCode: "BR",
      maxResultCount: Math.min(PAGE_SIZE, quantity - rawResults.length),
    };
    if (pageToken) body.pageToken = pageToken;

    const response = await callGooglePlaces<SearchTextResponse>(SEARCH_TEXT_URL, {
      method: "POST",
      fieldMask: SEARCH_FIELD_MASK,
      body,
    });

    rawResults.push(...(response.places ?? []));
    pageToken = response.nextPageToken;
    pages += 1;
  } while (pageToken && rawResults.length < quantity && pages < MAX_PAGES);

  const segment = params.segment?.trim() || null;
  return rawResults.slice(0, quantity).map((raw) => normalizeGooglePlace(raw, segment));
}
