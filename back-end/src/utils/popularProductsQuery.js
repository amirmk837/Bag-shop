// Build a bounded, parameterized product-view ranking query.
// SiteVisitEvent already filters bots and duplicate visitor/path hits in its writer.
export const createPopularProductsQuery = (from, limit = 8) => {
  if (!(from instanceof Date) || Number.isNaN(from.getTime())) {
    throw new TypeError("A valid start date is required.");
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    throw new TypeError("Limit must be an integer between 1 and 20.");
  }

  return {
    query: `
      SELECT
        p.id,
        p."productCode",
        p.title,
        p.price,
        p."discountedPrice",
        p.images AS images,
        COUNT(*)::int AS "viewCount",
        COUNT(DISTINCT e."visitorId")::int AS "uniqueVisitors"
      FROM "SiteVisitEvent" e
      INNER JOIN "Product" p
        ON p."productCode" = SUBSTRING(e.path FROM '^/product/([^/]+)$')
      WHERE e.path ~ '^/product/[^/]+$'
        AND e."createdAt" >= $1
        AND p.count > 0
      GROUP BY p.id, p."productCode", p.title, p.price, p."discountedPrice", p.images
      ORDER BY "viewCount" DESC, "uniqueVisitors" DESC, p.id ASC
      LIMIT $2
    `,
    params: [from, limit],
  };
};
