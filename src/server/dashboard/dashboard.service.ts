import { prisma } from "@/server/db/prisma";
import type { SessionPayload } from "@/server/auth/session";
import { PIPELINE_STAGES } from "@/modules/leads/constants";

const STALE_DAYS = 7;

function scopeToViewer(viewer: SessionPayload) {
  return viewer.role === "VENDEDOR" ? { responsavelId: viewer.userId } : {};
}

export async function getDashboardData(organizationId: string, viewer: SessionPayload) {
  const where = { organizationId, ...scopeToViewer(viewer) };

  const leads = await prisma.lead.findMany({
    where,
    include: {
      activities: { orderBy: { createdAt: "desc" }, take: 1 },
      responsavel: { select: { id: true, name: true } },
    },
  });

  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter((l) => l.stage !== "NOVOS" && l.stage !== "PERDIDO").length;
  const meetings = leads.filter((l) => l.stage === "REUNIAO").length;
  const proposals = leads.filter((l) => l.stage === "PROPOSTA").length;
  const won = leads.filter((l) => l.stage === "GANHO").length;
  const openPipelineValue = leads
    .filter((l) => l.stage !== "GANHO" && l.stage !== "PERDIDO")
    .reduce((sum, l) => sum + Number(l.potentialValue ?? 0), 0);

  // Indicadores derivados do ICP Score (ver server/icp/scoring.ts).
  const icpQualifiedLeads = leads.filter((l) => l.priority !== "BAIXA").length;
  const highPriorityLeads = leads.filter((l) => l.priority === "ALTA").length;
  const maxPriorityLeads = leads.filter((l) => l.priority === "MAXIMA").length;
  const highAdherenceCount = highPriorityLeads + maxPriorityLeads;
  const highAdherencePercent = totalLeads > 0 ? Math.round((highAdherenceCount / totalLeads) * 100) : 0;

  const topPriorityLeads = [...leads]
    .sort((a, b) => b.icpScore - a.icpScore)
    .slice(0, 8)
    .map((l) => ({
      id: l.id,
      company: l.company,
      icpScore: l.icpScore,
      priority: l.priority,
      responsavel: l.responsavel?.name ?? "Sem responsável",
    }));

  const leadsByStage = PIPELINE_STAGES.map((stage) => ({
    stage: stage.value,
    label: stage.label,
    count: leads.filter((l) => l.stage === stage.value).length,
  }));

  const staleThreshold = new Date();
  staleThreshold.setDate(staleThreshold.getDate() - STALE_DAYS);

  const leadsWithoutRecentActivity = leads
    .filter((l) => l.stage !== "GANHO" && l.stage !== "PERDIDO")
    .filter((l) => {
      const lastTouch = l.activities[0]?.createdAt ?? l.createdAt;
      return lastTouch < staleThreshold;
    })
    .sort((a, b) => {
      const aTouch = a.activities[0]?.createdAt ?? a.createdAt;
      const bTouch = b.activities[0]?.createdAt ?? b.createdAt;
      return aTouch.getTime() - bTouch.getTime();
    })
    .slice(0, 8)
    .map((l) => ({
      id: l.id,
      company: l.company,
      responsavel: l.responsavel?.name ?? "Sem responsável",
      lastTouchAt: l.activities[0]?.createdAt ?? l.createdAt,
    }));

  const proposalsAwaiting = leads
    .filter((l) => l.stage === "PROPOSTA")
    .sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime())
    .map((l) => ({
      id: l.id,
      company: l.company,
      responsavel: l.responsavel?.name ?? "Sem responsável",
      potentialValue: l.potentialValue ? Number(l.potentialValue) : null,
      updatedAt: l.updatedAt,
    }));

  return {
    summary: {
      totalLeads,
      qualifiedLeads,
      meetings,
      proposals,
      won,
      openPipelineValue,
      icpQualifiedLeads,
      highPriorityLeads,
      maxPriorityLeads,
      highAdherencePercent,
    },
    leadsByStage,
    leadsWithoutRecentActivity,
    proposalsAwaiting,
    topPriorityLeads,
  };
}
