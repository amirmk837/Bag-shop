CREATE TABLE "AboutPage" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "eyebrow" VARCHAR(80) NOT NULL DEFAULT 'آشنایی با ما',
  "title" VARCHAR(160) NOT NULL DEFAULT 'درباره فروشگاه کاظمی',
  "intro" VARCHAR(600) NOT NULL DEFAULT '',
  "storyTitle" VARCHAR(120) NOT NULL DEFAULT 'داستان ما',
  "story" TEXT NOT NULL DEFAULT '',
  "mission" TEXT NOT NULL DEFAULT '',
  "vision" TEXT NOT NULL DEFAULT '',
  "values" JSONB,
  "contactText" VARCHAR(600) NOT NULL DEFAULT '',
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AboutPage_pkey" PRIMARY KEY ("id")
);

INSERT INTO "AboutPage" ("id", "updatedAt")
VALUES (1, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
