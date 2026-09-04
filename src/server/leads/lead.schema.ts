import { z } from "zod";

import { LEAD_SOURCE_VALUES, PIPELINE_STAGE_VALUES } from "@/modules/leads/constants";

const PRIORITY_VALUES = ["BAIXA", "MEDIA", "ALTA", "MAXIMA"] as const;

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);
const optionalNumber = () => z.preprocess(emptyToUndefined, z.coerce.number().optional());
const optionalRating = () => z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).max(100).optional());

export const leadInputSchema = z.object({
  company: z.string().trim().min(1, "Informe o nome da empresa."),
  contactName: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  position: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  cnpj: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  phone: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  whatsapp: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  email: z.preprocess(emptyToUndefined, z.string().trim().email("E-mail inválido.").optional()),
  website: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  instagram: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  linkedin: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  city: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  state: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  segment: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  source: z.enum(LEAD_SOURCE_VALUES).default("OUTRO"),
  responsavelId: z.preprocess(emptyToUndefined, z.string().optional()),
  potentialValue: optionalNumber(),
  stage: z.enum(PIPELINE_STAGE_VALUES).default("NOVOS"),
  notes: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  tagIds: z.array(z.string()).optional().default([]),

  // Referência à fonte externa (ex: Google Places) — não é um campo do
  // formulário manual de lead, só preenchido pelo fluxo de Encontrar Leads.
  externalId: z.preprocess(emptyToUndefined, z.string().optional()),
  sourceUrl: z.preprocess(emptyToUndefined, z.string().optional()),

  // Dados usados pelo motor de pontuação de ICP (server/icp/scoring.ts).
  // O icpScore em si NÃO é mais um campo de formulário — é calculado
  // automaticamente a partir destes dados sempre que o lead é salvo.
  estimatedRevenue: optionalNumber(),
  adSpend: optionalNumber(),
  commercialMaturity: optionalRating(),
  marketingNeed: optionalRating(),
  technologyNeed: optionalRating(),
  recurrencePotential: optionalRating(),
});

export type LeadInput = z.infer<typeof leadInputSchema>;

export const leadFiltersSchema = z.object({
  search: z.string().optional(),
  stage: z.enum(PIPELINE_STAGE_VALUES).optional(),
  source: z.enum(LEAD_SOURCE_VALUES).optional(),
  responsavelId: z.string().optional(),
  tagId: z.string().optional(),
  priority: z.enum(PRIORITY_VALUES).optional(),
  scoreMin: z.coerce.number().int().min(0).max(100).optional(),
  scoreMax: z.coerce.number().int().min(0).max(100).optional(),
});

export type LeadFilters = z.infer<typeof leadFiltersSchema>;
