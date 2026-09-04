import type { PeriodComparison } from "./types";

export interface Insight {
  tone: "positivo" | "negativo" | "neutro";
  text: string;
}

/**
 * Motor de insights 100% determinístico baseado em regras sobre a variação
 * das métricas do período atual vs. anterior. Nenhuma IA generativa é usada
 * nesta etapa — cada frase só aparece quando a condição numérica é satisfeita.
 */
export function buildInsights(comparison: PeriodComparison): Insight[] {
  const { variation, current } = comparison;
  const insights: Insight[] = [];

  if (variation.roas !== null && variation.roas > 5) {
    insights.push({ tone: "positivo", text: "ROAS apresentou evolução positiva no período." });
  } else if (variation.roas !== null && variation.roas < -5) {
    insights.push({ tone: "negativo", text: "ROAS apresentou queda no período — vale revisar segmentação e criativos." });
  }

  if (variation.cpl !== null && variation.cpl < -5) {
    insights.push({ tone: "positivo", text: "O custo por lead apresentou redução." });
  } else if (variation.cpl !== null && variation.cpl > 15) {
    insights.push({ tone: "negativo", text: "O custo por lead subiu de forma relevante no período." });
  }

  if (variation.investment !== null && variation.investment > 5 && (variation.revenue === null || variation.revenue < 5)) {
    insights.push({
      tone: "negativo",
      text: "Atenção: investimento aumentou sem crescimento proporcional de receita.",
    });
  }

  if (variation.leads !== null && variation.leads > 10) {
    insights.push({ tone: "positivo", text: "Volume de leads cresceu de forma consistente no período." });
  }

  if (variation.ctr !== null && variation.ctr > 10) {
    insights.push({ tone: "positivo", text: "CTR médio melhorou, indicando criativos mais relevantes para o público." });
  } else if (variation.ctr !== null && variation.ctr < -10) {
    insights.push({ tone: "negativo", text: "CTR médio caiu — recomenda-se testar novos criativos." });
  }

  if (variation.sales !== null && variation.sales > 10) {
    insights.push({ tone: "positivo", text: "Número de vendas cresceu no período em relação ao anterior." });
  } else if (variation.sales !== null && variation.sales < -10) {
    insights.push({ tone: "negativo", text: "Número de vendas caiu no período em relação ao anterior." });
  }

  if (current.roas >= 4) {
    insights.push({ tone: "positivo", text: "ROAS do período está em patamar saudável (acima de 4x)." });
  } else if (current.roas > 0 && current.roas < 1.5) {
    insights.push({ tone: "negativo", text: "ROAS do período está abaixo do ponto de equilíbrio recomendado." });
  }

  if (insights.length === 0) {
    insights.push({ tone: "neutro", text: "Performance estável no período, sem variações relevantes a destacar." });
  }

  return insights;
}
