import type {
  AdPlatform,
  CampaignStatus,
  ClientHealthStatus,
  ClientStatus,
  IntegrationPlatform,
  IntegrationStatus,
  SocialContentType,
  SocialPlatform,
} from "@prisma/client";

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  ATIVO: "Ativo",
  PAUSADO: "Pausado",
  ENCERRADO: "Encerrado",
};

export const CLIENT_HEALTH_LABELS: Record<ClientHealthStatus, string> = {
  SAUDAVEL: "Saudável",
  ATENCAO: "Atenção",
  CRITICO: "Crítico",
};

export const CLIENT_HEALTH_BADGE_VARIANT: Record<ClientHealthStatus, "success" | "warning" | "danger"> = {
  SAUDAVEL: "success",
  ATENCAO: "warning",
  CRITICO: "danger",
};

export const AD_PLATFORM_LABELS: Record<AdPlatform, string> = {
  META_ADS: "Meta Ads",
  GOOGLE_ADS: "Google Ads",
};

export const INTEGRATION_PLATFORM_LABELS: Record<IntegrationPlatform, string> = {
  META_ADS: "Meta Ads",
  GOOGLE_ADS: "Google Ads",
  INSTAGRAM: "Instagram",
  GOOGLE_ANALYTICS: "Google Analytics",
};

export const INTEGRATION_STATUS_LABELS: Record<IntegrationStatus, string> = {
  CONECTADO: "Conectado",
  NAO_CONECTADO: "Não conectado",
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  ATIVA: "Ativa",
  PAUSADA: "Pausada",
  ENCERRADA: "Encerrada",
};

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  TIKTOK: "TikTok",
  LINKEDIN: "LinkedIn",
};

export const SOCIAL_CONTENT_TYPE_LABELS: Record<SocialContentType, string> = {
  IMAGEM: "Imagem",
  VIDEO: "Vídeo",
  CARROSSEL: "Carrossel",
  REELS: "Reels",
  STORY: "Story",
};

export const CLIENT_SEGMENTS = [
  "Moda",
  "Alimentício",
  "Saúde",
  "Educação",
  "Imobiliário",
  "Fitness",
  "Beleza e Estética",
  "Serviços",
  "Tecnologia",
  "E-commerce",
] as const;

export type PeriodPreset = "hoje" | "7dias" | "30dias" | "este_mes" | "mes_anterior" | "personalizado";

export const PERIOD_PRESET_LABELS: Record<PeriodPreset, string> = {
  hoje: "Hoje",
  "7dias": "7 dias",
  "30dias": "30 dias",
  este_mes: "Este mês",
  mes_anterior: "Mês anterior",
  personalizado: "Personalizado",
};

/** Seções disponíveis para compor um relatório (etapa 22), na ordem padrão. */
export const REPORT_SECTION_DEFS = [
  { key: "resumo", label: "Resumo" },
  { key: "meta_ads", label: "Meta Ads" },
  { key: "google_ads", label: "Google Ads" },
  { key: "funil", label: "Funil" },
  { key: "campanhas", label: "Campanhas" },
  { key: "anuncios", label: "Anúncios" },
  { key: "social_media", label: "Social Media" },
  { key: "insights", label: "Insights" },
  { key: "conclusao", label: "Conclusão" },
] as const;

export type ReportSectionKey = (typeof REPORT_SECTION_DEFS)[number]["key"];

/** Métricas configuráveis (checkboxes) disponíveis para um relatório (etapa 21). */
export const REPORT_METRIC_DEFS = [
  { key: "investimento", label: "Investimento" },
  { key: "alcance", label: "Alcance" },
  { key: "impressoes", label: "Impressões" },
  { key: "cliques", label: "Cliques" },
  { key: "ctr", label: "CTR" },
  { key: "cpc", label: "CPC" },
  { key: "leads", label: "Leads" },
  { key: "cpl", label: "CPL" },
  { key: "oportunidades", label: "Oportunidades" },
  { key: "vendas", label: "Vendas" },
  { key: "cpa", label: "CPA" },
  { key: "receita", label: "Receita" },
  { key: "roas", label: "ROAS" },
  { key: "campanhas", label: "Campanhas" },
  { key: "melhor_campanha", label: "Melhor campanha" },
  { key: "melhor_anuncio", label: "Melhor anúncio" },
  { key: "funil", label: "Funil" },
  { key: "social_media", label: "Social Media" },
  { key: "melhor_conteudo", label: "Melhor conteúdo" },
  { key: "insights", label: "Insights" },
] as const;

export type ReportMetricKey = (typeof REPORT_METRIC_DEFS)[number]["key"];

export const DEFAULT_REPORT_METRIC_KEYS: ReportMetricKey[] = [
  "investimento",
  "alcance",
  "cliques",
  "leads",
  "vendas",
  "receita",
  "roas",
  "melhor_campanha",
  "melhor_anuncio",
  "funil",
  "insights",
];
