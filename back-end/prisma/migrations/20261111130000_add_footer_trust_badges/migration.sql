CREATE TABLE "FooterTrustBadge" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "imageUrl" VARCHAR(500) NOT NULL,
    "altText" VARCHAR(180) NOT NULL,
    "linkUrl" VARCHAR(2048),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FooterTrustBadge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FooterTrustBadge_isActive_sortOrder_id_idx"
ON "FooterTrustBadge"("isActive", "sortOrder", "id");