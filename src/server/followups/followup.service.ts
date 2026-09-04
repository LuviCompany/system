import { z } from "zod";

import { prisma } from "@/server/db/prisma";
import type { SessionPayload } from "@/server/auth/session";

export const followUpInputSchema = z.object({
  leadId: z.string().min(1),
  scheduledAt: z.coerce.date(),
  note: z.string().trim().optional(),
  responsavelId: z.string().min(1),
});

export type FollowUpInput = z.infer<typeof followUpInputSchema>;

function scopeToViewer(viewer: SessionPayload) {
  return viewer.role === "VENDEDOR" ? { responsavelId: viewer.userId } : {};
}

export async function createFollowUp(organizationId: string, input: FollowUpInput) {
  const followUp = await prisma.followUp.create({ data: { organizationId, ...input } });
  await prisma.lead.update({
    where: { id: input.leadId },
    data: { nextFollowUpAt: input.scheduledAt },
  });
  return followUp;
}

export async function completeFollowUp(organizationId: string, id: string) {
  return prisma.followUp.update({
    where: { id },
    data: { status: "CONCLUIDO" },
  });
}

export async function listFollowUps(organizationId: string, viewer: SessionPayload) {
  return prisma.followUp.findMany({
    where: { organizationId, ...scopeToViewer(viewer) },
    include: {
      lead: { select: { id: true, company: true } },
      responsavel: { select: { id: true, name: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });
}

export async function listTodayAndOverdueFollowUps(organizationId: string, viewer: SessionPayload) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const pending = await prisma.followUp.findMany({
    where: {
      organizationId,
      ...scopeToViewer(viewer),
      status: "PENDENTE",
      scheduledAt: { lte: endOfToday },
    },
    include: {
      lead: { select: { id: true, company: true } },
      responsavel: { select: { id: true, name: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  const today = pending.filter((item) => item.scheduledAt >= startOfToday);
  const overdue = pending.filter((item) => item.scheduledAt < startOfToday);

  return { today, overdue };
}
