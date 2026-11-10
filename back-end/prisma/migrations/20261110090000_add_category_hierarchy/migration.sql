ALTER TABLE "Category" ADD COLUMN "parentId" INTEGER, ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "Category_parentId_sortOrder_idx" ON "Category"("parentId","sortOrder");
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
