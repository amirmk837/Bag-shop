-- CreateEnum
CREATE TYPE "InventoryReturnStatus" AS ENUM ('NOT_RETURNED', 'RETURNED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "InventoryReturnIssueStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- AlterEnum
ALTER TYPE "AdminAuditAction" ADD VALUE 'ORDER_ARCHIVED';
ALTER TYPE "AdminAuditAction" ADD VALUE 'ORDER_RESTORED';
ALTER TYPE "AdminAuditAction" ADD VALUE 'ORDER_INVENTORY_RETURNED';
ALTER TYPE "AdminAuditAction" ADD VALUE 'ORDER_INVENTORY_RETURN_ISSUE_CREATED';
ALTER TYPE "AdminAuditAction" ADD VALUE 'ORDER_INVENTORY_RETURN_ISSUE_RESOLVED';

-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "archiveReason" TEXT,
ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "archivedById" INTEGER;

-- AlterTable
ALTER TABLE "OrderItem"
ADD COLUMN "inventoryReturnReceived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "inventoryReturnSaleable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "inventoryReturnStatus" "InventoryReturnStatus" NOT NULL DEFAULT 'NOT_RETURNED',
ADD COLUMN "inventoryReturnedAt" TIMESTAMP(3),
ADD COLUMN "inventoryReturnedById" INTEGER;

-- CreateTable
CREATE TABLE "InventoryReturnIssue" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "orderItemId" INTEGER,
    "productCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "InventoryReturnIssueStatus" NOT NULL DEFAULT 'OPEN',
    "resolutionNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdById" INTEGER,
    "resolvedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InventoryReturnIssue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryReturnIssue_status_createdAt_idx" ON "InventoryReturnIssue"("status", "createdAt");
CREATE INDEX "InventoryReturnIssue_orderId_idx" ON "InventoryReturnIssue"("orderId");
CREATE INDEX "InventoryReturnIssue_orderItemId_idx" ON "InventoryReturnIssue"("orderItemId");
CREATE INDEX "Order_archivedAt_createdAt_idx" ON "Order"("archivedAt", "createdAt");

-- AddForeignKey
ALTER TABLE "Order"
ADD CONSTRAINT "Order_archivedById_fkey"
FOREIGN KEY ("archivedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrderItem"
ADD CONSTRAINT "OrderItem_inventoryReturnedById_fkey"
FOREIGN KEY ("inventoryReturnedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InventoryReturnIssue"
ADD CONSTRAINT "InventoryReturnIssue_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InventoryReturnIssue"
ADD CONSTRAINT "InventoryReturnIssue_orderItemId_fkey"
FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InventoryReturnIssue"
ADD CONSTRAINT "InventoryReturnIssue_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InventoryReturnIssue"
ADD CONSTRAINT "InventoryReturnIssue_resolvedById_fkey"
FOREIGN KEY ("resolvedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
