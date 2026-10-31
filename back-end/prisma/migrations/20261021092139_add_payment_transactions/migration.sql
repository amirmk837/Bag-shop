-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'REQUESTED', 'PAID', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'ZARINPAL',
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "amountRial" INTEGER NOT NULL,
    "authority" TEXT,
    "refId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_authority_key" ON "Payment"("authority");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_refId_key" ON "Payment"("refId");

-- CreateIndex
CREATE INDEX "Payment_orderId_status_idx" ON "Payment"("orderId", "status");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
