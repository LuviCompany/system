/**
 * Camada centralizada de FieldMask — o único lugar do projeto que decide
 * quais campos são pedidos ao Google Places (item 9: "não espalhar FieldMask
 * pelo projeto"). Dois conjuntos, deliberadamente separados:
 *
 *  - SEARCH: identificação mínima do estabelecimento (busca inicial, barata).
 *    `nextPageToken` é técnico (necessário para paginação, item 7), não é
 *    "dado" do negócio.
 *  - DETAILS: contato/avaliação, obtido só sob demanda por lead (botão
 *    "Enriquecer", item 8/9/11) — nunca disparado automaticamente para todos
 *    os resultados de uma busca.
 */
export const SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.primaryType",
  "places.types",
  "nextPageToken",
].join(",");

export const DETAILS_FIELD_MASK = [
  "id",
  "nationalPhoneNumber",
  "internationalPhoneNumber",
  "websiteUri",
  "googleMapsUri",
  "rating",
  "userRatingCount",
].join(",");
