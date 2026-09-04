/**
 * Única porta de entrada para a chave da API do Google Places — nunca lida
 * fora deste arquivo. A chave só existe no servidor (variável de ambiente,
 * nunca em código, nunca no client bundle) e nunca é logada ou devolvida ao
 * cliente (ver client.ts).
 */
export function getGoogleMapsApiKey(): string | undefined {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  return key && key.trim().length > 0 ? key.trim() : undefined;
}

export function isGooglePlacesConfigured(): boolean {
  return Boolean(getGoogleMapsApiKey());
}
