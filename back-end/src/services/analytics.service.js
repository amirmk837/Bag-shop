import prisma from "../config/prisma.js";

const parseDays = (value) => {
  const days = Number(value);
  return Number.isInteger(days) && days >= 1 ? Math.min(days, 90) : 30;
};

export const recordVisit = (data) => prisma.siteVisitEvent.create({
  data: {
    visitorId: data.visitorId,
    userId: data.userId,
    path: data.path,
    referrerHost: data.referrerHost || null,
    deviceType: data.deviceType,
    operatingSystem: data.operatingSystem,
    browser: data.browser,
  },
  select: { id: true },
});

export const getAnalyticsReport = async (requestedDays) => {
  const days = parseDays(requestedDays);
  const filter = `"createdAt" >= NOW() - ($1::int * INTERVAL '1 day')`;

  const [summaryRows, daily, topPages, sources, devices, recentVisitors] = await Promise.all([
    prisma.$queryRawUnsafe(`
      SELECT COUNT(*)::int AS "pageViews",
        COUNT(DISTINCT "visitorId")::int AS "uniqueVisitors",
        COUNT(DISTINCT "userId") FILTER (WHERE "userId" IS NOT NULL)::int AS "identifiedUsers",
        COUNT(*) FILTER (WHERE "userId" IS NULL)::int AS "anonymousPageViews"
      FROM "SiteVisitEvent" WHERE ${filter}
    `, days),
    prisma.$queryRawUnsafe(`
      SELECT TO_CHAR(DATE("createdAt"), 'YYYY-MM-DD') AS day,
        COUNT(*)::int AS views, COUNT(DISTINCT "visitorId")::int AS visitors
      FROM "SiteVisitEvent" WHERE ${filter}
      GROUP BY DATE("createdAt") ORDER BY DATE("createdAt")
    `, days),
    prisma.$queryRawUnsafe(`
      SELECT path, COUNT(*)::int AS views FROM "SiteVisitEvent"
      WHERE ${filter} GROUP BY path ORDER BY views DESC LIMIT 8
    `, days),
    prisma.$queryRawUnsafe(`
      SELECT COALESCE("referrerHost", 'ورود مستقیم') AS source, COUNT(*)::int AS views
      FROM "SiteVisitEvent" WHERE ${filter}
      GROUP BY "referrerHost" ORDER BY views DESC LIMIT 8
    `, days),
    prisma.$queryRawUnsafe(`
      SELECT "deviceType" AS device, "operatingSystem" AS os, COUNT(*)::int AS views
      FROM "SiteVisitEvent" WHERE ${filter}
      GROUP BY "deviceType", "operatingSystem" ORDER BY views DESC LIMIT 8
    `, days),
    prisma.$queryRawUnsafe(`
      WITH latest AS (
        SELECT DISTINCT ON ("visitorId", "userId")
          "visitorId", "userId", path, "deviceType", "operatingSystem", browser, "createdAt"
        FROM "SiteVisitEvent" WHERE ${filter}
        ORDER BY "visitorId", "userId", "createdAt" DESC
      )
      SELECT latest."visitorId", latest."userId", latest.path,
        latest."deviceType", latest."operatingSystem", latest.browser, latest."createdAt",
        u.username, u.phone
      FROM latest LEFT JOIN "User" u ON u.id = latest."userId"
      ORDER BY latest."createdAt" DESC LIMIT 50
    `, days),
  ]);

  return {
    rangeDays: days,
    summary: summaryRows[0] || { pageViews: 0, uniqueVisitors: 0, identifiedUsers: 0, anonymousPageViews: 0 },
    daily, topPages, sources, devices, recentVisitors,
  };
};

export const getLoggedInUsers = async ({ page = 1, pageSize = 20 } = {}) => {
  const safePage = Math.max(1, Math.min(Number.parseInt(page, 10) || 1, 100000));
  const safeSize = Math.max(1, Math.min(Number.parseInt(pageSize, 10) || 20, 50));
  const [total, items] = await Promise.all([
    prisma.user.count({ where: { lastLoginAt: { not: null } } }),
    prisma.user.findMany({
      where: { lastLoginAt: { not: null } },
      orderBy: { lastLoginAt: "desc" },
      skip: (safePage - 1) * safeSize,
      take: safeSize,
      select: { id: true, username: true, phone: true, role: true, lastLoginAt: true, createdAt: true },
    }),
  ]);
  return { items, pagination: { page: safePage, pageSize: safeSize, total, totalPages: Math.ceil(total / safeSize) } };
};
