import assert from "node:assert/strict";
import test from "node:test";
import { createPopularProductsQuery } from "../src/utils/popularProductsQuery.js";

test("builds a bounded parameterized popular-products query", () => {
  const from = new Date("2026-11-01T00:00:00.000Z");
  const { query, params } = createPopularProductsQuery(from, 8);

  assert.match(query, /INNER JOIN "Product"/);
  assert.match(query, /COUNT\(DISTINCT e\."visitorId"\)/);
  assert.match(query, /p\.count > 0/);
  assert.match(query, /LIMIT \$2/);
  assert.deepEqual(params, [from, 8]);
});

test("rejects invalid dates and unsafe limits", () => {
  assert.throws(() => createPopularProductsQuery("2026-11-01"), TypeError);
  assert.throws(() => createPopularProductsQuery(new Date(), 0), TypeError);
  assert.throws(() => createPopularProductsQuery(new Date(), 21), TypeError);
});
