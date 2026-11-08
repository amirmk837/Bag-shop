const DEFAULT_SALES_STATUSES = [
  "PAID",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

// Build one parameterized aggregate query for all Persian-calendar month ranges.
// Only the bounded monthly totals/counts return to Node.js, not every order row.
export const createMonthlySalesAggregateQuery = (
  months,
  statuses = DEFAULT_SALES_STATUSES,
) => {
  if (!Array.isArray(months) || months.length === 0) {
    throw new TypeError("At least one monthly range is required.");
  }

  if (!Array.isArray(statuses) || statuses.length === 0) {
    throw new TypeError("At least one sales status is required.");
  }

  const params = [months[0].start, months[months.length - 1].end];
  const monthCases = months.map((month, index) => {
    const startIndex = params.length + 1;
    params.push(month.start, month.end);
    return `WHEN "createdAt" >= $${startIndex} AND "createdAt" < $${startIndex + 1} THEN ${index}`;
  });

  const statusPlaceholders = statuses.map((status) => {
    params.push(status);
    return `$${params.length}`;
  });

  return {
    query: `
      SELECT
        CASE
          ${monthCases.join("\n          ")}
          ELSE NULL
        END AS "monthIndex",
        COUNT(*)::int AS "orderCount",
        COALESCE(SUM("totalAmount"), 0)::bigint AS "total"
      FROM "Order"
      WHERE "status" IN (${statusPlaceholders.join(", ")})
        AND "createdAt" >= $1
        AND "createdAt" < $2
      GROUP BY 1
    `,
    params,
  };
};
