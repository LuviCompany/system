-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ATIVO', 'PAUSADO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "ClientHealthStatus" AS ENUM ('SAUDAVEL', 'ATENCAO', 'CRITICO');

-- CreateEnum
CREATE TYPE "IntegrationPlatform" AS ENUM ('META_ADS', 'GOOGLE_ADS', 'INSTAGRAM', 'GOOGLE_ANALYTICS');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('NAO_CONECTADO', 'CONECTADO');

-- CreateEnum
CREATE TYPE "AdPlatform" AS ENUM ('META_ADS', 'GOOGLE_ADS');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('ATIVA', 'PAUSADA', 'ENCERRADA');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'LINKEDIN');

-- CreateEnum
CREATE TYPE "SocialContentType" AS ENUM ('IMAGEM', 'VIDEO', 'CARROSSEL', 'REELS', 'STORY');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('RASCUNHO', 'PRONTO');

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "responsavelId" TEXT,
    "name" TEXT NOT NULL,
    "tradeName" TEXT,
    "cnpj" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "segment" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" "ClientStatus" NOT NULL DEFAULT 'ATIVO',
    "health" "ClientHealthStatus" NOT NULL DEFAULT 'SAUDAVEL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_platforms" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "platform" "IntegrationPlatform" NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'NAO_CONECTADO',
    "accountLabel" TEXT,
    "connectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "platform" "AdPlatform" NOT NULL,
    "name" TEXT NOT NULL,
    "objective" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'ATIVA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ads" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "platform" "AdPlatform" NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'ATIVA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_metrics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "campaignId" TEXT,
    "adId" TEXT,
    "platform" "AdPlatform" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "investment" DECIMAL(12,2) NOT NULL,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "sales" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_posts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "type" "SocialContentType" NOT NULL,
    "caption" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_engagements" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userIdentifier" TEXT NOT NULL,
    "interactionCount" INTEGER NOT NULL,
    "engagementSource" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_engagements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "platforms" "AdPlatform"[],
    "status" "ReportStatus" NOT NULL DEFAULT 'RASCUNHO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_sections" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "report_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_metrics" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "report_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clients_organizationId_idx" ON "clients"("organizationId");

-- CreateIndex
CREATE INDEX "clients_organizationId_status_idx" ON "clients"("organizationId", "status");

-- CreateIndex
CREATE INDEX "client_platforms_organizationId_idx" ON "client_platforms"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "client_platforms_clientId_platform_key" ON "client_platforms"("clientId", "platform");

-- CreateIndex
CREATE INDEX "campaigns_organizationId_idx" ON "campaigns"("organizationId");

-- CreateIndex
CREATE INDEX "campaigns_clientId_idx" ON "campaigns"("clientId");

-- CreateIndex
CREATE INDEX "ads_organizationId_idx" ON "ads"("organizationId");

-- CreateIndex
CREATE INDEX "ads_clientId_idx" ON "ads"("clientId");

-- CreateIndex
CREATE INDEX "ads_campaignId_idx" ON "ads"("campaignId");

-- CreateIndex
CREATE INDEX "performance_metrics_organizationId_idx" ON "performance_metrics"("organizationId");

-- CreateIndex
CREATE INDEX "performance_metrics_clientId_date_idx" ON "performance_metrics"("clientId", "date");

-- CreateIndex
CREATE INDEX "performance_metrics_campaignId_idx" ON "performance_metrics"("campaignId");

-- CreateIndex
CREATE INDEX "performance_metrics_adId_idx" ON "performance_metrics"("adId");

-- CreateIndex
CREATE INDEX "social_posts_organizationId_idx" ON "social_posts"("organizationId");

-- CreateIndex
CREATE INDEX "social_posts_clientId_publishedAt_idx" ON "social_posts"("clientId", "publishedAt");

-- CreateIndex
CREATE INDEX "social_engagements_organizationId_idx" ON "social_engagements"("organizationId");

-- CreateIndex
CREATE INDEX "social_engagements_postId_idx" ON "social_engagements"("postId");

-- CreateIndex
CREATE INDEX "reports_organizationId_idx" ON "reports"("organizationId");

-- CreateIndex
CREATE INDEX "reports_clientId_idx" ON "reports"("clientId");

-- CreateIndex
CREATE INDEX "report_sections_reportId_idx" ON "report_sections"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "report_sections_reportId_key_key" ON "report_sections"("reportId", "key");

-- CreateIndex
CREATE INDEX "report_metrics_reportId_idx" ON "report_metrics"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "report_metrics_reportId_key_key" ON "report_metrics"("reportId", "key");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_platforms" ADD CONSTRAINT "client_platforms_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_platforms" ADD CONSTRAINT "client_platforms_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads" ADD CONSTRAINT "ads_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads" ADD CONSTRAINT "ads_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads" ADD CONSTRAINT "ads_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_metrics" ADD CONSTRAINT "performance_metrics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_metrics" ADD CONSTRAINT "performance_metrics_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_metrics" ADD CONSTRAINT "performance_metrics_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_metrics" ADD CONSTRAINT "performance_metrics_adId_fkey" FOREIGN KEY ("adId") REFERENCES "ads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_engagements" ADD CONSTRAINT "social_engagements_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_engagements" ADD CONSTRAINT "social_engagements_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_sections" ADD CONSTRAINT "report_sections_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_metrics" ADD CONSTRAINT "report_metrics_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

