import prisma from "../config/prisma.js";

const SALES_STATUSES = ["PAID", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

const parseDays = (value) => {
  const days = Number(value);
  return Number.isInteger(days) && days >= 1 ? Math.min(days, 90) : 30;
};

const parseUserAgent = (value = "") => {
  const ua = String(value).slice(0, 1000);
  const deviceType = /iPad|Tablet|Android(?!.*Mobile)/i.test(ua)
    ? "tablet"
    : /Mobi|Android|iPhone|iPod/i.test(ua)
      ? "mobile"
      : "desktop";
  const operatingSystem = /Windows/i.test(ua) ? "Windows"
    : /Android/i.test(ua) ? "Android"
      : /iPhone|iPad|iPod/i.test(ua) ? "iOS"
        : /Mac OS|Macintosh/i.test(ua) ? "macOS"
          : /Linux/i.test(ua) ? "Linux" : "Other";
  const browser = /Edg\//i.test(ua) ? "Edge"
    : /OPR\//i.test(ua) ? "Opera"
      : /Firefox\//i.test(ua) ? "Firefox"
        : /Chrome\//i.test(ua) || /CriOS\//i.test(ua) ? "Chrome"
          : /Safari\//i.test(ua) ? "Safari" : "Other";
  return { deviceType, operatingSystem, browser };
};

export const recordSiteVisit = async ({ visitorId, path, userAgent, referer }) => {
  if (typeof visitorId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorId)) {
    return false;
  }

  const safePath = typeof path === "string" ? path.split(/[?#]/, 1)[0] : "";
  if (!safePath.startsWith("/") || safePath.startsWith("//") ||
      safePath.length > 180 || /[\u0000-\u001f]/.test(safePath) ||
      /^\/admin(?:\/|$)/i.test(safePath)) {
    return false;
  }

  if (/bot|crawler|spider|headless|lighthouse|pagespeed/i.test(String(userAgent || ""))) {
    return false;
  }

  const recentVisit = await prisma.siteVisitEvent.findFirst({
    where: {
      visitorId,
      path: safePath,
      createdAt: { gte: new Date(Date.now() - 10_000) },
    },
    select: { id: true },
  });
  if (recentVisit) return false;

  let referrerHost = null;
  try {
    if (referer) referrerHost = new URL(referer).hostname.slice(0, 255) || null;
  } catch {
    referrerHost = null;
  }

  await prisma.siteVisitEvent.create({
    data: {
      visitorId,
      path: safePath,
      referrerHost,
      ...parseUserAgent(userAgent),
    },
  });
  return true;
};

const getSiteVisitReport = async (from) => {
  const [summaryRows, daily] = await Promise.all([
    prisma.$queryRaw`
      SELECT
        COUNT(*)::int AS "pageViews",
        COUNT(DISTINCT "visitorId")::int AS "uniqueVisitors"
      FROM "SiteVisitEvent"
      WHERE "createdAt" >= ${from}
    `,
    prisma.$queryRaw`
      SELECT
        TO_CHAR(DATE_TRUNC('day', "createdAt" AT TIME ZONE 'Asia/Tehran'), 'YYYY-MM-DD') AS "date",
        COUNT(*)::int AS "pageViews",
        COUNT(DISTINCT "visitorId")::int AS "uniqueVisitors"
      FROM "SiteVisitEvent"
      WHERE "createdAt" >= ${from}
      GROUP BY 1
      ORDER BY 1 ASC
    `,
  ]);

  return {
    summary: summaryRows[0] || { pageViews: 0, uniqueVisitors: 0 },
    daily,
  };
};

// گزارش مدیریتی بر اساس داده‌های واقعی فروش، سفارش، مشتری و بازدید
export const getAnalyticsReport = async (requestedDays) => {
  const days = parseDays(requestedDays);
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const periodOrders = { createdAt: { gte: from } };
  const successfulOrders = {
    ...periodOrders,
    status: { in: SALES_STATUSES },
  };

  const [
    orderCount,
    successfulSales,
    newCustomers,
    totalCustomers,
    statusGroups,
    bestSellingGroups,
    siteVisits,
  ] = await Promise.all([
    prisma.order.count({ where: periodOrders }),
    prisma.order.aggregate({
      where: successfulOrders,
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),
    prisma.user.count({
      where: { role: "USER", isActive: true, deletedAt: null, createdAt: { gte: from } },
    }),
    prisma.user.count({
      where: { role: "USER", isActive: true, deletedAt: null },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: periodOrders,
      _count: { _all: true },
      orderBy: { status: "asc" },
    }),
    prisma.orderItem.groupBy({
      by: ["productCode", "title"],
      where: {
        order: {
          createdAt: { gte: from },
          status: { in: SALES_STATUSES },
        },
      },
      _sum: { quantity: true, subtotal: true },
      orderBy: [{ _sum: { quantity: "desc" } }, { productCode: "asc" }],
      take: 8,
    }),
    getSiteVisitReport(from),
  ]);

  const paidOrders = successfulSales._count._all;
  const paidRevenue = successfulSales._sum.totalAmount || 0;
  const statusCounts = Object.fromEntries(
    statusGroups.map((group) => [group.status, group._count._all]),
  );

  return {
    rangeDays: days,
    summary: {
      totalOrders: orderCount,
      paidOrders,
      paidRevenue,
      averageOrderValue: paidOrders ? Math.round(paidRevenue / paidOrders) : 0,
      newCustomers,
      totalCustomers,
      pendingOrders: statusCounts.PENDING || 0,
      cancelledOrders: statusCounts.CANCELLED || 0,
    },
    siteVisits,
    orderStatuses: statusGroups.map((group) => ({
      status: group.status,
      count: group._count._all,
    })),
    bestSellingProducts: bestSellingGroups.map((group) => ({
      productCode: group.productCode,
      title: group.title,
      quantitySold: group._sum.quantity || 0,
      revenue: group._sum.subtotal || 0,
    })),
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
