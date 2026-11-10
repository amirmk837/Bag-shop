import assert from "node:assert/strict";
import test from "node:test";
import {
  productSchema,
  updateProductSchema,
} from "../src/validators/product.validator.js";

const validProduct = {
  productCode: "BAG-100",
  title: "کوله تست",
  categoryId: 1,
  count: 5,
  color: null,
  price: 250000,
  discountedPrice: 200000,
  description: null,
  images: [],
};

test("accepts a valid product discount below the original price", () => {
  const result = productSchema.safeParse(validProduct);
  assert.equal(result.success, true);
});

test("accepts a product without a discount", () => {
  const result = productSchema.safeParse({
    ...validProduct,
    discountedPrice: null,
  });
  assert.equal(result.success, true);
});

test("rejects a discount equal to the original price", () => {
  const result = productSchema.safeParse({
    ...validProduct,
    discountedPrice: validProduct.price,
  });
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((issue) => issue.path.includes("discountedPrice")));
});

test("rejects a discount above the original price", () => {
  const result = productSchema.safeParse({
    ...validProduct,
    discountedPrice: validProduct.price + 1,
  });
  assert.equal(result.success, false);
});

test("rejects non-integer and non-positive discounted prices", () => {
  for (const discountedPrice of [0, -1, 1000.5]) {
    const result = productSchema.safeParse({
      ...validProduct,
      discountedPrice,
    });
    assert.equal(result.success, false);
  }
});

test("validates discounts in the product update schema too", () => {
  const { productCode, ...updateData } = validProduct;
  assert.equal(updateProductSchema.safeParse(updateData).success, true);

  assert.equal(
    updateProductSchema.safeParse({
      ...updateData,
      discountedPrice: updateData.price,
    }).success,
    false,
  );
});
