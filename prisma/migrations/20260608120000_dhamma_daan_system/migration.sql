-- Migration: dhamma_daan_system
-- Adds Dhamma Daan financial contribution system (P5)

-- Enums
CREATE TYPE "ContributionStatus" AS ENUM ('PENDING', 'CAPTURED', 'FAILED', 'REFUNDED');

CREATE TYPE "AllocationCategory" AS ENUM (
  'TRANSLATION', 'EDUCATION', 'STUDENT_SUPPORT', 'COMMUNITY_DEV',
  'LITERATURE', 'DIGITAL_INFRA', 'RESEARCH', 'SOCIAL_SERVICE', 'EVENTS'
);

-- Add contributor fields to users
ALTER TABLE "users"
  ADD COLUMN "is_contributor"    BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN "contributor_since" TIMESTAMP(3);

-- Dhamma Daan Contributions table
CREATE TABLE "dhamma_daan_contributions" (
  "id"                   TEXT        NOT NULL,
  "user_id"              TEXT        NOT NULL,
  "amount_paise"         INTEGER     NOT NULL,
  "currency"             TEXT        NOT NULL DEFAULT 'INR',
  "razorpay_order_id"    TEXT        NOT NULL,
  "razorpay_payment_id"  TEXT,
  "razorpay_signature"   TEXT,
  "status"               "ContributionStatus" NOT NULL DEFAULT 'PENDING',
  "split_platform_paise" INTEGER     NOT NULL,
  "split_fund_paise"     INTEGER     NOT NULL,
  "created_at"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "captured_at"          TIMESTAMP(3),

  CONSTRAINT "dhamma_daan_contributions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "dhamma_daan_contributions_razorpay_order_id_key"
  ON "dhamma_daan_contributions"("razorpay_order_id");

ALTER TABLE "dhamma_daan_contributions"
  ADD CONSTRAINT "dhamma_daan_contributions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Dhamma Daan Allocations table (admin-managed fund disbursements)
CREATE TABLE "dhamma_daan_allocations" (
  "id"            TEXT        NOT NULL,
  "title"         TEXT        NOT NULL,
  "description"   TEXT        NOT NULL,
  "category"      "AllocationCategory" NOT NULL,
  "amount_paise"  INTEGER     NOT NULL,
  "currency"      TEXT        NOT NULL DEFAULT 'INR',
  "beneficiary"   TEXT,
  "impact_report" TEXT,
  "allocated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by"    TEXT        NOT NULL,

  CONSTRAINT "dhamma_daan_allocations_pkey" PRIMARY KEY ("id")
);
