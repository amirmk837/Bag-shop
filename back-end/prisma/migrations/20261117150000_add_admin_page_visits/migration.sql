CREATE TABLE "AdminPageVisit" (
    "id" SERIAL NOT NULL,
    "adminId" INTEGER NOT NULL,
    "path" VARCHAR(120) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminPageVisit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminPageVisit_adminId_createdAt_idx"
ON "AdminPageVisit"("adminId", "createdAt");

CREATE INDEX "AdminPageVisit_createdAt_idx"
ON "AdminPageVisit"("createdAt");

ALTER TABLE "AdminPageVisit"
ADD CONSTRAINT "AdminPageVisit_adminId_fkey"
FOREIGN KEY ("adminId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
