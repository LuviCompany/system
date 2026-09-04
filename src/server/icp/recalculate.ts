import { prisma } from "@/server/db/prisma";

import { computeLeadScore, icpProfileScoringInclude } from "./scoring";

/**
 * Recalcula o ICP Score de um único lead e persiste o resultado (Lead.icpScore/
 * priority + LeadScore/LeadScoreFactor). Chamado ao criar/editar um lead e ao
 * salvar ou ativar um perfil de ICP. Se a organização não tem perfil de ICP
 * ativo, não faz nada (lead permanece com o score/prioridade atuais).
 */
export async function recalculateLeadScore(leadId: string, icpProfileId?: string): Promise<void> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return;

  const profile = icpProfileId
    ? await prisma.icpProfile.findUnique({ where: { id: icpProfileId }, include: icpProfileScoringInclude })
    : await prisma.icpProfile.findFirst({
        where: { organizationId: lead.organizationId, isActive: true },
        include: icpProfileScoringInclude,
      });

  if (!profile) return;

  const result = computeLeadScore(lead, profile);

  await prisma.$transaction([
    prisma.lead.update({
      where: { id: leadId },
      data: { icpScore: result.score, priority: result.priority },
    }),
    prisma.leadScore.deleteMany({ where: { leadId } }),
    prisma.leadScore.create({
      data: {
        organizationId: lead.organizationId,
        leadId,
        icpProfileId: profile.id,
        score: result.score,
        priority: result.priority,
        factors: {
          create: result.factors.map((factor) => ({
            type: factor.type,
            label: factor.label,
            weight: factor.weight,
            rawScore: factor.rawScore,
            contribution: factor.contribution,
          })),
        },
      },
    }),
  ]);
}
