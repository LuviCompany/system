import { isGooglePlacesConfigured } from "./google-places/config";
import { googlePlacesProvider } from "./google-places/provider";
import { mockSearchProvider } from "./mock-provider";
import type { SearchProvider } from "./types";

const PROVIDERS: Record<string, SearchProvider> = {
  [googlePlacesProvider.id]: googlePlacesProvider,
  [mockSearchProvider.id]: mockSearchProvider,
};

/**
 * Ponto único de escolha do provider de busca de leads. Usa o Google Places
 * real sempre que `GOOGLE_MAPS_API_KEY` estiver configurada; sem a chave,
 * cai automaticamente para o provider mock (modo demonstração, item 26 —
 * nunca quebra o sistema). Quando uma nova fonte for integrada, ela
 * implementa `SearchProvider` e entra na escolha aqui; nenhum outro código
 * do app (search.service.ts, actions.ts, UI) precisa mudar.
 */
export function getActiveLeadSourceProvider(): SearchProvider {
  return isGooglePlacesConfigured() ? googlePlacesProvider : mockSearchProvider;
}

/**
 * Recupera um provider por id (usado no enriquecimento: um resultado precisa
 * ser reconsultado com O MESMO provider que o gerou, mesmo que a configuração
 * ativa tenha mudado desde a busca original).
 */
export function getLeadSourceProviderById(id: string): SearchProvider | null {
  return PROVIDERS[id] ?? null;
}
