-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "IntegrationStatus" ADD VALUE 'SINCRONIZANDO';
ALTER TYPE "IntegrationStatus" ADD VALUE 'ERRO';

-- AlterTable
ALTER TABLE "client_platforms" ADD COLUMN     "accessTokenEncrypted" TEXT,
ADD COLUMN     "externalAccountId" TEXT,
ADD COLUMN     "lastSyncAt" TIMESTAMP(3),
ADD COLUMN     "lastSyncError" TEXT,
ADD COLUMN     "lastSyncStatus" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "refreshTokenEncrypted" TEXT,
ADD COLUMN     "tokenExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "externalId" TEXT;

-- AlterTable
ALTER TABLE "ads" ADD COLUMN     "adGroupExternalId" TEXT,
ADD COLUMN     "adGroupName" TEXT,
ADD COLUMN     "externalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_clientId_platform_externalId_key" ON "campaigns"("clientId", "platform", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "ads_clientId_platform_externalId_key" ON "ads"("clientId", "platform", "externalId");

