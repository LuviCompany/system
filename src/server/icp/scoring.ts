import type { Prisma } from "@prisma/client";

import { classifyScore, ICP_CRITERION_LABELS, type IcpCriterionTypeValue, type PriorityValue } from "@/modules/icp/constants";

const icpProfileWithRulesInclude = {
  criteria: { include: { rules: { orderBy: { order: "asc" } } } },
} satisfies Prisma.IcpProfileInclude;

export type IcpProfileWithRules = Prisma.IcpProfileGetPayload<{ include: typeof icpProfileWithRulesInclude }>;
export const icpProfileScoringInclude = icpProfileWithRulesInclude;

export interface ScoreFactorResult {
  type: IcpCriterionTypeValue;
  label: string;
  weight: number;
  rawScore: number;
  contribution: number;
}

export interface ScoreResult {
  score: number;
  priority: PriorityValue;
  factors: ScoreFactorResult[];
}

/**
 * Formato mínimo que o motor de pontuação precisa de um "lead" para calcular
 * o score — satisfeito estruturalmente pelo `Lead` do Prisma (leads já no
 * CRM) e também por candidatos ainda não persistidos (resultados de busca em
 * /encontrar-leads, ver server/lead-sourcing). Isso permite pontuar os dois
 * casos com a MESMA função, sem duplicar a lógica de scoring.
 */
export interface ScorableLeadInput {
  website: string | null;
  instagram: string | null;
  segment: string | null;
  state: string | null;
  estimatedRevenue: Prisma.Decimal | number | null;
  potentialValue: Prisma.Decimal | number | null;
  adSpend: Prisma.Decimal | number | null;
  commercialMaturity: number | null;
  marketingNeed: number | null;
  technologyNeed: number | null;
  recurrencePotential: number | null;
}

function toNumber(value: Prisma.Decimal | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return typeof value === "number" ? value : Number(value);
}

function getLeadNumericValue(lead: ScorableLeadInput, type: IcpCriterionTypeValue): number | null {
  switch (type) {
    case "FATURAMENTO":
      return toNumber(lead.estimatedRevenue);
    case "TICKET":
      return toNumber(lead.potentialValue);
    case "INVESTIMENTO_TRAFEGO":
      return toNumber(lead.adSpend);
    case "MATURIDADE_COMERCIAL":
      return lead.commercialMaturity ?? null;
    case "NECESSIDADE_MARKETING":
      return lead.marketingNeed ?? null;
    case "NECESSIDADE_TECNOLOGIA":
      return lead.technologyNeed ?? null;
    case "POTENCIAL_RECORRENCIA":
      return lead.recurrencePotential ?? null;
    default:
      return null;
  }
}

function getLeadCategoricalValue(lead: ScorableLeadInput, type: IcpCriterionTypeValue): string | null {
  if (type === "SEGMENTO") return lead.segment;
  if (type === "LOCALIZACAO") return lead.state;
  return null;
}

function getLeadBooleanValue(lead: ScorableLeadInput, type: IcpCriterionTypeValue): boolean {
  if (type === "SITE") return Boolean(lead.website && lead.website.trim().length > 0);
  if (type === "INSTAGRAM") return Boolean(lead.instagram && lead.instagram.trim().length > 0);
  return false;
}

/**
 * Pontuação (0-100) de um lead num único critério, de acordo com as regras
 * configuradas no perfil de ICP. Determinístico — mesma entrada, mesma saída.
 */
function scoreCriterionForLead(
  lead: ScorableLeadInput,
  criterion: IcpProfileWithRules["criteria"][number],
): number {
  const type = criterion.type as IcpCriterionTypeValue;

  if (type === "SITE" || type === "INSTAGRAM") {
    return getLeadBooleanValue(lead, type) ? 100 : 0;
  }

  if (type === "SEGMENTO" || type === "LOCALIZACAO") {
    const value = getLeadCategoricalValue(lead, type);
    if (!value) return 0;
    const normalized = value.trim().toLowerCase();
    const match = criterion.rules.find((rule) =>
      rule.matchValues.some((candidate) => candidate.trim().toLowerCase() === normalized),
    );
    return match?.score ?? 0;
  }

  // Critérios numéricos (faturamento, ticket, investimento, e as 4 dimensões 0-100).
  const value = getLeadNumericValue(lead, type);
  if (value === null) return 0;

  const match = criterion.rules.find((rule) => {
    const min = rule.minValue !== null ? Number(rule.minValue) : null;
    const max = rule.maxValue !== null ? Number(rule.maxValue) : null;
    const aboveMin = min === null || value >= min;
    const belowMax = max === null || value < max;
    return aboveMin && belowMax;
  });
  return match?.score ?? 0;
}

/**
 * Calcula o ICP Score de um lead a partir de um perfil de ICP configurado.
 * Puro e determinístico: nenhuma chamada externa, nenhuma IA — apenas pesos
 * e regras cadastrados manualmente (ver /icp).
 */
export function computeLeadScore(lead: ScorableLeadInput, profile: IcpProfileWithRules): ScoreResult {
  let weightedSum = 0;
  let weightTotal = 0;
  const factors: ScoreFactorResult[] = [];

  for (const criterion of profile.criteria) {
    const weight = criterion.weight;
    if (weight <= 0) continue;

    const rawScore = scoreCriterionForLead(lead, criterion);
    weightedSum += weight * rawScore;
    weightTotal += weight;

    factors.push({
      type: criterion.type as IcpCriterionTypeValue,
      label: ICP_CRITERION_LABELS[criterion.type as IcpCriterionTypeValue],
      weight,
      rawScore,
      contribution: 0, // preenchido abaixo, depois de conhecermos weightTotal
    });
  }

  const score = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : 0;

  for (const factor of factors) {
    factor.contribution = weightTotal > 0 ? Math.round((factor.weight * factor.rawScore) / weightTotal) : 0;
  }

  return { score, priority: classifyScore(score), factors };
}
