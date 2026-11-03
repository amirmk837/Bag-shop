-- Preserve order/payment records when a customer account is permanently deleted.
ALTER TABLE "Order"
  DROP CONSTRAINT "Order_userId_fkey";

ALTER TABLE "Order"
  ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Audit records survive deletion of the admin account that created them.
ALTER TABLE "AdminAuditLog"
  DROP CONSTRAINT "AdminAuditLog_adminId_fkey";

ALTER TABLE "AdminAuditLog"
  ALTER COLUMN "adminId" DROP NOT NULL;

ALTER TABLE "AdminAuditLog"
  ADD CONSTRAINT "AdminAuditLog_adminId_fkey"
  FOREIGN KEY ("adminId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TYPE "AdminAuditAction" ADD VALUE IF NOT EXISTS 'USER_DELETED';
