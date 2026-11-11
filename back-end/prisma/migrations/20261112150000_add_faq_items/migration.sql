CREATE TABLE "FAQItem" (
    "id" SERIAL NOT NULL,
    "question" VARCHAR(240) NOT NULL,
    "answer" TEXT NOT NULL,
    "linkText" VARCHAR(80),
    "linkUrl" VARCHAR(2048),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FAQItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FAQItem_isActive_sortOrder_id_idx"
ON "FAQItem"("isActive", "sortOrder", "id");
