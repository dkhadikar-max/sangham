-- Dhamma Daan monthly subscriptions
-- razorpay_order_id becomes optional (subscriptions have no order_id)
ALTER TABLE "dhamma_daan_contributions" ALTER COLUMN "razorpay_order_id" DROP NOT NULL;

-- Razorpay subscription ID (unique per subscription)
ALTER TABLE "dhamma_daan_contributions" ADD COLUMN "razorpay_subscription_id" TEXT;
CREATE UNIQUE INDEX "dhamma_daan_contributions_razorpay_subscription_id_key"
  ON "dhamma_daan_contributions"("razorpay_subscription_id");

-- Flag to distinguish one-time vs monthly
ALTER TABLE "dhamma_daan_contributions" ADD COLUMN "is_monthly" BOOLEAN NOT NULL DEFAULT false;
