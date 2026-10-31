import prisma from "../config/prisma.js";

// فقط سفارش‌هایی که فروش محسوب می‌شوند.
const SALES_STATUSES = [
  "PAID",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

const persianFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", {timeZone:"Asia/Tehran",year:"numeric",month:"numeric",day:"numeric"});
const persianMonthFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {timeZone:"Asia/Tehran",month:"long"});
const persianParts = (date) => Object.fromEntries(persianFormatter.formatToParts(date).map(({type,value})=>[type,value]));
const persianKey = (date) => { const p=persianParts(date); return String(p.year).replace(/\D/g,"")+"-"+String(p.month).replace(/\D/g,"").padStart(2,"0"); };
const tehranMidnight = (y,m,d) => new Date(Date.UTC(y,m-1,d)-210*60000);
const buildPersianMonths = (now) => {
 const map=new Map(); const cursor=new Date(now.getTime()-410*86400000); const limit=new Date(now.getTime()+40*86400000);
 while(cursor<=limit){
  const probe=new Date(Date.UTC(cursor.getUTCFullYear(),cursor.getUTCMonth(),cursor.getUTCDate(),12)); const p=persianParts(probe);
  const key=String(p.year).replace(/\D/g,"")+"-"+String(p.month).replace(/\D/g,"").padStart(2,"0");
  if(String(p.day).replace(/\D/g,"")==="1"&&!map.has(key)){
   const g=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Tehran",year:"numeric",month:"numeric",day:"numeric"}).formatToParts(probe).map(({type,value})=>[type,value]));
   map.set(key,{key,label:persianMonthFormatter.format(probe),start:tehranMidnight(Number(g.year),Number(g.month),Number(g.day)),total:0,orderCount:0});
  } cursor.setUTCDate(cursor.getUTCDate()+1);
 }
 const months=[...map.values()].filter(x=>x.start<=now).sort((a,b)=>a.start-b.start).slice(-12);
 return months.map((m,i)=>({...m,end:i<months.length-1?months[i+1].start:new Date(now.getTime()+86400000)}));
};
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
    const key = persianKey(order.createdAt);
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
};  const monthlySales = buildPersianMonths(now);
  const firstMonthStart = monthlySales[0].start;
  const nextMonthStart = monthlySales[monthlySales.length - 1].end;


