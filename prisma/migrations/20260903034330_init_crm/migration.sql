-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'GESTOR', 'VENDEDOR');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('GOOGLE_MAPS', 'INSTAGRAM', 'LINKEDIN', 'INDICACAO', 'SITE', 'EVENTO', 'IMPORTACAO_CSV', 'OUTRO');

-- CreateEnum
CREATE TYPE "PipelineStage" AS ENUM ('NOVOS', 'QUALIFICADOS', 'PROSPECCAO', 'CONTATO', 'REUNIAO', 'PROPOSTA', 'NEGOCIACAO', 'GANHO', 'PERDIDO');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('LIGACAO', 'WHATSAPP', 'EMAIL', 'INSTAGRAM', 'REUNIAO', 'NOTA', 'FOLLOW_UP', 'PROPOSTA');

-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('PENDENTE', 'CONCLUIDO');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VENDEDOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "responsavelId" TEXT,
    "company" TEXT NOT NULL,
    "contactName" TEXT,
    "position" TEXT,
    "cnpj" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "linkedin" TEXT,
    "city" TEXT,
    "state" TEXT,
    "segment" TEXT,
    "source" "LeadSource" NOT NULL DEFAULT 'OUTRO',
    "potentialValue" DECIMAL(12,2),
    "notes" TEXT,
    "icpScore" INTEGER NOT NULL DEFAULT 0,
    "stage" "PipelineStage" NOT NULL DEFAULT 'NOVOS',
    "nextFollowUpAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#71717e',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_tags" (
    "leadId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "lead_tags_pkey" PRIMARY KEY ("leadId","tagId")
);

-- CreateTable
CREATE TABLE "icp_criteria" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "segment" TEXT,
    "revenueRange" TEXT,
    "ticketRange" TEXT,
    "employeesRange" TEXT,
    "location" TEXT,
    "hasWebsite" BOOLEAN NOT NULL DEFAULT false,
    "hasInstagram" BOOLEAN NOT NULL DEFAULT false,
    "adSpend" TEXT,
    "technologies" TEXT,
    "problems" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "icp_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow_ups" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "responsavelId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "status" "FollowUpStatus" NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_stage_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromStage" "PipelineStage",
    "toStage" "PipelineStage" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pipeline_stage_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");

-- CreateIndex
CREATE INDEX "leads_organizationId_idx" ON "leads"("organizationId");

-- CreateIndex
CREATE INDEX "leads_organizationId_stage_idx" ON "leads"("organizationId", "stage");

-- CreateIndex
CREATE INDEX "leads_responsavelId_idx" ON "leads"("responsavelId");

-- CreateIndex
CREATE UNIQUE INDEX "tags_organizationId_name_key" ON "tags"("organizationId", "name");

-- CreateIndex
CREATE INDEX "lead_tags_tagId_idx" ON "lead_tags"("tagId");

-- CreateIndex
CREATE INDEX "icp_criteria_organizationId_idx" ON "icp_criteria"("organizationId");

-- CreateIndex
CREATE INDEX "activities_organizationId_idx" ON "activities"("organizationId");

-- CreateIndex
CREATE INDEX "activities_leadId_idx" ON "activities"("leadId");

-- CreateIndex
CREATE INDEX "follow_ups_organizationId_idx" ON "follow_ups"("organizationId");

-- CreateIndex
CREATE INDEX "follow_ups_leadId_idx" ON "follow_ups"("leadId");

-- CreateIndex
CREATE INDEX "follow_ups_organizationId_scheduledAt_idx" ON "follow_ups"("organizationId", "scheduledAt");

-- CreateIndex
CREATE INDEX "pipeline_stage_events_organizationId_idx" ON "pipeline_stage_events"("organizationId");

-- CreateIndex
CREATE INDEX "pipeline_stage_events_leadId_idx" ON "pipeline_stage_events"("leadId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_tags" ADD CONSTRAINT "lead_tags_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_tags" ADD CONSTRAINT "lead_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "icp_criteria" ADD CONSTRAINT "icp_criteria_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_stage_events" ADD CONSTRAINT "pipeline_stage_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_stage_events" ADD CONSTRAINT "pipeline_stage_events_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_stage_events" ADD CONSTRAINT "pipeline_stage_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
