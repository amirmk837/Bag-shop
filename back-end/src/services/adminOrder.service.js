import prisma from "../config/prisma.js";
import { reserveStock, releaseStock } from "./stock.service.js";

// =========================================
// CONSTANTS
// =========================================

const VALID_STATUSES = [
  "PENDING",
  "PAID",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const ALLOWED_TRANSITIONS = {
  PENDING: ["CANCELLED"],
  PAID: ["CONFIRMED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: ["PENDING"],
};

const DELETABLE_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "CANCELLED"];

const createOrderError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const parsePositiveInt = (
  value,
  fallback = undefined,
  max = Number.MAX_SAFE_INTEGER,
) => {
  const number = Number(value);

  if (!Number.isSafeInteger(number) || number < 1) {
    return fallback;
  }

  return Math.min(number, max);
};

// =========================================
// COMMON ORDER DATA
// =========================================

const orderInclude = {
  user: {
    select: {
      id: true,
      username: true,
      phone: true,
    },
  },
  items: {
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      productId: true,
      productCode: true,
      title: true,
      color: true,
      unitPrice: true,
      quantity: true,
      subtotal: true,
    },
  },
};

// =========================================
// GET ADMIN ORDERS
// =========================================

export const getAdminOrders = async ({
  page = 1,
  pageSize = 20,
  status = "all",
  search = "",
} = {}) => {
  const currentPage = parsePositiveInt(page, 1, 100000);
  const currentPageSize = parsePositiveInt(pageSize, 20, 100);

  const where = {};

  if (status && status !== "all") {
    if (!VALID_STATUSES.includes(status)) {
      throw createOrderError(400, "وضعیت انتخاب‌شده معتبر نیست.");
    }

    where.status = status;
  }

  const query = String(search || "").trim();

  if (query) {
    const conditions = [
      {
        user: {
          username: {
            contains: query,
            mode: "insensitive",
          },
        },
      },
      {
        user: {
          phone: {
            contains: query,
          },
        },
      },
    ];

    const numericId = Number(query);

    if (Number.isSafeInteger(numericId) && numericId > 0) {
      conditions.push({ id: numericId });
    }

    where.AND = [{ OR: conditions }];
  }

  const [total, orders] = await prisma.$transaction([
    prisma.order.count({ where }),

    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (currentPage - 1) * currentPageSize,
      take: currentPageSize,
    }),
  ]);

  return {
    items: orders,
    pagination: {
      page: currentPage,
      pageSize: currentPageSize,
      total,
      totalPages: Math.ceil(total / currentPageSize),
    },
  };
};

// =========================================
// GET ADMIN ORDER DETAIL
// =========================================

export const getAdminOrderDetail = async (orderId) => {
  const id = Number(orderId);

  if (!Number.isSafeInteger(id) || id < 1) {
    throw createOrderError(400, "شماره سفارش معتبر نیست.");
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: orderInclude,
  });

  if (!order) {
    throw createOrderError(404, "سفارش پیدا نشد.");
  }

  return order;
};

// =========================================
// FIND PRODUCT FOR ORDER ITEM
// =========================================

const findOrderProduct = async (tx, item) => {
  if (item.productId) {
    const product = await tx.product.findUnique({
      where: { id: item.productId },
      select: { id: true },
    });

    if (product) return product;
  }

  if (!item.productCode) return null;

  return tx.product.findFirst({
    where: { productCode: item.productCode },
    select: { id: true },
  });
};

// آزادسازی موجودی فقط یک‌بار برای هر چرخه رزرو سفارش
const releaseOrderStockOnce = async (tx, order) => {
  const claimed = await tx.order.updateMany({
    where: { id: order.id, stockReleasedAt: null },
    data: { stockReleasedAt: new Date() },
  });

  if (claimed.count !== 1) {
    throw createOrderError(409, "موجودی این سفارش قبلاً آزاد شده یا وضعیت آن تغییر کرده است.");
  }

  for (const item of order.items) {
    const product = await findOrderProduct(tx, item);
    if (!product) {
      throw createOrderError(409, "محصول «" + item.title + "» پیدا نشد؛ آزادسازی موجودی کامل نشد.");
    }
    await releaseStock(tx, {
      productId: product.id,
      color: item.color || "",
      quantity: item.quantity,
    });
  }
};

// =========================================
// UPDATE ORDER STATUS
// =========================================

export const updateAdminOrderStatus = async (orderId, nextStatus) => {
  const id = parsePositiveInt(orderId);

  if (!id) {
    throw createOrderError(400, "شناسه سفارش نامعتبر است.");
  }

  if (!VALID_STATUSES.includes(nextStatus)) {
    throw createOrderError(400, "وضعیت سفارش نامعتبر است.");
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const order = await tx.order.findUnique({
            where: { id },
            include: orderInclude,
          });

          if (!order) {
            throw createOrderError(404, "سفارش پیدا نشد.");
          }

          const allowedStatuses = ALLOWED_TRANSITIONS[order.status] ?? [];

          if (!allowedStatuses.includes(nextStatus)) {
            throw createOrderError(
              400,
              `تغییر وضعیت از ${order.status} به ${nextStatus} مجاز نیست.`,
            );
          }

          // سفارش دارای پرداخت موفق تا زمان پیاده‌سازی بازپرداخت نباید لغو شود؛
          // آزادسازی موجودی بدون بازپرداخت می‌تواند باعث زیان مالی و فروش مجدد کالا شود.
          if (nextStatus === "CANCELLED") {
            const successfulPayment = await tx.payment.findFirst({
              where: {
                orderId: order.id,
                status: "PAID",
              },
              select: { id: true },
            });

            if (successfulPayment) {
              throw createOrderError(
                409,
                "این سفارش پرداخت موفق دارد؛ تا زمان ثبت و تأیید بازپرداخت، لغو سفارش و آزادسازی موجودی مجاز نیست.",
              );
            }
          }

          // تراکنش در حال انجام را نمی‌توان با لغو سفارش بی‌اثر کرد؛
          // ممکن است پرداخت در درگاه انجام شده باشد و callback هنوز نرسیده باشد.
          if (order.status === "PENDING" && nextStatus === "CANCELLED") {
            const inFlightPayment = await tx.payment.findFirst({
              where: {
                orderId: order.id,
                status: { in: ["CREATED", "REQUESTING", "REQUESTED"] },
              },
              select: { id: true },
            });

            if (inFlightPayment) {
              throw createOrderError(
                409,
                "برای این سفارش تراکنش پرداخت تعیین‌تکلیف‌نشده وجود دارد؛ تا بررسی قطعی وضعیت درگاه، لغو سفارش و آزادسازی موجودی مجاز نیست.",
              );
            }
          }

          if (
            nextStatus === "SHIPPED" &&
            (!order.shippingMethod?.trim() || !order.trackingCode?.trim())
          ) {
            throw createOrderError(
              400,
              "برای ارسال سفارش ابتدا روش ارسال و کد رهگیری را ثبت کنید.",
            );
          }

          // فعال‌سازی مجدد سفارش لغوشده: رزرو مجدد موجودی
          if (order.status === "CANCELLED" && nextStatus === "PENDING") {
            for (const item of order.items) {
              const product = await findOrderProduct(tx, item);

              if (!product) {
                throw createOrderError(
                  409,
                  `محصول «${item.title}» دیگر در فروشگاه موجود نیست.`,
                );
              }

              await reserveStock(tx, {
                productId: product.id,
                color: item.color || "",
                quantity: item.quantity,
                title: item.title,
              });

              if (item.productId !== product.id) {
                await tx.orderItem.update({
                  where: { id: item.id },
                  data: { productId: product.id },
                });
              }
            }
          }

          const updateData = {
            status: nextStatus,
            confirmedAt:
              nextStatus === "CONFIRMED"
                ? new Date()
                : order.status === "CANCELLED" && nextStatus === "PENDING"
                  ? null
                  : undefined,
            shippedAt: nextStatus === "SHIPPED" ? new Date() : undefined,
            deliveredAt: nextStatus === "DELIVERED" ? new Date() : undefined,
            stockReleasedAt: order.status === "CANCELLED" && nextStatus === "PENDING" ? null : undefined,
          };

          const updated = await tx.order.updateMany({
            where: {
              id,
              status: order.status,
            },
            data: updateData,
          });

          if (updated.count !== 1) {
            throw createOrderError(
              409,
              "وضعیت سفارش هم‌زمان تغییر کرده است؛ صفحه را تازه‌سازی کنید.",
            );
          }

          // لغو سفارش: ثبت و آزادسازی اتمیک و یک‌باره موجودی
          if (nextStatus === "CANCELLED") {
            await releaseOrderStockOnce(tx, order);
          }

          return tx.order.findUnique({
            where: { id },
            include: orderInclude,
          });
        },
        { isolationLevel: "Serializable" },
      );
    } catch (error) {
      if (error?.code === "P2034" && attempt < 2) {
        continue;
      }

      throw error;
    }
  }

  throw createOrderError(409, "به‌روزرسانی سفارش انجام نشد؛ دوباره تلاش کنید.");
};

// =========================================
// DELETE ORDER PERMANENTLY
// =========================================

export const deleteAdminOrder = async (orderId) => {
  const id = Number(orderId);

  if (!Number.isSafeInteger(id) || id < 1) {
    throw createOrderError(400, "شماره سفارش معتبر نیست.");
  }

  return prisma.$transaction(
    async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: {
          items: {
            select: {
              id: true,
              productId: true,
              productCode: true,
              title: true,
              color: true,
              quantity: true,
            },
          },
        },
      });

      if (!order) {
        throw createOrderError(404, "سفارش پیدا نشد.");
      }

      if (!DELETABLE_STATUSES.includes(order.status)) {
        throw createOrderError(
          409,
          "سفارش پرداخت‌شده، ارسال‌شده یا تحویل‌شده قابل حذف دائمی نیست.",
        );
      }

      // حتی سفارش PENDING نیز در صورت داشتن تراکنش پرداخت نباید حذف شود.
      const relatedPayment = await tx.payment.findFirst({
        where: {
          orderId: order.id,
          status: { in: ["CREATED", "REQUESTING", "REQUESTED", "PAID"] },
        },
        select: { id: true, status: true },
      });

      if (relatedPayment) {
        throw createOrderError(
          409,
          "این سفارش دارای تراکنش پرداخت است و حذف دائمی آن مجاز نیست.",
        );
      }

      // سفارش لغوشده قبلاً موجودی را آزاد کرده؛ سایر سفارش‌ها فقط یک‌بار آزاد می‌شوند.
      if (order.status !== "CANCELLED") {
        await releaseOrderStockOnce(tx, order);
      }

      await tx.order.delete({
        where: { id: order.id },
      });

      return { id: order.id };
    },
    { isolationLevel: "Serializable" },
  );
};

// =========================================
// UPDATE SHIPPING METHOD AND TRACKING CODE
// =========================================

export const updateAdminOrderShipping = async (
  orderId,
  { shippingMethod, trackingCode } = {},
) => {
  const id = parsePositiveInt(orderId);

  if (!id) {
    throw createOrderError(400, "شناسه سفارش نامعتبر است.");
  }

  if (typeof shippingMethod !== "string" || typeof trackingCode !== "string") {
    throw createOrderError(400, "روش ارسال و کد رهگیری الزامی هستند.");
  }

  const method = shippingMethod.trim();
  const tracking = trackingCode.trim();

  if (!method || !tracking) {
    throw createOrderError(400, "روش ارسال و کد رهگیری نمی‌توانند خالی باشند.");
  }

  if (method.length > 100 || tracking.length > 100) {
    throw createOrderError(
      400,
      "روش ارسال و کد رهگیری حداکثر ۱۰۰ کاراکتر باشند.",
    );
  }

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!order) {
    throw createOrderError(404, "سفارش پیدا نشد.");
  }

  if (order.status !== "PROCESSING") {
    throw createOrderError(
      400,
      "اطلاعات ارسال فقط برای سفارش در حال پردازش قابل ثبت است.",
    );
  }

  const result = await prisma.order.updateMany({
    where: {
      id,
      status: "PROCESSING",
    },
    data: {
      shippingMethod: method,
      trackingCode: tracking,
    },
  });

  if (result.count !== 1) {
    throw createOrderError(
      409,
      "وضعیت سفارش تغییر کرده است؛ صفحه را تازه‌سازی کنید.",
    );
  }

  return prisma.order.findUnique({
    where: { id },
    include: orderInclude,
  });
};
