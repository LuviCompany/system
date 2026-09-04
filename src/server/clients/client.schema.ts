import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const clientInputSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do cliente."),
  tradeName: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  cnpj: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  website: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  instagram: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  segment: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  email: z.preprocess(emptyToUndefined, z.string().trim().email("E-mail inválido.").optional()),
  phone: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  responsavelId: z.preprocess(emptyToUndefined, z.string().optional()),
  status: z.enum(["ATIVO", "PAUSADO", "ENCERRADO"]).default("ATIVO"),
});

export type ClientInput = z.infer<typeof clientInputSchema>;

export const clientFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ATIVO", "PAUSADO", "ENCERRADO"]).optional(),
  health: z.enum(["SAUDAVEL", "ATENCAO", "CRITICO"]).optional(),
  segment: z.string().optional(),
  platform: z.enum(["META_ADS", "GOOGLE_ADS"]).optional(),
});

export type ClientFilters = z.infer<typeof clientFiltersSchema>;
