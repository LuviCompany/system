import { z } from "zod";

import { ACTIVITY_TYPE_VALUES } from "@/modules/leads/constants";
import { prisma } from "@/server/db/prisma";

export const activityInputSchema = z.object({
  leadId: z.string().min(1),
  type: z.enum(ACTIVITY_TYPE_VALUES),
  description: z.string().trim().min(1, "Descreva a atividade."),
});

export type ActivityInput = z.infer<typeof activityInputSchema>;

export async function createActivity(organizationId: string, userId: string, input: ActivityInput) {
  return prisma.activity.create({
    data: { organizationId, userId, ...input },
  });
}

export async function listActivitiesForLead(organizationId: string, leadId: string) {
  return prisma.activity.findMany({
    where: { organizationId, leadId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function listRecentActivities(organizationId: string, limit = 50) {
  return prisma.activity.findMany({
    where: { organizationId },
    include: {
      user: { select: { id: true, name: true } },
      lead: { select: { id: true, company: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
