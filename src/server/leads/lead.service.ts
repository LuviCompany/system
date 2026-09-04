import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import type { SessionPayload } from "@/server/auth/session";
import { recalculateLeadScore } from "@/server/icp/recalculate";

import type { LeadFilters, LeadInput } from "./lead.schema";

const leadInclude = {
  responsavel: { select: { id: true, name: true, email: true } },
  tags: { include: { tag: true } },
} satisfies Prisma.LeadInclude;

type LeadRecord = Prisma.LeadGetPayload<{ include: typeof leadInclude }>;

/**
 * `potentialValue`/`estimatedRevenue`/`adSpend` vêm do Prisma como `Decimal`
 * (uma classe, não um objeto plano) — React rejeita passar isso de um Server
 * Component para um Client Component. Toda função aqui que devolve dados para
 * a UI passa pela serialização abaixo antes de retornar.
 */
export type LeadWithRelations = Omit<LeadRecord, "potentialValue" | "estimatedRevenue" | "adSpend"> & {
  potentialValue: number | null;
  estimatedRevenue: number | null;
  adSpend: number | null;
};

function serializeLead(lead: LeadRecord): LeadWithRelations {
  return {
    ...lead,
    potentialValue: lead.potentialValue !== null ? Number(lead.potentialValue) : null,
    estimatedRevenue: lead.estimatedRevenue !== null ? Number(lead.estimatedRevenue) : null,
    adSpend: lead.adSpend !== null ? Number(lead.adSpend) : null,
  };
}

/** VENDEDOR só enxerga os próprios leads; ADMIN e GESTOR enxergam todos da organização. */
function scopeToViewer(viewer: SessionPayload): Prisma.LeadWhereInput {
  if (viewer.role === "VENDEDOR") {
    return { responsavelId: viewer.userId };
  }
  return {};
}

function buildWhere(organizationId: string, viewer: SessionPayload, filters: LeadFilters = {}): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {
    organizationId,
    ...scopeToViewer(viewer),
  };

  if (filters.stage) where.stage = filters.stage;
  if (filters.source) where.source = filters.source;
  if (filters.responsavelId) where.responsavelId = filters.responsavelId;
  if (filters.tagId) where.tags = { some: { tagId: filters.tagId } };
  if (filters.priority) where.priority = filters.priority;
  if (filters.scoreMin !== undefined || filters.scoreMax !== undefined) {
    where.icpScore = {
      ...(filters.scoreMin !== undefined ? { gte: filters.scoreMin } : {}),
      ...(filters.scoreMax !== undefined ? { lte: filters.scoreMax } : {}),
    };
  }
  if (filters.search) {
    const search = filters.search.trim();
    if (search) {
      where.OR = [
        { company: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { cnpj: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }
  }

  return where;
}

export type LeadSort = "updatedAt" | "icpScore" | "potentialValue" | "nextFollowUpAt" | "createdAt";

const SORT_FIELD_MAP: Record<LeadSort, Prisma.LeadOrderByWithRelationInput> = {
  updatedAt: { updatedAt: "desc" },
  icpScore: { icpScore: "desc" },
  potentialValue: { potentialValue: "desc" },
  nextFollowUpAt: { nextFollowUpAt: "asc" },
  createdAt: { createdAt: "desc" },
};

export async function listLeads(
  organizationId: string,
  viewer: SessionPayload,
  filters: LeadFilters = {},
  sort: LeadSort = "updatedAt",
): Promise<LeadWithRelations[]> {
  const leads = await prisma.lead.findMany({
    where: buildWhere(organizationId, viewer, filters),
    include: leadInclude,
    orderBy: SORT_FIELD_MAP[sort],
  });
  return leads.map(serializeLead);
}

export async function listLeadsByStage(
  organizationId: string,
  viewer: SessionPayload,
): Promise<Record<string, LeadWithRelations[]>> {
  const leads = await prisma.lead.findMany({
    where: { organizationId, ...scopeToViewer(viewer) },
    include: leadInclude,
    orderBy: { updatedAt: "desc" },
  });

  return leads.reduce<Record<string, LeadWithRelations[]>>((acc, lead) => {
    (acc[lead.stage] ??= []).push(serializeLead(lead));
    return acc;
  }, {});
}

export async function getLeadById(
  organizationId: string,
  viewer: SessionPayload,
  id: string,
): Promise<LeadWithRelations | null> {
  const lead = await prisma.lead.findFirst({
    where: { id, organizationId, ...scopeToViewer(viewer) },
    include: leadInclude,
  });
  return lead ? serializeLead(lead) : null;
}

export async function createLead(organizationId: string, actorUserId: string, input: LeadInput): Promise<LeadWithRelations> {
  const { tagIds, ...data } = input;

  const lead = await prisma.lead.create({
    data: {
      ...data,
      organizationId,
      tags: tagIds.length ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
    },
    include: leadInclude,
  });

  await prisma.$transaction([
    prisma.pipelineStageEvent.create({
      data: { organizationId, leadId: lead.id, userId: actorUserId, fromStage: null, toStage: lead.stage },
    }),
    prisma.activity.create({
      data: {
        organizationId,
        leadId: lead.id,
        userId: actorUserId,
        type: "NOTA",
        description: `Lead "${lead.company}" criado.`,
      },
    }),
  ]);

  await recalculateLeadScore(lead.id);
  const updated = await prisma.lead.findUniqueOrThrow({ where: { id: lead.id }, include: leadInclude });
  return serializeLead(updated);
}

export async function updateLead(
  organizationId: string,
  actorUserId: string,
  id: string,
  input: LeadInput,
): Promise<LeadWithRelations> {
  const existing = await prisma.lead.findFirstOrThrow({ where: { id, organizationId } });
  const { tagIds, ...data } = input;

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      ...data,
      tags: {
        deleteMany: {},
        create: tagIds.map((tagId) => ({ tagId })),
      },
    },
    include: leadInclude,
  });

  if (existing.stage !== lead.stage) {
    await prisma.pipelineStageEvent.create({
      data: {
        organizationId,
        leadId: lead.id,
        userId: actorUserId,
        fromStage: existing.stage,
        toStage: lead.stage,
      },
    });
  }

  await recalculateLeadScore(lead.id);
  const updated = await prisma.lead.findUniqueOrThrow({ where: { id: lead.id }, include: leadInclude });
  return serializeLead(updated);
}

export async function moveLeadStage(
  organizationId: string,
  actorUserId: string,
  leadId: string,
  toStage: LeadInput["stage"],
): Promise<LeadWithRelations> {
  const existing = await prisma.lead.findFirstOrThrow({ where: { id: leadId, organizationId }, include: leadInclude });
  if (existing.stage === toStage) return serializeLead(existing);

  const [lead] = await prisma.$transaction([
    prisma.lead.update({ where: { id: leadId }, data: { stage: toStage }, include: leadInclude }),
    prisma.pipelineStageEvent.create({
      data: { organizationId, leadId, userId: actorUserId, fromStage: existing.stage, toStage },
    }),
  ]);

  return serializeLead(lead);
}

interface DedupeCheck {
  cnpj?: string;
  website?: string;
  phone?: string;
  email?: string;
  /** Id na fonte externa (ex: placeId do Google Places) — casa duplicidade mesmo sem CNPJ/telefone/site. */
  externalId?: string;
}

/** Usado pela importação de CSV e pela busca de leads (Encontrar Leads) para evitar duplicar leads já existentes. */
export async function findDuplicateLead(organizationId: string, check: DedupeCheck) {
  const clauses: Prisma.LeadWhereInput[] = [];
  if (check.cnpj) clauses.push({ cnpj: check.cnpj });
  if (check.website) clauses.push({ website: check.website });
  if (check.phone) clauses.push({ phone: check.phone });
  if (check.email) clauses.push({ email: check.email });
  if (check.externalId) clauses.push({ externalId: check.externalId });
  if (clauses.length === 0) return null;

  return prisma.lead.findFirst({ where: { organizationId, OR: clauses } });
}
