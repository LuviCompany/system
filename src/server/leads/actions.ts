"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/server/auth/session";
import { listActivitiesForLead } from "@/server/activities/activity.service";
import { listFollowUps } from "@/server/followups/followup.service";
import { prisma } from "@/server/db/prisma";

import { leadInputSchema } from "./lead.schema";
import { createLead, getLeadById, moveLeadStage, updateLead, type LeadWithRelations } from "./lead.service";
import type { PipelineStageValue } from "@/modules/leads/constants";
import type { Activity, FollowUp, LeadScoreFactor, User } from "@prisma/client";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export interface LeadDetail {
  lead: LeadWithRelations;
  activities: (Activity & { user: Pick<User, "id" | "name"> })[];
  followUps: (FollowUp & { responsavel: Pick<User, "id" | "name"> })[];
  scoreFactors: LeadScoreFactor[];
}

export async function getLeadDetailAction(leadId: string): Promise<ActionResult<LeadDetail>> {
  const session = await requireSession();
  const lead = await getLeadById(session.organizationId, session, leadId);
  if (!lead) {
    return { ok: false, error: "Lead não encontrado." };
  }

  const [activities, allFollowUps, leadScore] = await Promise.all([
    listActivitiesForLead(session.organizationId, leadId),
    listFollowUps(session.organizationId, session),
    prisma.leadScore.findUnique({ where: { leadId }, include: { factors: true } }),
  ]);

  return {
    ok: true,
    data: {
      lead,
      activities,
      followUps: allFollowUps.filter((f) => f.leadId === leadId),
      scoreFactors: leadScore?.factors ?? [],
    },
  };
}

export async function createLeadAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  const parsed = leadInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const lead = await createLead(session.organizationId, session.userId, parsed.data);
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  return { ok: true, data: { id: lead.id } };
}

export async function updateLeadAction(leadId: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  const parsed = leadInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const lead = await updateLead(session.organizationId, session.userId, leadId, parsed.data);
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/pipeline");
  return { ok: true, data: { id: lead.id } };
}

export async function moveLeadStageAction(leadId: string, toStage: PipelineStageValue): Promise<ActionResult> {
  const session = await requireSession();
  await moveLeadStage(session.organizationId, session.userId, leadId, toStage);
  revalidatePath("/pipeline");
  revalidatePath("/leads");
  return { ok: true, data: undefined };
}
