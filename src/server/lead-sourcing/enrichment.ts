import type { EnrichmentField, EnrichmentStatus } from "@prisma/client";

import type { ProviderBusiness } from "./types";

export interface EnrichmentRecordInput {
  field: EnrichmentField;
  value: string | null;
  status: EnrichmentStatus;
  source: string;
}

function digitalPresenceLabel(business: ProviderBusiness): string {
  const count = [business.website, business.instagram, business.linkedin].filter(Boolean).length;
  if (count >= 3) return "Alta";
  if (count === 2) return "Média";
  if (count === 1) return "Baixa";
  return "Nenhuma";
}

/**
 * Monta os registros de LeadEnrichment (item 11/12 da Etapa 3) a partir do
 * que o provider realmente devolveu para uma empresa — nunca inventa valor:
 * campo ausente vira NOT_FOUND, nunca é preenchido com um palpite.
 */
export function buildEnrichmentRecords(business: ProviderBusiness, sourceLabel: string): EnrichmentRecordInput[] {
  const found = (value: string | null): EnrichmentRecordInput["status"] => (value ? "FOUND" : "NOT_FOUND");

  const records: EnrichmentRecordInput[] = [
    { field: "WEBSITE", value: business.website, status: found(business.website), source: sourceLabel },
    { field: "INSTAGRAM", value: business.instagram, status: found(business.instagram), source: sourceLabel },
    { field: "LINKEDIN", value: business.linkedin, status: found(business.linkedin), source: sourceLabel },
    { field: "PHONE", value: business.phone, status: found(business.phone), source: sourceLabel },
    { field: "EMAIL", value: business.email, status: found(business.email), source: sourceLabel },
    { field: "SEGMENT", value: business.segment, status: found(business.segment), source: sourceLabel },
    { field: "CITY", value: business.city, status: found(business.city), source: sourceLabel },
    { field: "STATE", value: business.state, status: found(business.state), source: sourceLabel },
    {
      field: "EMPLOYEES",
      value: business.employees !== null ? String(business.employees) : null,
      status: business.employees !== null ? "FOUND" : "NOT_FOUND",
      source: sourceLabel,
    },
    {
      field: "REVENUE_ESTIMATE",
      value: business.estimatedRevenue !== null ? String(business.estimatedRevenue) : null,
      status: business.estimatedRevenue !== null ? "FOUND" : "NOT_FOUND",
      source: sourceLabel,
    },
    {
      field: "AD_ACTIVITY",
      value: business.adSpend !== null ? String(business.adSpend) : null,
      status: business.adSpend !== null ? "FOUND" : "NOT_FOUND",
      source: sourceLabel,
    },
    {
      field: "DIGITAL_PRESENCE",
      value: digitalPresenceLabel(business),
      status: "FOUND",
      source: "derived",
    },
    {
      field: "TECHNOLOGY_STACK",
      value: business.technologyStack && business.technologyStack.length > 0 ? business.technologyStack.join(", ") : null,
      status: business.technologyStack && business.technologyStack.length > 0 ? "FOUND" : "NOT_FOUND",
      source: sourceLabel,
    },
    {
      field: "RATING",
      value: business.rating !== null ? String(business.rating) : null,
      status: business.rating !== null ? "FOUND" : "NOT_FOUND",
      source: sourceLabel,
    },
    {
      field: "USER_RATING_COUNT",
      value: business.userRatingCount !== null ? String(business.userRatingCount) : null,
      status: business.userRatingCount !== null ? "FOUND" : "NOT_FOUND",
      source: sourceLabel,
    },
  ];

  return records;
}
