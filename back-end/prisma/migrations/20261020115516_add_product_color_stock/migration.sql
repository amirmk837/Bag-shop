-- CreateTable
CREATE TABLE "ProductColorStock" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductColorStock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductColorStock_productId_idx" ON "ProductColorStock"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductColorStock_productId_color_key" ON "ProductColorStock"("productId", "color");

-- AddForeignKey
ALTER TABLE "ProductColorStock" ADD CONSTRAINT "ProductColorStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
