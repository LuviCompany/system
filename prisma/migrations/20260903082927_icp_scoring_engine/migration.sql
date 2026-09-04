-- CreateEnum
CREATE TYPE "IcpCriterionType" AS ENUM ('SEGMENTO', 'FATURAMENTO', 'TICKET', 'LOCALIZACAO', 'SITE', 'INSTAGRAM', 'INVESTIMENTO_TRAFEGO', 'MATURIDADE_COMERCIAL', 'NECESSIDADE_MARKETING', 'NECESSIDADE_TECNOLOGIA', 'POTENCIAL_RECORRENCIA');

-- CreateEnum
CREATE TYPE "LeadPriority" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'MAXIMA');

-- DropForeignKey
ALTER TABLE "icp_criteria" DROP CONSTRAINT "icp_criteria_organizationId_fkey";

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "adSpend" DECIMAL(12,2),
ADD COLUMN     "commercialMaturity" INTEGER,
ADD COLUMN     "estimatedRevenue" DECIMAL(14,2),
ADD COLUMN     "marketingNeed" INTEGER,
ADD COLUMN     "priority" "LeadPriority" NOT NULL DEFAULT 'BAIXA',
ADD COLUMN     "recurrencePotential" INTEGER,
ADD COLUMN     "technologyNeed" INTEGER;

-- DropTable
DROP TABLE "icp_criteria";

-- CreateTable
CREATE TABLE "icp_profiles" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "icp_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "icp_profile_criteria" (
    "id" TEXT NOT NULL,
    "icpProfileId" TEXT NOT NULL,
    "type" "IcpCriterionType" NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "icp_profile_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "icp_profile_criterion_rules" (
    "id" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "minValue" DECIMAL(14,2),
    "maxValue" DECIMAL(14,2),
    "matchValues" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "score" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "icp_profile_criterion_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_scores" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "icpProfileId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "priority" "LeadPriority" NOT NULL DEFAULT 'BAIXA',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_score_factors" (
    "id" TEXT NOT NULL,
    "leadScoreId" TEXT NOT NULL,
    "type" "IcpCriterionType" NOT NULL,
    "label" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "rawScore" INTEGER NOT NULL,
    "contribution" INTEGER NOT NULL,

    CONSTRAINT "lead_score_factors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "icp_profiles_organizationId_idx" ON "icp_profiles"("organizationId");

-- CreateIndex
CREATE INDEX "icp_profiles_organizationId_isActive_idx" ON "icp_profiles"("organizationId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "icp_profile_criteria_icpProfileId_type_key" ON "icp_profile_criteria"("icpProfileId", "type");

-- CreateIndex
CREATE INDEX "icp_profile_criterion_rules_criterionId_idx" ON "icp_profile_criterion_rules"("criterionId");

-- CreateIndex
CREATE UNIQUE INDEX "lead_scores_leadId_key" ON "lead_scores"("leadId");

-- CreateIndex
CREATE INDEX "lead_scores_organizationId_idx" ON "lead_scores"("organizationId");

-- CreateIndex
CREATE INDEX "lead_score_factors_leadScoreId_idx" ON "lead_score_factors"("leadScoreId");

-- CreateIndex
CREATE INDEX "leads_organizationId_priority_idx" ON "leads"("organizationId", "priority");

-- CreateIndex
CREATE INDEX "leads_organizationId_icpScore_idx" ON "leads"("organizationId", "icpScore");

-- AddForeignKey
ALTER TABLE "icp_profiles" ADD CONSTRAINT "icp_profiles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "icp_profile_criteria" ADD CONSTRAINT "icp_profile_criteria_icpProfileId_fkey" FOREIGN KEY ("icpProfileId") REFERENCES "icp_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "icp_profile_criterion_rules" ADD CONSTRAINT "icp_profile_criterion_rules_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "icp_profile_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_scores" ADD CONSTRAINT "lead_scores_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_scores" ADD CONSTRAINT "lead_scores_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_scores" ADD CONSTRAINT "lead_scores_icpProfileId_fkey" FOREIGN KEY ("icpProfileId") REFERENCES "icp_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_score_factors" ADD CONSTRAINT "lead_score_factors_leadScoreId_fkey" FOREIGN KEY ("leadScoreId") REFERENCES "lead_scores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

