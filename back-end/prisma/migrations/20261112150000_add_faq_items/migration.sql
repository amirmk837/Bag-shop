CREATE TABLE "FaqItem" (
    "id" SERIAL NOT NULL,
    "question" VARCHAR(240) NOT NULL,
    "answer" TEXT NOT NULL,
    "linkText" VARCHAR(80),
    "linkUrl" VARCHAR(2048),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaqItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FaqItem_isActive_sortOrder_id_idx"
ON "FaqItem"("isActive", "sortOrder", "id");
