-- Remove the unused product-comment priority metadata.
DROP INDEX IF EXISTS "ProductComment_status_priority_createdAt_idx";

ALTER TABLE "ProductComment" DROP COLUMN "priority";

DROP TYPE "SupportPriority";

CREATE INDEX "ProductComment_status_createdAt_idx"
  ON "ProductComment"("status", "createdAt");
