-- CreateEnum
CREATE TYPE "CourseOwnerType" AS ENUM ('INDIVIDUAL', 'COMMUNITY', 'ORGANIZATION', 'SANGHAM');

-- Add owner_type with default COMMUNITY
ALTER TABLE "courses" ADD COLUMN "owner_type" "CourseOwnerType" NOT NULL DEFAULT 'COMMUNITY';

-- Add owner_id, backfill from association_id for all existing COMMUNITY-owned rows
ALTER TABLE "courses" ADD COLUMN "owner_id" TEXT;
UPDATE "courses" SET "owner_id" = "association_id";
ALTER TABLE "courses" ALTER COLUMN "owner_id" SET NOT NULL;

-- Make association_id nullable (individual/org courses have no community)
ALTER TABLE "courses" ALTER COLUMN "association_id" DROP NOT NULL;

-- Index for owner lookups
CREATE INDEX "courses_owner_type_owner_id_idx" ON "courses"("owner_type", "owner_id");
