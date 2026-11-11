ALTER TABLE "SocialLink"
  ALTER COLUMN "platform" TYPE TEXT USING "platform"::text;

ALTER TABLE "SocialLink"
  ADD COLUMN "label" TEXT;

UPDATE "SocialLink"
SET "label" = CASE "platform"
  WHEN 'INSTAGRAM' THEN 'اینستاگرام'
  WHEN 'TELEGRAM' THEN 'تلگرام'
  WHEN 'WHATSAPP' THEN 'واتساپ'
  WHEN 'BALE' THEN 'بله'
  WHEN 'RUBIKA' THEN 'روبیکا'
  ELSE "platform"
END;

ALTER TABLE "SocialLink"
  ALTER COLUMN "label" SET NOT NULL;

DROP TYPE "SocialPlatform";

INSERT INTO "SocialLink" ("platform", "label", "url", "channelName", "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES
  ('INSTAGRAM', 'اینستاگرام', NULL, NULL, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('TELEGRAM', 'تلگرام', NULL, NULL, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('WHATSAPP', 'واتساپ', NULL, NULL, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('BALE', 'بله', NULL, NULL, true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('RUBIKA', 'روبیکا', NULL, NULL, true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("platform") DO NOTHING;
