export const PIPELINE_STAGES = [
  { value: "NOVOS", label: "Novos" },
  { value: "QUALIFICADOS", label: "Qualificados" },
  { value: "PROSPECCAO", label: "Prospecção" },
  { value: "CONTATO", label: "Contato" },
  { value: "REUNIAO", label: "Reunião" },
  { value: "PROPOSTA", label: "Proposta" },
  { value: "NEGOCIACAO", label: "Negociação" },
  { value: "GANHO", label: "Ganho" },
  { value: "PERDIDO", label: "Perdido" },
] as const;

export type PipelineStageValue = (typeof PIPELINE_STAGES)[number]["value"];
export const PIPELINE_STAGE_VALUES = PIPELINE_STAGES.map((stage) => stage.value) as [
  PipelineStageValue,
  ...PipelineStageValue[],
];

export const PIPELINE_STAGE_LABELS: Record<PipelineStageValue, string> = Object.fromEntries(
  PIPELINE_STAGES.map((stage) => [stage.value, stage.label]),
) as Record<PipelineStageValue, string>;

export const LEAD_SOURCES = [
  { value: "GOOGLE_MAPS", label: "Google Maps" },
  { value: "GOOGLE_PLACES", label: "Google Places" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "INDICACAO", label: "Indicação" },
  { value: "SITE", label: "Site" },
  { value: "EVENTO", label: "Evento" },
  { value: "IMPORTACAO_CSV", label: "Importação CSV" },
  { value: "BUSCA_EXTERNA", label: "Fonte Externa" },
  { value: "OUTRO", label: "Outro" },
] as const;

export type LeadSourceValue = (typeof LEAD_SOURCES)[number]["value"];
export const LEAD_SOURCE_VALUES = LEAD_SOURCES.map((source) => source.value) as [
  LeadSourceValue,
  ...LeadSourceValue[],
];

export const LEAD_SOURCE_LABELS: Record<LeadSourceValue, string> = Object.fromEntries(
  LEAD_SOURCES.map((source) => [source.value, source.label]),
) as Record<LeadSourceValue, string>;

export const ACTIVITY_TYPES = [
  { value: "LIGACAO", label: "Ligação" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "EMAIL", label: "E-mail" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "REUNIAO", label: "Reunião" },
  { value: "NOTA", label: "Nota" },
  { value: "FOLLOW_UP", label: "Follow-up" },
  { value: "PROPOSTA", label: "Proposta" },
] as const;

export type ActivityTypeValue = (typeof ACTIVITY_TYPES)[number]["value"];
export const ACTIVITY_TYPE_VALUES = ACTIVITY_TYPES.map((type) => type.value) as [
  ActivityTypeValue,
  ...ActivityTypeValue[],
];

export const ACTIVITY_TYPE_LABELS: Record<ActivityTypeValue, string> = Object.fromEntries(
  ACTIVITY_TYPES.map((type) => [type.value, type.label]),
) as Record<ActivityTypeValue, string>;

export const DEFAULT_TAGS = [
  "Alto potencial",
  "E-commerce",
  "Tráfego pago",
  "Site ruim",
  "Sem CRM",
  "Alto ticket",
  "Urgente",
] as const;

export const BRAZIL_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;
