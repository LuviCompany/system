import { z } from "zod";

import { ICP_CRITERION_VALUES } from "@/modules/icp/constants";
import { prisma } from "@/server/db/prisma";

import { icpProfileScoringInclude, type IcpProfileWithRules } from "./scoring";
import { recalculateLeadScore } from "./recalculate";

const ruleInputSchema = z.object({
  label: z.string().trim().min(1),
  order: z.coerce.number().int().default(0),
  minValue: z.coerce.number().optional().nullable(),
  maxValue: z.coerce.number().optional().nullable(),
  matchValues: z.array(z.string().trim()).default([]),
  score: z.coerce.number().int().min(0).max(100),
});

const criterionInputSchema = z.object({
  type: z.enum(ICP_CRITERION_VALUES),
  weight: z.coerce.number().int().min(0).max(100),
  rules: z.array(ruleInputSchema).default([]),
});

export const icpProfileInputSchema = z.object({
  name: z.string().trim().min(1, "Dê um nome a este perfil de ICP."),
  description: z.string().trim().optional(),
  criteria: z.array(criterionInputSchema).default([]),
});

export type IcpProfileInput = z.infer<typeof icpProfileInputSchema>;

/**
 * `IcpProfileWithRules` (de scoring.ts) tem `minValue`/`maxValue` como
 * `Decimal` do Prisma — uma classe, não um objeto plano. React rejeita passar
 * isso de um Server Component para um Client Component, então qualquer perfil
 * destinado à UI passa por esta serialização antes de sair do servidor.
 */
export type IcpProfileForClient = Omit<IcpProfileWithRules, "criteria"> & {
  criteria: (Omit<IcpProfileWithRules["criteria"][number], "rules"> & {
    rules: (Omit<IcpProfileWithRules["criteria"][number]["rules"][number], "minValue" | "maxValue"> & {
      minValue: number | null;
      maxValue: number | null;
    })[];
  })[];
};

function serializeIcpProfile(profile: IcpProfileWithRules): IcpProfileForClient {
  return {
    ...profile,
    criteria: profile.criteria.map((criterion) => ({
      ...criterion,
      rules: criterion.rules.map((rule) => ({
        ...rule,
        minValue: rule.minValue !== null ? Number(rule.minValue) : null,
        maxValue: rule.maxValue !== null ? Number(rule.maxValue) : null,
      })),
    })),
  };
}

export async function listIcpProfiles(organizationId: string): Promise<IcpProfileForClient[]> {
  const profiles = await prisma.icpProfile.findMany({
    where: { organizationId },
    include: icpProfileScoringInclude,
    orderBy: { createdAt: "desc" },
  });
  return profiles.map(serializeIcpProfile);
}

export async function getActiveIcpProfile(organizationId: string): Promise<IcpProfileWithRules | null> {
  return prisma.icpProfile.findFirst({
    where: { organizationId, isActive: true },
    include: icpProfileScoringInclude,
  });
}

async function replaceCriteria(icpProfileId: string, criteria: IcpProfileInput["criteria"]) {
  await prisma.icpProfileCriterion.deleteMany({ where: { icpProfileId } });
  for (const criterion of criteria) {
    await prisma.icpProfileCriterion.create({
      data: {
        icpProfileId,
        type: criterion.type,
        weight: criterion.weight,
        rules: {
          create: criterion.rules.map((rule) => ({
            label: rule.label,
            order: rule.order,
            minValue: rule.minValue ?? undefined,
            maxValue: rule.maxValue ?? undefined,
            matchValues: rule.matchValues,
            score: rule.score,
          })),
        },
      },
    });
  }
}

export async function createIcpProfile(organizationId: string, input: IcpProfileInput) {
  const profile = await prisma.icpProfile.create({
    data: { organizationId, name: input.name, description: input.description },
  });
  await replaceCriteria(profile.id, input.criteria);
  return profile;
}

export async function updateIcpProfile(organizationId: string, id: string, input: IcpProfileInput) {
  await prisma.icpProfile.findFirstOrThrow({ where: { id, organizationId } });
  const profile = await prisma.icpProfile.update({
    where: { id },
    data: { name: input.name, description: input.description },
  });
  await replaceCriteria(profile.id, input.criteria);

  if (profile.isActive) {
    await recalculateAllLeadScores(organizationId, profile.id);
  }

  return profile;
}

export async function deleteIcpProfile(organizationId: string, id: string) {
  return prisma.icpProfile.deleteMany({ where: { id, organizationId } });
}

/** Ativa este perfil (e desativa qualquer outro da organização), depois recalcula todos os leads. */
export async function activateIcpProfile(organizationId: string, id: string) {
  await prisma.icpProfile.findFirstOrThrow({ where: { id, organizationId } });

  await prisma.$transaction([
    prisma.icpProfile.updateMany({ where: { organizationId }, data: { isActive: false } }),
    prisma.icpProfile.update({ where: { id }, data: { isActive: true } }),
  ]);

  await recalculateAllLeadScores(organizationId, id);
}

/** Recalcula o icpScore de todos os leads da organização com o perfil informado. */
export async function recalculateAllLeadScores(organizationId: string, icpProfileId: string): Promise<number> {
  const leads = await prisma.lead.findMany({ where: { organizationId } });
  for (const lead of leads) {
    await recalculateLeadScore(lead.id, icpProfileId);
  }
  return leads.length;
}
