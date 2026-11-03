import prisma from "../config/prisma.js";

// فقط سفارش‌هایی که فروش محسوب می‌شوند.
const SALES_STATUSES = [
  "PAID",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

const tehranDateFormatter = new Intl.DateTimeFormat(
  "fa-IR-u-ca-persian-nu-latn",
  {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  },
);
const persianMonthFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  timeZone: "Asia/Tehran",
  month: "long",
});

const getDateParts = (date, formatter) =>
  Object.fromEntries(
    formatter.formatToParts(date).map(({ type, value }) => [type, value]),
  );

const getPersianMonthKey = (date) => {
  const parts = getDateParts(date, tehranDateFormatter);
  const year = String(parts.year).replace(/\D/g, "");
  const month = String(parts.month).replace(/\D/g, "").padStart(2, "0");
  return `${year}-${month}`;
};

// نیمه‌شب تهران (UTC+03:30) را به Date قابل استفاده در دیتابیس تبدیل می‌کند.
const tehranMidnight = (year, month, day) =>
  new Date(Date.UTC(year, month - 1, day) - 210 * 60_000);

const buildPersianMonths = (now) => {
  const monthsByKey = new Map();
  const cursor = new Date(now.getTime() - 410 * 86_400_000);
  const limit = new Date(now.getTime() + 40 * 86_400_000);
  const gregorianFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });

  while (cursor <= limit) {
    // ساعت ۱۲ UTC در تهران همان روز و ساعت ۱۵:۳۰ است.
    const probe = new Date(
      Date.UTC(
        cursor.getUTCFullYear(),
        cursor.getUTCMonth(),
        cursor.getUTCDate(),
        12,
      ),
    );
    const persianParts = getDateParts(probe, tehranDateFormatter);
    const day = String(persianParts.day).replace(/\D/g, "");

    if (day === "1") {
      const key = getPersianMonthKey(probe);

      if (!monthsByKey.has(key)) {
        const gregorianParts = getDateParts(probe, gregorianFormatter);
        monthsByKey.set(key, {
          key,
          label: persianMonthFormatter.format(probe),
          start: tehranMidnight(
            Number(gregorianParts.year),
            Number(gregorianParts.month),
            Number(gregorianParts.day),
          ),
          total: 0,
          orderCount: 0,
        });
      }
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const allMonths = [...monthsByKey.values()].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
  const visibleMonths = allMonths.filter((month) => month.start <= now).slice(-12);

  return visibleMonths.map((month) => {
    const index = allMonths.findIndex((item) => item.key === month.key);
    return {
      ...month,
      end: allMonths[index + 1]?.start ?? new Date(now.getTime() + 1),
    };
  });
};

export const getAdminDashboard = async () => {
  const now = new Date();
  const monthlySales = buildPersianMonths(now);

  if (monthlySales.length === 0) {
    throw new Error("ساخت بازه ماه‌های داشبورد ناموفق بود.");
  }

  const firstMonthStart = monthlySales[0].start;
  const nextMonthStart = monthlySales[monthlySales.length - 1].end;
  const monthlySalesMap = new Map(
    monthlySales.map((month) => [month.key, month]),
  );

  const [
    monthlyOrders,
    recentOrders,
    customerGroups,
    bestSellingGroups,
    outOfStockCount,
    lowStockCount,
    outOfStockProducts,
    lowStockProducts,
    totalProducts,
    totalOrders,
  ] = await Promise.all([
    prisma.order.findMany({
      where: {
        status: { in: SALES_STATUSES },
        createdAt: { gte: firstMonthStart, lt: nextMonthStart },
      },
      select: { createdAt: true, totalAmount: true },
    }),

    prisma.order.findMany({
      take: 3,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        user: {
          select: { id: true, username: true, phone: true },
        },
        items: {
          select: { id: true, title: true, quantity: true },
        },
      },
    }),

    prisma.order.groupBy({
      by: ["userId"],
      where: { status: { in: SALES_STATUSES } },
      _count: { userId: true },
      _sum: { totalAmount: true },
      orderBy: [
        { _count: { userId: "desc" } },
        { _sum: { totalAmount: "desc" } },
      ],
      take: 3,
    }),

    prisma.orderItem.groupBy({
      by: ["productCode", "title"],
      where: { order: { status: { in: SALES_STATUSES } } },
      _sum: { quantity: true, subtotal: true },
      orderBy: [
        { _sum: { quantity: "desc" } },
        { productCode: "asc" },
      ],
      take: 5,
    }),

    prisma.product.count({ where: { count: { lte: 0 } } }),
    prisma.product.count({ where: { count: 1 } }),

    prisma.product.findMany({
      where: { count: { lte: 0 } },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: 6,
      select: {
        id: true,
        productCode: true,
        title: true,
        brand: true,
        count: true,
      },
    }),

    prisma.product.findMany({
      where: { count: 1 },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: 6,
      select: {
        id: true,
        productCode: true,
        title: true,
        brand: true,
        count: true,
      },
    }),

    prisma.product.count(),
    prisma.order.count(),
  ]);

  for (const order of monthlyOrders) {
    const month = monthlySalesMap.get(getPersianMonthKey(order.createdAt));
    if (!month) continue;

    month.total += order.totalAmount;
    month.orderCount += 1;
  }

  const customerIds = customerGroups.map((group) => group.userId);
  const customers = customerIds.length
    ? await prisma.user.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, username: true, phone: true },
      })
    : [];

  const customerMap = new Map(
    customers.map((customer) => [customer.id, customer]),
  );

  const topCustomers = customerGroups.map((group) => {
    const customer = customerMap.get(group.userId);
    return {
      userId: group.userId,
      username: customer?.username || "کاربر حذف‌شده",
      phone: customer?.phone || null,
      orderCount: group._count.userId,
      totalSpent: group._sum.totalAmount || 0,
    };
  });

  const bestSellingProducts = bestSellingGroups.map((group) => ({
    productCode: group.productCode,
    title: group.title,
    quantitySold: group._sum.quantity || 0,
    revenue: group._sum.subtotal || 0,
  }));

  const currentMonthSales =
    monthlySales[monthlySales.length - 1]?.total || 0;
  const salesLast12Months = monthlySales.reduce(
    (total, month) => total + month.total,
    0,
  );
  const salesOrderCountLast12Months = monthlySales.reduce(
    (total, month) => total + month.orderCount,
    0,
  );

  return {
    summary: {
      currentMonthSales,
      salesLast12Months,
      salesOrderCountLast12Months,
      totalProducts,
      totalOrders,
    },
    monthlySales,
    recentOrders,
    topCustomers,
    stock: {
      outOfStockCount,
      lowStockCount,
      outOfStockProducts,
      lowStockProducts,
    },
    bestSellingProducts,
  };
};
