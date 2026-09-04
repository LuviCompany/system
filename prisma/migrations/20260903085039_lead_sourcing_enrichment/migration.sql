-- CreateEnum
CREATE TYPE "LeadSearchResultStatus" AS ENUM ('NEW', 'DUPLICATE', 'IMPORTED');

-- CreateEnum
CREATE TYPE "EnrichmentField" AS ENUM ('WEBSITE', 'INSTAGRAM', 'LINKEDIN', 'PHONE', 'EMAIL', 'SEGMENT', 'CITY', 'STATE', 'EMPLOYEES', 'REVENUE_ESTIMATE', 'AD_ACTIVITY', 'DIGITAL_PRESENCE', 'TECHNOLOGY_STACK');

-- CreateEnum
CREATE TYPE "EnrichmentStatus" AS ENUM ('FOUND', 'NOT_FOUND', 'PENDING');

-- AlterEnum
ALTER TYPE "LeadSource" ADD VALUE 'BUSCA_EXTERNA';

-- CreateTable
CREATE TABLE "lead_search_queries" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "segment" TEXT,
    "city" TEXT,
    "state" TEXT,
    "keyword" TEXT,
    "icpProfileId" TEXT,
    "requestedQuantity" INTEGER NOT NULL,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "addedCount" INTEGER NOT NULL DEFAULT 0,
    "duplicateCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_search_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_search_results" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "searchQueryId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "segment" TEXT,
    "city" TEXT,
    "state" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "linkedin" TEXT,
    "email" TEXT,
    "cnpj" TEXT,
    "potentialValue" DECIMAL(12,2),
    "estimatedRevenue" DECIMAL(14,2),
    "adSpend" DECIMAL(12,2),
    "commercialMaturity" INTEGER,
    "marketingNeed" INTEGER,
    "technologyNeed" INTEGER,
    "recurrencePotential" INTEGER,
    "raw" JSONB,
    "icpScore" INTEGER NOT NULL DEFAULT 0,
    "priority" "LeadPriority" NOT NULL DEFAULT 'BAIXA',
    "scoreFactors" JSONB,
    "status" "LeadSearchResultStatus" NOT NULL DEFAULT 'NEW',
    "matchedLeadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_search_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_enrichments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "field" "EnrichmentField" NOT NULL,
    "value" TEXT,
    "status" "EnrichmentStatus" NOT NULL DEFAULT 'PENDING',
    "source" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_enrichments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lead_search_queries_organizationId_idx" ON "lead_search_queries"("organizationId");

-- CreateIndex
CREATE INDEX "lead_search_queries_organizationId_createdAt_idx" ON "lead_search_queries"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "lead_search_results_organizationId_idx" ON "lead_search_results"("organizationId");

-- CreateIndex
CREATE INDEX "lead_search_results_searchQueryId_idx" ON "lead_search_results"("searchQueryId");

-- CreateIndex
CREATE UNIQUE INDEX "lead_search_results_searchQueryId_externalId_key" ON "lead_search_results"("searchQueryId", "externalId");

-- CreateIndex
CREATE INDEX "lead_enrichments_organizationId_idx" ON "lead_enrichments"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "lead_enrichments_leadId_field_key" ON "lead_enrichments"("leadId", "field");

-- AddForeignKey
ALTER TABLE "lead_search_queries" ADD CONSTRAINT "lead_search_queries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_search_queries" ADD CONSTRAINT "lead_search_queries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_search_results" ADD CONSTRAINT "lead_search_results_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_search_results" ADD CONSTRAINT "lead_search_results_searchQueryId_fkey" FOREIGN KEY ("searchQueryId") REFERENCES "lead_search_queries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_enrichments" ADD CONSTRAINT "lead_enrichments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_enrichments" ADD CONSTRAINT "lead_enrichments_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

