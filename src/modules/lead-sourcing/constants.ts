export const ENRICHMENT_FIELD_LABELS: Record<string, string> = {
  WEBSITE: "Site",
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
  PHONE: "Telefone",
  EMAIL: "E-mail",
  SEGMENT: "Segmento",
  CITY: "Cidade",
  STATE: "Estado",
  EMPLOYEES: "Funcionários",
  REVENUE_ESTIMATE: "Faturamento estimado",
  AD_ACTIVITY: "Investimento em tráfego",
  DIGITAL_PRESENCE: "Presença digital",
  TECHNOLOGY_STACK: "Stack de tecnologia",
  RATING: "Avaliação",
  USER_RATING_COUNT: "Número de avaliações",
};

export type SearchResultStatusValue = "NEW" | "DUPLICATE" | "IMPORTED";

export const RESULT_STATUS_LABELS: Record<SearchResultStatusValue, string> = {
  NEW: "Novo",
  DUPLICATE: "Já existe no CRM",
  IMPORTED: "Importado",
};

export const RESULT_STATUS_BADGE_VARIANT: Record<SearchResultStatusValue, "brand" | "warning" | "success"> = {
  NEW: "brand",
  DUPLICATE: "warning",
  IMPORTED: "success",
};
