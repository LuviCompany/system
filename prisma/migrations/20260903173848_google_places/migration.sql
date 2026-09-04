-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EnrichmentField" ADD VALUE 'RATING';
ALTER TYPE "EnrichmentField" ADD VALUE 'USER_RATING_COUNT';

-- AlterEnum
ALTER TYPE "LeadSource" ADD VALUE 'GOOGLE_PLACES';

-- AlterTable
ALTER TABLE "lead_search_results" ADD COLUMN     "address" TEXT,
ADD COLUMN     "rating" DOUBLE PRECISION,
ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "type" TEXT,
ADD COLUMN     "userRatingCount" INTEGER;

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "sourceUrl" TEXT;

-- CreateIndex
CREATE INDEX "leads_organizationId_externalId_idx" ON "leads"("organizationId", "externalId");

