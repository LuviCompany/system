import { z } from "zod";

import { prisma } from "@/server/db/prisma";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const organizationInputSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da organização."),
  domain: z.preprocess(emptyToUndefined, z.string().trim().optional()),
});

export type OrganizationInput = z.infer<typeof organizationInputSchema>;

export async function getOrganization(organizationId: string) {
  return prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });
}

export async function updateOrganization(organizationId: string, input: OrganizationInput) {
  return prisma.organization.update({ where: { id: organizationId }, data: input });
}
