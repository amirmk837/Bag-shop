-- Add an optional discounted product price. Existing prices remain unchanged.
ALTER TABLE "Product" ADD COLUMN "discountedPrice" INTEGER;

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_discountedPrice_valid"
  CHECK ("discountedPrice" IS NULL OR ("discountedPrice" > 0 AND "discountedPrice" < "price"));
