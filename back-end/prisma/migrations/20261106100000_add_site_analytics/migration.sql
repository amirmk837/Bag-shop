ALTER TABLE "User" ADD COLUMN "lastLoginAt" TIMESTAMP(3);

CREATE TABLE "SiteVisitEvent" (
  "id" BIGSERIAL NOT NULL,
  "visitorId" TEXT NOT NULL,
  "userId" INTEGER,
  "path" VARCHAR(180) NOT NULL,
  "referrerHost" VARCHAR(255),
  "deviceType" VARCHAR(24) NOT NULL,
  "operatingSystem" VARCHAR(40) NOT NULL,
  "browser" VARCHAR(40) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SiteVisitEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SiteVisitEvent_createdAt_idx" ON "SiteVisitEvent"("createdAt");
CREATE INDEX "SiteVisitEvent_visitorId_createdAt_idx" ON "SiteVisitEvent"("visitorId", "createdAt");
CREATE INDEX "SiteVisitEvent_userId_createdAt_idx" ON "SiteVisitEvent"("userId", "createdAt");
CREATE INDEX "SiteVisitEvent_path_createdAt_idx" ON "SiteVisitEvent"("path", "createdAt");
CREATE INDEX "SiteVisitEvent_referrerHost_createdAt_idx" ON "SiteVisitEvent"("referrerHost", "createdAt");

ALTER TABLE "SiteVisitEvent" ADD CONSTRAINT "SiteVisitEvent_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
