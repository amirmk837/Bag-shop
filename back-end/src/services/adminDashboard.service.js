import prisma from "../config/prisma.js";

// فقط سفارش‌هایی که فروش محسوب می‌شوند.
const SALES_STATUSES = [
  "PAID",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

const getMonthKey = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
};

const getMonthLabel = (date) =>
  date.toLocaleDateString("fa-IR-u-ca-gregory", {
    month: "short",
  });

// =========================================
// DASHBOARD ANALYTICS
// =========================================

export const getAdminDashboard = async () => {
  const now = new Date();

  // بازه شامل ماه جاری و ۱۱ ماه قبل است.
  const currentMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );

  const firstMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1),
  );

  const nextMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );

  // ساخت ۱۲ ماه، حتی اگر فروش یک ماه صفر باشد.
  const monthlySales = [];

  for (let offset = 0; offset < 12; offset += 1) {
    const date = new Date(
      Date.UTC(
        firstMonthStart.getUTCFullYear(),
        firstMonthStart.getUTCMonth() + offset,
        1,
      ),
    );

    monthlySales.push({
      key: getMonthKey(date),
      label: getMonthLabel(date),
      total: 0,
      orderCount: 0,
    });
  }

  const monthlySalesMap = new Map(
    monthlySales.map((month) => [month.key, month]),
  );

  // =========================================
  // LOAD ANALYTICS
  // =========================================

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
    // فروش ۱۲ ماه اخیر
    prisma.order.findMany({
      where: {
        status: { in: SALES_STATUSES },
        createdAt: {
          gte: firstMonthStart,
          lt: nextMonthStart,
        },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    }),

    // سه سفارش آخر با هر وضعیتی
    prisma.order.findMany({
      take: 3,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            username: true,
            phone: true,
          },
        },
        items: {
          select: {
            id: true,
            title: true,
            quantity: true,
          },
        },
      },
    }),

    // سه مشتری برتر بر اساس تعداد خرید
    prisma.order.groupBy({
      by: ["userId"],
      where: {
        status: { in: SALES_STATUSES },
      },
      _count: {
        userId: true,
      },
      _sum: {
        totalAmount: true,
      },
      orderBy: [
        {
          _count: {
            userId: "desc",
          },
        },
        {
          _sum: {
            totalAmount: "desc",
          },
        },
      ],
      take: 3,
    }),

    // پرفروش‌ترین محصولات بر اساس تعداد فروخته‌شده
    prisma.orderItem.groupBy({
      by: ["productCode", "title"],
      where: {
        order: {
          status: { in: SALES_STATUSES },
        },
      },
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: [
        {
          _sum: {
            quantity: "desc",
          },
        },
        {
          productCode: "asc",
        },
      ],
      take: 5,
    }),

    // شمارش محصولات ناموجود
    prisma.product.count({
      where: {
        count: { lte: 0 },
      },
    }),

    // شمارش محصولات با دقیقاً یک عدد موجودی
    prisma.product.count({
      where: {
        count: 1,
      },
    }),

    // حداکثر شش محصول ناموجود برای نمایش
    prisma.product.findMany({
      where: {
        count: { lte: 0 },
      },
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

    // حداکثر شش محصول با یک عدد موجودی
    prisma.product.findMany({
      where: {
        count: 1,
      },
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

  // =========================================
  // MONTHLY SALES TOTALS
  // =========================================

  for (const order of monthlyOrders) {
    const key = getMonthKey(order.createdAt);
    const month = monthlySalesMap.get(key);

    if (!month) continue;

    month.total += order.totalAmount;
    month.orderCount += 1;
  }

  // =========================================
  // CUSTOMER DETAILS
  // =========================================

  const customerIds = customerGroups.map((customer) => customer.userId);

  const customers = customerIds.length
    ? await prisma.user.findMany({
        where: {
          id: { in: customerIds },
        },
        select: {
          id: true,
          username: true,
          phone: true,
        },
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

  // =========================================
  // BEST-SELLING PRODUCTS
  // =========================================

  const bestSellingProducts = bestSellingGroups.map((group) => ({
    productCode: group.productCode,
    title: group.title,
    quantitySold: group._sum.quantity || 0,
    revenue: group._sum.subtotal || 0,
  }));

  // =========================================
  // SUMMARY
  // =========================================

  const currentMonthSales = monthlySales[monthlySales.length - 1]?.total || 0;

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
