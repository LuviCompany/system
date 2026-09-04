import { computeLeadScore, type IcpProfileWithRules, type ScoreFactorResult } from "@/server/icp/scoring";

import type { ProviderBusiness } from "./types";

export interface BusinessScoreResult {
  score: number;
  priority: "BAIXA" | "MEDIA" | "ALTA" | "MAXIMA";
  factors: ScoreFactorResult[];
}

/**
 * Ponte entre `ProviderBusiness` (resultado de busca/enriquecimento, ainda
 * fora do CRM) e `computeLeadScore` (server/icp/scoring.ts — o MESMO motor
 * usado pelos leads reais, via `ScorableLeadInput`). Usado tanto na busca
 * inicial quanto depois de um enriquecimento (o site pode ter mudado de
 * null para um valor, afetando o critério SITE) — um só lugar, sem duplicar
 * a lógica de pontuação.
 */
export function scoreBusiness(business: ProviderBusiness, profile: IcpProfileWithRules | null): BusinessScoreResult {
  if (!profile) return { score: 0, priority: "BAIXA", factors: [] };

  return computeLeadScore(
    {
      website: business.website,
      instagram: business.instagram,
      segment: business.segment,
      state: business.state,
      estimatedRevenue: business.estimatedRevenue,
      potentialValue: business.potentialValue,
      adSpend: business.adSpend,
      commercialMaturity: business.commercialMaturity,
      marketingNeed: business.marketingNeed,
      technologyNeed: business.technologyNeed,
      recurrencePotential: business.recurrencePotential,
    },
    profile,
  );
}
