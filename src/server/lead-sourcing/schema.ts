import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

/** Limite configurável — nunca pedimos mais que isso à fonte de uma vez (item 7). */
export const SEARCH_QUANTITY_OPTIONS = [10, 20, 30, 50] as const;

export const leadSearchInputSchema = z.object({
  segment: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  city: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  state: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  keyword: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  quantity: z.coerce.number().int().refine((v) => SEARCH_QUANTITY_OPTIONS.includes(v as (typeof SEARCH_QUANTITY_OPTIONS)[number]), {
    message: "Quantidade inválida.",
  }).default(20),
  icpProfileId: z.preprocess(emptyToUndefined, z.string().optional()),
});

export type LeadSearchInput = z.infer<typeof leadSearchInputSchema>;

export const leadSearchImportInputSchema = z.object({
  queryId: z.string().min(1),
  resultIds: z.array(z.string()).min(1, "Selecione ao menos um lead para adicionar."),
});

export type LeadSearchImportInput = z.infer<typeof leadSearchImportInputSchema>;
