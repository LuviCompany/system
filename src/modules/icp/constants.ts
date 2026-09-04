export const ICP_CRITERIA = [
  { value: "SEGMENTO", label: "Segmento", kind: "categorical", field: "segment" },
  { value: "FATURAMENTO", label: "Faturamento estimado", kind: "numeric", field: "estimatedRevenue" },
  { value: "TICKET", label: "Ticket potencial", kind: "numeric", field: "potentialValue" },
  { value: "LOCALIZACAO", label: "Localização", kind: "categorical", field: "state" },
  { value: "SITE", label: "Presença digital — Site", kind: "boolean", field: "website" },
  { value: "INSTAGRAM", label: "Presença digital — Instagram", kind: "boolean", field: "instagram" },
  { value: "INVESTIMENTO_TRAFEGO", label: "Investimento em tráfego", kind: "numeric", field: "adSpend" },
  { value: "MATURIDADE_COMERCIAL", label: "Maturidade comercial", kind: "numeric", field: "commercialMaturity" },
  { value: "NECESSIDADE_MARKETING", label: "Necessidade de marketing", kind: "numeric", field: "marketingNeed" },
  { value: "NECESSIDADE_TECNOLOGIA", label: "Necessidade de tecnologia", kind: "numeric", field: "technologyNeed" },
  { value: "POTENCIAL_RECORRENCIA", label: "Potencial de recorrência", kind: "numeric", field: "recurrencePotential" },
] as const;

export type IcpCriterionTypeValue = (typeof ICP_CRITERIA)[number]["value"];
export const ICP_CRITERION_VALUES = ICP_CRITERIA.map((c) => c.value) as [
  IcpCriterionTypeValue,
  ...IcpCriterionTypeValue[],
];

export const ICP_CRITERION_LABELS: Record<IcpCriterionTypeValue, string> = Object.fromEntries(
  ICP_CRITERIA.map((c) => [c.value, c.label]),
) as Record<IcpCriterionTypeValue, string>;

export const ICP_CRITERION_KIND: Record<IcpCriterionTypeValue, "numeric" | "categorical" | "boolean"> =
  Object.fromEntries(ICP_CRITERIA.map((c) => [c.value, c.kind])) as Record<
    IcpCriterionTypeValue,
    "numeric" | "categorical" | "boolean"
  >;

/** Critérios numéricos que aceitam faixas 0-100 diretas (sem unidade monetária). */
export const ICP_RATING_CRITERIA: IcpCriterionTypeValue[] = [
  "MATURIDADE_COMERCIAL",
  "NECESSIDADE_MARKETING",
  "NECESSIDADE_TECNOLOGIA",
  "POTENCIAL_RECORRENCIA",
];

export const ICP_CRITERIA_UNUSED_SITE_INSTAGRAM: IcpCriterionTypeValue[] = ["SITE", "INSTAGRAM"];

export type PriorityValue = "BAIXA" | "MEDIA" | "ALTA" | "MAXIMA";

export const PRIORITY_LABELS: Record<PriorityValue, string> = {
  BAIXA: "Baixa prioridade",
  MEDIA: "Média prioridade",
  ALTA: "Alta prioridade",
  MAXIMA: "Prioridade máxima",
};

export const PRIORITY_BADGE_VARIANT: Record<PriorityValue, "neutral" | "warning" | "success" | "brand"> = {
  BAIXA: "neutral",
  MEDIA: "warning",
  ALTA: "success",
  MAXIMA: "brand",
};

/** Classificação determinística por faixa de score — ver ARCHITECTURE.md. */
export function classifyScore(score: number): PriorityValue {
  if (score >= 85) return "MAXIMA";
  if (score >= 70) return "ALTA";
  if (score >= 40) return "MEDIA";
  return "BAIXA";
}

export const DEFAULT_RULE_TEMPLATES: Record<
  string,
  { label: string; min: number | null; max: number | null; score: number }[]
> = {
  FATURAMENTO: [
    { label: "Até R$ 50 mil", min: 0, max: 50000, score: 25 },
    { label: "R$ 50 mil – R$ 200 mil", min: 50000, max: 200000, score: 55 },
    { label: "R$ 200 mil – R$ 500 mil", min: 200000, max: 500000, score: 80 },
    { label: "Acima de R$ 500 mil", min: 500000, max: null, score: 100 },
  ],
  TICKET: [
    { label: "Até R$ 1 mil/mês", min: 0, max: 1000, score: 25 },
    { label: "R$ 1 mil – R$ 3 mil/mês", min: 1000, max: 3000, score: 55 },
    { label: "R$ 3 mil – R$ 8 mil/mês", min: 3000, max: 8000, score: 80 },
    { label: "Acima de R$ 8 mil/mês", min: 8000, max: null, score: 100 },
  ],
  INVESTIMENTO_TRAFEGO: [
    { label: "Não investe", min: 0, max: 0, score: 15 },
    { label: "Até R$ 2 mil", min: 0.01, max: 2000, score: 45 },
    { label: "R$ 2 mil – R$ 10 mil", min: 2000, max: 10000, score: 75 },
    { label: "Acima de R$ 10 mil", min: 10000, max: null, score: 100 },
  ],
  MATURIDADE_COMERCIAL: [
    { label: "Baixa", min: 0, max: 25, score: 20 },
    { label: "Média", min: 25, max: 50, score: 50 },
    { label: "Alta", min: 50, max: 75, score: 75 },
    { label: "Muito alta", min: 75, max: 100, score: 100 },
  ],
  NECESSIDADE_MARKETING: [
    { label: "Baixa", min: 0, max: 25, score: 20 },
    { label: "Média", min: 25, max: 50, score: 50 },
    { label: "Alta", min: 50, max: 75, score: 75 },
    { label: "Muito alta", min: 75, max: 100, score: 100 },
  ],
  NECESSIDADE_TECNOLOGIA: [
    { label: "Baixa", min: 0, max: 25, score: 20 },
    { label: "Média", min: 25, max: 50, score: 50 },
    { label: "Alta", min: 50, max: 75, score: 75 },
    { label: "Muito alta", min: 75, max: 100, score: 100 },
  ],
  POTENCIAL_RECORRENCIA: [
    { label: "Baixo", min: 0, max: 25, score: 20 },
    { label: "Médio", min: 25, max: 50, score: 50 },
    { label: "Alto", min: 50, max: 75, score: 75 },
    { label: "Muito alto", min: 75, max: 100, score: 100 },
  ],
};
