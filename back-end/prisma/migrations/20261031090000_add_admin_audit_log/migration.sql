CREATE TYPE "AdminAuditAction" AS ENUM (
  'PAYMENT_RECONCILIATION',
  'PAYMENT_EXPIRED_UNSENT'
);

CREATE TABLE "AdminAuditLog" (
  "id" SERIAL NOT NULL,
  "adminId" INTEGER NOT NULL,
  "action" "AdminAuditAction" NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" INTEGER NOT NULL,
  "orderId" INTEGER,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminAuditLog_adminId_createdAt_idx"
  ON "AdminAuditLog"("adminId", "createdAt");
CREATE INDEX "AdminAuditLog_targetType_targetId_createdAt_idx"
  ON "AdminAuditLog"("targetType", "targetId", "createdAt");
CREATE INDEX "AdminAuditLog_orderId_createdAt_idx"
  ON "AdminAuditLog"("orderId", "createdAt");

ALTER TABLE "AdminAuditLog"
  ADD CONSTRAINT "AdminAuditLog_adminId_fkey"
  FOREIGN KEY ("adminId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
