import assert from "node:assert/strict";
import test from "node:test";
import { releaseStock, reserveStock } from "../src/services/stock.service.js";

const createTransaction = ({
  colorStockCount = 0,
  colorUpdateCount = 1,
  productUpdateCount = 1,
} = {}) => {
  const calls = { colorUpdates: [], productUpdates: [] };

  return {
    calls,
    productColorStock: {
      async count() {
        return colorStockCount;
      },
      async updateMany(args) {
        calls.colorUpdates.push(args);
        return { count: colorUpdateCount };
      },
    },
    product: {
      async updateMany(args) {
        calls.productUpdates.push(args);
        return { count: productUpdateCount };
      },
    },
  };
};

test("reserves product stock using an atomic sufficient-quantity condition", async () => {
  const tx = createTransaction();

  await reserveStock(tx, {
    productId: 12,
    quantity: 2,
    title: "کوله",
  });

  assert.equal(tx.calls.productUpdates.length, 1);
  assert.deepEqual(tx.calls.productUpdates[0].where, {
    id: 12,
    count: { gte: 2 },
  });
  assert.deepEqual(tx.calls.productUpdates[0].data, {
    count: { decrement: 2 },
  });
});

test("reserves both selected color stock and aggregate product stock", async () => {
  const tx = createTransaction({ colorStockCount: 2 });

  await reserveStock(tx, {
    productId: 12,
    color: "مشکی",
    quantity: 1,
    title: "کوله",
  });

  assert.equal(tx.calls.colorUpdates.length, 1);
  assert.deepEqual(tx.calls.colorUpdates[0].where, {
    productId: 12,
    color: "مشکی",
    count: { gte: 1 },
  });
  assert.equal(tx.calls.productUpdates.length, 1);
});

test("rejects insufficient color stock before changing aggregate stock", async () => {
  const tx = createTransaction({
    colorStockCount: 1,
    colorUpdateCount: 0,
  });

  await assert.rejects(
    reserveStock(tx, {
      productId: 12,
      color: "مشکی",
      quantity: 2,
      title: "کوله",
    }),
    (error) => error.status === 409,
  );

  assert.equal(tx.calls.productUpdates.length, 0);
});

test("rejects insufficient aggregate product stock", async () => {
  const tx = createTransaction({ productUpdateCount: 0 });

  await assert.rejects(
    reserveStock(tx, { productId: 12, quantity: 3 }),
    (error) => error.status === 409,
  );
});

test("releases selected color and aggregate product stock", async () => {
  const tx = createTransaction({ colorStockCount: 1 });

  await releaseStock(tx, {
    productId: 12,
    color: "مشکی",
    quantity: 2,
  });

  assert.deepEqual(tx.calls.colorUpdates[0].data, {
    count: { increment: 2 },
  });
  assert.deepEqual(tx.calls.productUpdates[0].data, {
    count: { increment: 2 },
  });
});

test("rejects invalid stock quantities before database operations", async () => {
  const tx = createTransaction();

  await assert.rejects(
    reserveStock(tx, { productId: 12, quantity: 0 }),
    (error) => error.status === 400,
  );

  await assert.rejects(
    releaseStock(tx, { productId: 12, quantity: -1 }),
    (error) => error.status === 400,
  );

  assert.equal(tx.calls.productUpdates.length, 0);
});
