ALTER TABLE "SocialLink"
  ADD COLUMN "channelName" TEXT,
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "SocialLink_isActive_sortOrder_idx"
  ON "SocialLink"("isActive", "sortOrder");
