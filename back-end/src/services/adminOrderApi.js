import prisma from "../config/prisma.js";

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
  PENDING: ["CONFIRMED", "CANCELLED"],
  PAID: ["CONFIRMED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],

  // سفارش لغوشده فقط به حالت اولیه برمی‌گردد.
  CANCELLED: ["PENDING"],
};

// حذف دائمی فقط برای سفارش‌های پرداخت‌نشده و ارسال‌نشده
const DELETABLE_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "CANCELLED"];

const createOrderError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const parsePositiveInt = (value, fallback, max) => {
  const number = Number(value);

  if (!Number.isSafeInteger(number) || number < 1) {
    return fallback;
  }

  return Math.min(number, max);
};

// =========================================
// PRISMA INCLUDE
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
      unitPrice: true,
      quantity: true,
      subtotal: true,
    },
  },
};

// =========================================
// GET ORDERS
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
      conditions.push({
        id: numericId,
      });
    }

    where.AND = [
      {
        OR: conditions,
      },
    ];
  }

  const [total, orders] = await prisma.$transaction([
    prisma.order.count({
      where,
    }),

    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],
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
// GET ORDER DETAIL
// =========================================

export const getAdminOrderDetail = async (orderId) => {
  const id = Number(orderId);

  if (!Number.isSafeInteger(id) || id < 1) {
    throw createOrderError(400, "شماره سفارش معتبر نیست.");
  }

  const order = await prisma.order.findUnique({
    where: {
      id,
    },
    include: orderInclude,
  });

  if (!order) {
    throw createOrderError(404, "سفارش پیدا نشد.");
  }

  return order;
};

// =========================================
// UPDATE ORDER STATUS
// =========================================

export const updateAdminOrderStatus = async (orderId, nextStatus) => {
  const id = Number(orderId);

  if (!Number.isSafeInteger(id) || id < 1) {
    throw createOrderError(400, "شماره سفارش معتبر نیست.");
  }

  if (typeof nextStatus !== "string" || !VALID_STATUSES.includes(nextStatus)) {
    throw createOrderError(400, "وضعیت جدید سفارش معتبر نیست.");
  }

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const order = await tx.order.findUnique({
            where: {
              id,
            },

            include: {
              items: {
                select: {
                  id: true,
                  productId: true,
                  productCode: true,
                  title: true,
                  quantity: true,
                },
              },
            },
          });

          if (!order) {
            throw createOrderError(404, "سفارش پیدا نشد.");
          }

          if (order.status === nextStatus) {
            throw createOrderError(400, "سفارش از قبل همین وضعیت را دارد.");
          }

          const allowedNextStatuses = ALLOWED_TRANSITIONS[order.status] || [];

          if (!allowedNextStatuses.includes(nextStatus)) {
            throw createOrderError(
              400,
              `تغییر وضعیت از ${order.status} به ${nextStatus} مجاز نیست.`,
            );
          }

          // =========================================
          // REOPEN CANCELLED ORDER
          // =========================================

          // موقع لغو، موجودی قبلاً برگردانده شده است.
          // بنابراین هنگام فعال‌سازی مجدد باید دوباره رزرو شود.
          if (order.status === "CANCELLED" && nextStatus === "PENDING") {
            for (const item of order.items) {
              let product = item.productId
                ? await tx.product.findUnique({
                    where: {
                      id: item.productId,
                    },
                    select: {
                      id: true,
                      title: true,
                      count: true,
                    },
                  })
                : null;

              // اگر محصول قبلی حذف شده باشد، فقط در صورت
              // وجود محصول فعلی با همان کد امکان رزرو داریم.
              if (!product) {
                product = await tx.product.findUnique({
                  where: {
                    productCode: item.productCode,
                  },
                  select: {
                    id: true,
                    title: true,
                    count: true,
                  },
                });
              }

              if (!product) {
                throw createOrderError(
                  409,
                  `محصول «${item.title}» دیگر وجود ندارد و سفارش قابل فعال‌سازی نیست.`,
                );
              }

              const stockUpdate = await tx.product.updateMany({
                where: {
                  id: product.id,
                  count: {
                    gte: item.quantity,
                  },
                },

                data: {
                  count: {
                    decrement: item.quantity,
                  },
                },
              });

              if (stockUpdate.count !== 1) {
                const currentProduct = await tx.product.findUnique({
                  where: {
                    id: product.id,
                  },
                  select: {
                    count: true,
                  },
                });

                throw createOrderError(
                  409,
                  `موجودی محصول «${product.title}» کافی نیست. موجودی فعلی: ${currentProduct?.count ?? 0}`,
                );
              }

              // اگر رابطه محصول قبلاً حذف شده بود،
              // بعد از رزرو موفق دوباره برقرارش می‌کنیم.
              if (item.productId !== product.id) {
                await tx.orderItem.update({
                  where: {
                    id: item.id,
                  },
                  data: {
                    productId: product.id,
                  },
                });
              }
            }
          }

          // =========================================
          // UPDATE STATUS
          // =========================================

          const updated = await tx.order.updateMany({
            where: {
              id: order.id,
              status: order.status,
            },

            data: {
              status: nextStatus,

              ...(nextStatus === "CONFIRMED" && !order.confirmedAt
                ? {
                    confirmedAt: new Date(),
                  }
                : {}),
            },
          });

          if (updated.count !== 1) {
            throw createOrderError(
              409,
              "وضعیت سفارش هم‌زمان تغییر کرده است. دوباره تلاش کنید.",
            );
          }

          // =========================================
          // RESTORE INVENTORY ON CANCELLATION
          // =========================================

          if (nextStatus === "CANCELLED") {
            for (const item of order.items) {
              // سفارش‌های قدیمی ممکن است رابطه محصول نداشته باشند.
              if (item.productId === null) {
                continue;
              }

              await tx.product.update({
                where: {
                  id: item.productId,
                },

                data: {
                  count: {
                    increment: item.quantity,
                  },
                },
              });
            }
          }

          return tx.order.findUnique({
            where: {
              id: order.id,
            },
            include: orderInclude,
          });
        },

        {
          isolationLevel: "Serializable",
        },
      );
    } catch (error) {
      if (error?.code === "P2034" && attempt < 3) {
        continue;
      }

      throw error;
    }
  }

  throw createOrderError(409, "به‌روزرسانی سفارش انجام نشد. دوباره تلاش کنید.");
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
        where: {
          id,
        },

        include: {
          items: {
            select: {
              id: true,
              productId: true,
              productCode: true,
              title: true,
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

      // اگر سفارش هنوز لغو نشده، موجودی آن قبلاً کم شده است.
      // قبل از حذف باید موجودی اقلام به انبار برگردد.
      if (order.status !== "CANCELLED") {
        for (const item of order.items) {
          if (item.productId === null) {
            continue;
          }

          await tx.product.update({
            where: {
              id: item.productId,
            },

            data: {
              count: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      // اقلام سفارش طبق رابطه Cascade حذف می‌شوند.
      await tx.order.delete({
        where: {
          id: order.id,
        },
      });

      return {
        id: order.id,
      };
    },

    {
      isolationLevel: "Serializable",
    },
  );
};
