import assert from "node:assert/strict";
import test from "node:test";
import { createMonthlySalesAggregateQuery } from "../src/utils/monthlySalesQuery.js";

test("builds one bounded, parameterized aggregate query for every month", () => {
  const months = [
    {
      start: new Date("2026-01-01T20:30:00.000Z"),
      end: new Date("2026-01-31T20:30:00.000Z"),
    },
    {
      start: new Date("2026-01-31T20:30:00.000Z"),
      end: new Date("2026-03-02T20:30:00.000Z"),
    },
  ];

  const { query, params } = createMonthlySalesAggregateQuery(months);

  assert.match(query, /COUNT\(\*\)::int AS "orderCount"/);
  assert.match(query, /SUM\("totalAmount"\)/);
  assert.match(query, /GROUP BY 1/);
  assert.match(query, /"status" IN \(\$7, \$8, \$9, \$10, \$11\)/);
  assert.match(query, /THEN 0/);
  assert.match(query, /THEN 1/);
  assert.equal(params.length, 11);
  assert.equal(params[0], months[0].start);
  assert.equal(params[1], months[1].end);
  assert.deepEqual(params.slice(6), [
    "PAID",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
  ]);
});

test("rejects empty or invalid query inputs", () => {
  assert.throws(() => createMonthlySalesAggregateQuery([]), TypeError);
  assert.throws(
    () => createMonthlySalesAggregateQuery([{ start: new Date(), end: new Date() }], []),
    TypeError,
  );
});
