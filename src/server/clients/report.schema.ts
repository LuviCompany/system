import { z } from "zod";

import { REPORT_METRIC_DEFS, REPORT_SECTION_DEFS } from "@/modules/clientes/constants";

const sectionKeys = REPORT_SECTION_DEFS.map((s) => s.key) as [string, ...string[]];
const metricKeys = REPORT_METRIC_DEFS.map((m) => m.key) as [string, ...string[]];

export const reportInputSchema = z.object({
  clientId: z.string().min(1, "Selecione um cliente."),
  title: z.string().trim().min(1, "Informe um título para o relatório."),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  platforms: z.array(z.enum(["META_ADS", "GOOGLE_ADS"])).min(1, "Selecione ao menos uma plataforma."),
  sections: z
    .array(z.object({ key: z.enum(sectionKeys), order: z.number().int(), enabled: z.boolean() }))
    .min(1),
  metrics: z.array(z.object({ key: z.enum(metricKeys), enabled: z.boolean() })).min(1),
});

export type ReportInput = z.infer<typeof reportInputSchema>;
