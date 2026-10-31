-- Track inventory release per order to prevent duplicate stock restoration.
ALTER TABLE "Order" ADD COLUMN "stockReleasedAt" TIMESTAMP(3);

-- Existing cancelled orders have already released their reserved inventory.
UPDATE "Order"
SET "stockReleasedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP)
WHERE "status" = 'CANCELLED' AND "stockReleasedAt" IS NULL;
