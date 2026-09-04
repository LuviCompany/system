/**
 * Camada de abstração para fontes externas de leads (arquitetura preparada
 * nesta etapa — ver ARCHITECTURE.md). Fluxo:
 *
 *   Google Places / fonte externa
 *     -> LeadSourceProvider (provider.ts, escolhe a implementação)
 *     -> normalização (normalize.ts)
 *     -> deduplicação (server/leads/lead.service.ts, findDuplicateLead)
 *     -> qualificação (server/icp/scoring.ts, computeLeadScore — reaproveitado)
 *     -> CRM (server/leads/lead.service.ts, createLead)
 *
 * Nenhuma fonte externa real está implementada ainda: sem credenciais
 * configuradas, `getActiveLeadSourceProvider()` (provider.ts) sempre devolve
 * o provider mock (mock-provider.ts).
 */

export interface SearchProviderParams {
  segment?: string;
  city?: string;
  state?: string;
  keyword?: string;
  quantity: number;
}

/**
 * Dados crus de uma empresa candidata, exatamente como a fonte devolveu.
 * Todo campo é opcional — o provider nunca inventa um valor que não tem;
 * campos ausentes viram NOT_FOUND no enriquecimento (ver enrichment.ts).
 */
export interface ProviderBusiness {
  externalId: string;
  company: string;
  segment: string | null;
  /** Categoria crua da fonte (ex: `primaryType` do Google Places — "dentist"). Informativo, nunca usado para o ICP. */
  type: string | null;
  /** Endereço completo formatado, quando a fonte devolve como string única (ex: `formattedAddress`). */
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  linkedin: string | null;
  email: string | null;
  cnpj: string | null;
  /** Link direto na fonte (ex: `googleMapsUri`) — geralmente só disponível após enriquecimento. */
  sourceUrl: string | null;
  rating: number | null;
  userRatingCount: number | null;
  employees: number | null;
  estimatedRevenue: number | null;
  adSpend: number | null;
  potentialValue: number | null;
  commercialMaturity: number | null;
  marketingNeed: number | null;
  technologyNeed: number | null;
  recurrencePotential: number | null;
  technologyStack: string[] | null;
}

export interface SearchProvider {
  /** Identificador estável — vira `LeadSearchQuery.provider` para auditoria. */
  id: string;
  /** Rótulo humano, usado na coluna "Origem" da tela de resultados. */
  label: string;
  searchBusinesses(params: SearchProviderParams): Promise<ProviderBusiness[]>;
  /**
   * Enriquecimento sob demanda (item 8/11 da Etapa Google Places): devolve
   * só os campos adicionais que conseguiu obter — nunca um objeto completo
   * "reinventado". `null` quando não há nada a acrescentar. O chamador faz
   * merge, preservando o que já existia.
   */
  getBusinessDetails(externalId: string): Promise<Partial<ProviderBusiness> | null>;
}
