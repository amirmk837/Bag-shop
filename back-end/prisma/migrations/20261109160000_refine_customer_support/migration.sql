-- Refine customer support without touching existing conversations.
ALTER TABLE "SupportTicket" DROP COLUMN "priority";
ALTER TABLE "SupportTicket" ADD COLUMN "customerAddress" TEXT;

DROP INDEX IF EXISTS "SupportTicket_status_priority_lastMessageAt_idx";
CREATE INDEX "SupportTicket_status_lastMessageAt_idx"
  ON "SupportTicket"("status", "lastMessageAt");

ALTER TABLE "SiteSettings" ADD COLUMN "supportHours" JSONB;
ALTER TABLE "SiteSettings" ADD COLUMN "supportResponseText" VARCHAR(240);
