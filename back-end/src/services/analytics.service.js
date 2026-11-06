import prisma from "../config/prisma.js";

const SALES_STATUSES = ["PAID", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

const parseDays = (value) => {
  const days = Number(value);
  return Number.isInteger(days) && days >= 1 ? Math.min(days, 90) : 30;
};

// گزارش مدیریتی بر اساس داده‌های واقعی فروش، سفارش و مشتری
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
