import type { LeadSearchResult, Prisma } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import type { SessionPayload } from "@/server/auth/session";
import { icpProfileScoringInclude, type ScoreFactorResult } from "@/server/icp/scoring";
import { createLead, findDuplicateLead } from "@/server/leads/lead.service";

import { buildEnrichmentRecords } from "./enrichment";
import { normalizeBusinessFields } from "./normalize";
import { getActiveLeadSourceProvider, getLeadSourceProviderById } from "./provider";
import type { LeadSearchInput } from "./schema";
import { scoreBusiness } from "./score-business";
import type { ProviderBusiness } from "./types";

export interface LeadSearchResultForClient {
  id: string;
  externalId: string;
  company: string;
  segment: string | null;
  type: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  linkedin: string | null;
  email: string | null;
  cnpj: string | null;
  sourceUrl: string | null;
  rating: number | null;
  userRatingCount: number | null;
  potentialValue: number | null;
  estimatedRevenue: number | null;
  adSpend: number | null;
  commercialMaturity: number | null;
  marketingNeed: number | null;
  technologyNeed: number | null;
  recurrencePotential: number | null;
  icpScore: number;
  priority: string;
  scoreFactors: ScoreFactorResult[];
  status: "NEW" | "DUPLICATE" | "IMPORTED";
  matchedLeadId: string | null;
  raw: ProviderBusiness;
}

export interface LeadSearchRunResult {
  queryId: string;
  provider: { id: string; label: string };
  results: LeadSearchResultForClient[];
}

function toNumber(value: Prisma.Decimal | number | null): number | null {
  if (value === null) return null;
  return typeof value === "number" ? value : Number(value);
}

function serializeResult(row: LeadSearchResult): LeadSearchResultForClient {
  return {
    id: row.id,
    externalId: row.externalId,
    company: row.company,
    segment: row.segment,
    type: row.type,
    address: row.address,
    city: row.city,
    state: row.state,
    phone: row.phone,
    website: row.website,
    instagram: row.instagram,
    linkedin: row.linkedin,
    email: row.email,
    cnpj: row.cnpj,
    sourceUrl: row.sourceUrl,
    rating: row.rating,
    userRatingCount: row.userRatingCount,
    potentialValue: toNumber(row.potentialValue),
    estimatedRevenue: toNumber(row.estimatedRevenue),
    adSpend: toNumber(row.adSpend),
    commercialMaturity: row.commercialMaturity,
    marketingNeed: row.marketingNeed,
    technologyNeed: row.technologyNeed,
    recurrencePotential: row.recurrencePotential,
    icpScore: row.icpScore,
    priority: row.priority,
    scoreFactors: (row.scoreFactors as unknown as ScoreFactorResult[] | null) ?? [],
    status: row.status,
    matchedLeadId: row.matchedLeadId,
    raw: row.raw as unknown as ProviderBusiness,
  };
}

/** `Lead.source` e o texto da atividade de importação variam conforme a fonte que gerou o resultado. */
function leadSourceForProvider(providerId: string): "GOOGLE_PLACES" | "BUSCA_EXTERNA" {
  return providerId === "google_places" ? "GOOGLE_PLACES" : "BUSCA_EXTERNA";
}

function importActivityDescriptionForProvider(providerId: string): string {
  return providerId === "google_places" ? "Lead importado via Google Places." : "Lead importado da fonte de aquisição.";
}

/**
 * Fluxo completo de uma busca em /encontrar-leads:
 *
 *   provider.searchBusinesses() -> normalização -> deduplicação -> ICP scoring
 *   -> persiste LeadSearchQuery + LeadSearchResult (auditoria)
 *
 * O scoring reaproveita computeLeadScore (server/icp/scoring.ts, via
 * score-business.ts) — a mesma função usada para leads reais — nenhuma
 * lógica de pontuação é duplicada.
 */
export async function runLeadSearch(
  session: SessionPayload,
  input: LeadSearchInput,
): Promise<LeadSearchRunResult> {
  const provider = getActiveLeadSourceProvider();

  const profile = input.icpProfileId
    ? await prisma.icpProfile.findFirst({
        where: { id: input.icpProfileId, organizationId: session.organizationId },
        include: icpProfileScoringInclude,
      })
    : await prisma.icpProfile.findFirst({
        where: { organizationId: session.organizationId, isActive: true },
        include: icpProfileScoringInclude,
      });

  const businesses = await provider.searchBusinesses({
    segment: input.segment,
    city: input.city,
    state: input.state,
    keyword: input.keyword,
    quantity: input.quantity,
  });

  const query = await prisma.leadSearchQuery.create({
    data: {
      organizationId: session.organizationId,
      userId: session.userId,
      provider: provider.id,
      segment: input.segment ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      keyword: input.keyword ?? null,
      icpProfileId: profile?.id ?? null,
      requestedQuantity: input.quantity,
      resultCount: businesses.length,
    },
  });

  let duplicateCount = 0;
  const resultRows: LeadSearchResult[] = [];

  for (const business of businesses) {
    const normalized = normalizeBusinessFields({
      company: business.company,
      segment: business.segment,
      city: business.city,
      state: business.state,
      phone: business.phone,
      website: business.website,
      instagram: business.instagram,
      linkedin: business.linkedin,
      email: business.email,
      cnpj: business.cnpj,
    });

    const duplicate = await findDuplicateLead(session.organizationId, {
      cnpj: normalized.cnpj ?? undefined,
      website: normalized.website ?? undefined,
      phone: normalized.phone ?? undefined,
      email: normalized.email ?? undefined,
      externalId: business.externalId,
    });

    const scoreResult = scoreBusiness(
      { ...business, website: normalized.website, instagram: normalized.instagram, segment: normalized.segment, state: normalized.state },
      profile,
    );

    if (duplicate) duplicateCount += 1;

    const row = await prisma.leadSearchResult.create({
      data: {
        organizationId: session.organizationId,
        searchQueryId: query.id,
        externalId: business.externalId,
        company: normalized.company,
        segment: normalized.segment,
        type: business.type,
        address: business.address,
        city: normalized.city,
        state: normalized.state,
        phone: normalized.phone,
        website: normalized.website,
        instagram: normalized.instagram,
        linkedin: normalized.linkedin,
        email: normalized.email,
        cnpj: normalized.cnpj,
        sourceUrl: business.sourceUrl,
        rating: business.rating,
        userRatingCount: business.userRatingCount,
        potentialValue: business.potentialValue,
        estimatedRevenue: business.estimatedRevenue,
        adSpend: business.adSpend,
        commercialMaturity: business.commercialMaturity,
        marketingNeed: business.marketingNeed,
        technologyNeed: business.technologyNeed,
        recurrencePotential: business.recurrencePotential,
        raw: business as unknown as Prisma.InputJsonValue,
        icpScore: scoreResult.score,
        priority: scoreResult.priority,
        scoreFactors: scoreResult.factors as unknown as Prisma.InputJsonValue,
        status: duplicate ? "DUPLICATE" : "NEW",
        matchedLeadId: duplicate?.id ?? null,
      },
    });

    resultRows.push(row);
  }

  await prisma.leadSearchQuery.update({
    where: { id: query.id },
    data: { duplicateCount },
  });

  return {
    queryId: query.id,
    provider: { id: provider.id, label: provider.label },
    results: resultRows.map(serializeResult),
  };
}

export interface ImportLeadSearchResultsSummary {
  added: number;
  duplicates: number;
  errors: number;
  createdLeadIds: string[];
  updatedResults: LeadSearchResultForClient[];
}

/**
 * "Adicionar ao CRM": para cada resultado selecionado, reconfere duplicidade
 * (defesa contra corrida entre a busca e a confirmação) e, se realmente é
 * novo, cria o Lead reaproveitando server/leads/lead.service.ts (que já
 * dispara o recálculo de ICP Score) e registra o enriquecimento coletado.
 * Falhas isoladas (ex: erro de banco num resultado específico) não abortam
 * o lote — contam como "erro" e o import segue para os próximos.
 */
export async function importLeadSearchResults(
  organizationId: string,
  actorUserId: string,
  queryId: string,
  resultIds: string[],
): Promise<ImportLeadSearchResultsSummary> {
  const query = await prisma.leadSearchQuery.findFirstOrThrow({ where: { id: queryId, organizationId } });
  const results = await prisma.leadSearchResult.findMany({
    where: { id: { in: resultIds }, organizationId, searchQueryId: queryId },
  });

  let added = 0;
  let duplicates = 0;
  let errors = 0;
  const createdLeadIds: string[] = [];

  for (const result of results) {
    if (result.status === "IMPORTED") continue;

    try {
      const duplicate = await findDuplicateLead(organizationId, {
        cnpj: result.cnpj ?? undefined,
        website: result.website ?? undefined,
        phone: result.phone ?? undefined,
        email: result.email ?? undefined,
        externalId: result.externalId,
      });

      if (duplicate) {
        duplicates += 1;
        await prisma.leadSearchResult.update({
          where: { id: result.id },
          data: { status: "DUPLICATE", matchedLeadId: duplicate.id },
        });
        continue;
      }

      const lead = await createLead(organizationId, actorUserId, {
        company: result.company,
        segment: result.segment ?? undefined,
        city: result.city ?? undefined,
        state: result.state ?? undefined,
        phone: result.phone ?? undefined,
        website: result.website ?? undefined,
        instagram: result.instagram ?? undefined,
        linkedin: result.linkedin ?? undefined,
        email: result.email ?? undefined,
        cnpj: result.cnpj ?? undefined,
        externalId: result.externalId,
        sourceUrl: result.sourceUrl ?? undefined,
        potentialValue: result.potentialValue !== null ? Number(result.potentialValue) : undefined,
        estimatedRevenue: result.estimatedRevenue !== null ? Number(result.estimatedRevenue) : undefined,
        adSpend: result.adSpend !== null ? Number(result.adSpend) : undefined,
        commercialMaturity: result.commercialMaturity ?? undefined,
        marketingNeed: result.marketingNeed ?? undefined,
        technologyNeed: result.technologyNeed ?? undefined,
        recurrencePotential: result.recurrencePotential ?? undefined,
        source: leadSourceForProvider(query.provider),
        stage: "NOVOS",
        tagIds: [],
      });

      const business = result.raw as unknown as ProviderBusiness;
      const enrichmentRecords = buildEnrichmentRecords(business, query.provider);
      await prisma.leadEnrichment.createMany({
        data: enrichmentRecords.map((record) => ({
          organizationId,
          leadId: lead.id,
          field: record.field,
          value: record.value,
          status: record.status,
          source: record.source,
        })),
      });

      await prisma.activity.create({
        data: {
          organizationId,
          leadId: lead.id,
          userId: actorUserId,
          type: "NOTA",
          description: importActivityDescriptionForProvider(query.provider),
        },
      });

      await prisma.leadSearchResult.update({
        where: { id: result.id },
        data: { status: "IMPORTED", matchedLeadId: lead.id },
      });

      added += 1;
      createdLeadIds.push(lead.id);
    } catch (error) {
      console.error("[lead-sourcing] falha ao importar resultado", result.id, error);
      errors += 1;
    }
  }

  await prisma.leadSearchQuery.update({
    where: { id: queryId },
    data: {
      addedCount: { increment: added },
      duplicateCount: { increment: duplicates },
    },
  });

  const updatedRows = await prisma.leadSearchResult.findMany({
    where: { id: { in: resultIds }, organizationId, searchQueryId: queryId },
  });

  return { added, duplicates, errors, createdLeadIds, updatedResults: updatedRows.map(serializeResult) };
}

export interface EnrichLeadSearchResultResult {
  ok: true;
  result: LeadSearchResultForClient;
}

/**
 * "Enriquecer" (item 8/11): busca os campos de contato/avaliação de UM
 * resultado via Place Details (ou o equivalente do provider ativo), faz
 * merge preservando o que já existia e recalcula o ICP Score — o site pode
 * ter passado de "não encontrado" para um valor, o que muda o critério SITE.
 */
export async function enrichLeadSearchResult(
  organizationId: string,
  resultId: string,
): Promise<LeadSearchResultForClient> {
  const result = await prisma.leadSearchResult.findFirstOrThrow({ where: { id: resultId, organizationId } });
  const query = await prisma.leadSearchQuery.findFirstOrThrow({ where: { id: result.searchQueryId, organizationId } });

  const provider = getLeadSourceProviderById(query.provider);
  if (!provider) return serializeResult(result);

  const details = await provider.getBusinessDetails(result.externalId);
  if (!details) return serializeResult(result);

  const existingBusiness = result.raw as unknown as ProviderBusiness;
  const mergedBusiness: ProviderBusiness = {
    ...existingBusiness,
    ...Object.fromEntries(Object.entries(details).filter(([, value]) => value !== null && value !== undefined)),
  };

  const profile = query.icpProfileId
    ? await prisma.icpProfile.findFirst({ where: { id: query.icpProfileId, organizationId }, include: icpProfileScoringInclude })
    : await prisma.icpProfile.findFirst({ where: { organizationId, isActive: true }, include: icpProfileScoringInclude });

  const scoreResult = scoreBusiness(mergedBusiness, profile);

  const updated = await prisma.leadSearchResult.update({
    where: { id: result.id },
    data: {
      phone: mergedBusiness.phone,
      website: mergedBusiness.website,
      sourceUrl: mergedBusiness.sourceUrl,
      rating: mergedBusiness.rating,
      userRatingCount: mergedBusiness.userRatingCount,
      raw: mergedBusiness as unknown as Prisma.InputJsonValue,
      icpScore: scoreResult.score,
      priority: scoreResult.priority,
      scoreFactors: scoreResult.factors as unknown as Prisma.InputJsonValue,
    },
  });

  return serializeResult(updated);
}
