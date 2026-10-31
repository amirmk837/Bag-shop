import prisma from "../config/prisma.js";
// =========================================
// CONSTANTS
// =========================================

const VALID_ROLES = ["USER", "ADMIN"];

const VALID_PERMISSIONS = [
  "MANAGE_PRODUCTS",
  "MANAGE_CATEGORIES",
  "VIEW_ORDERS",
  "MANAGE_ORDERS",
  "MANAGE_USERS",
];

const ORDER_BY_MAP = {
  username: `u."username"`,
  createdAt: `u."createdAt"`,
  orderCount: `"orderCount"`,
  maxOrderAmount: `"maxOrderAmount"`,
};

// =========================================
// HELPERS
// =========================================

const parsePositiveInt = (value, fallback, max) => {
  const number = Number(value);

  if (!Number.isInteger(number) || number < 1) {
    return fallback;
  }

  return Math.min(number, max);
};

const normalizePermissions = (permissions) => {
  if (!Array.isArray(permissions)) {
    throw new Error("لیست permission نامعتبر است.");
  }

  const uniquePermissions = [...new Set(permissions)];

  const invalidPermission = uniquePermissions.find(
    (permission) => !VALID_PERMISSIONS.includes(permission),
  );

  if (invalidPermission) {
    throw new Error(`Permission نامعتبر است: ${invalidPermission}`);
  }

  return uniquePermissions;
};

// =========================================
// GET USERS
// =========================================

export const getUsers = async ({
  page = 1,
  pageSize = 20,
  search = "",
  status = "all",
  sortBy = "createdAt",
  sortOrder = "desc",
}) => {
  const currentPage = parsePositiveInt(page, 1, 100000);
  const currentPageSize = parsePositiveInt(pageSize, 20, 100);

  const safeSortBy = ORDER_BY_MAP[sortBy] ? sortBy : "createdAt";
  const safeSortOrder = sortOrder === "asc" ? "ASC" : "DESC";

  const whereParts = [];
  const params = [];

  if (search?.trim()) {
    const searchPattern = `%${search.trim()}%`;

    params.push(searchPattern);

    whereParts.push(`
      (
        u."username" ILIKE $${params.length}
        OR COALESCE(u."phone", '') ILIKE $${params.length}
      )
    `);
  }

  if (status === "active") {
    params.push(true);
    whereParts.push(`u."isActive" = $${params.length}`);
  }

  if (status === "inactive") {
    params.push(false);
    whereParts.push(`u."isActive" = $${params.length}`);
  }

  const whereSql = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

  // تعداد کاربران
  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM "User" u
    ${whereSql}
  `;

  const countResult = await prisma.$queryRawUnsafe(countQuery, ...params);

  const total = Number(countResult[0]?.total || 0);

  // صفحه‌بندی
  const offset = (currentPage - 1) * currentPageSize;

  const limitIndex = params.length + 1;
  const offsetIndex = params.length + 2;

  const orderBy = ORDER_BY_MAP[safeSortBy];

  const usersQuery = `
    SELECT
      u."id",
      u."username",
      u."phone",
      u."role",
      u."permissions",
      u."isActive",
      u."deletedAt",
      u."createdAt",

      COUNT(o."id")::int AS "orderCount",

      COALESCE(
        MAX(o."totalAmount"),
        0
      )::int AS "maxOrderAmount",

      COALESCE(
        SUM(o."totalAmount"),
        0
      )::int AS "totalSpent"

    FROM "User" u

    LEFT JOIN "Order" o
      ON o."userId" = u."id"
      AND o."status" = 'CONFIRMED'

    ${whereSql}

    GROUP BY u."id"

    ORDER BY
      ${orderBy} ${safeSortOrder},
      u."id" ${safeSortOrder}

    LIMIT $${limitIndex}
    OFFSET $${offsetIndex}
  `;

  const users = await prisma.$queryRawUnsafe(
    usersQuery,
    ...params,
    currentPageSize,
    offset,
  );

  // آدرس کاربران همین صفحه را یک‌جا دریافت می‌کنیم.
  const userIds = users.map((user) => Number(user.id));

  const addresses = userIds.length
    ? await prisma.userAddress.findMany({
        where: {
          userId: {
            in: userIds,
          },
        },
        select: {
          userId: true,
          recipientName: true,
          recipientPhone: true,
          province: true,
          city: true,
          addressLine: true,
          postalCode: true,
          plateNumber: true,
          unitNumber: true,
        },
      })
    : [];

  const addressByUserId = new Map(
    addresses.map(({ userId, ...address }) => [Number(userId), address]),
  );

  return {
    items: users.map((user) => ({
      ...user,
      id: Number(user.id),
      orderCount: Number(user.orderCount),
      maxOrderAmount: Number(user.maxOrderAmount),
      totalSpent: Number(user.totalSpent),
      address: addressByUserId.get(Number(user.id)) || null,
    })),

    pagination: {
      page: currentPage,
      pageSize: currentPageSize,
      total,
      totalPages: Math.ceil(total / currentPageSize),
    },

    sort: {
      sortBy: safeSortBy,
      sortOrder: safeSortOrder.toLowerCase(),
    },
  };
};

// =========================================
// GET USER DETAIL
// =========================================

export const getUserDetail = async (
  userId,
  orderPage = 1,
  orderPageSize = 10,
) => {
  const id = Number(userId);

  if (!Number.isInteger(id) || id < 1) {
    throw new Error("شناسه کاربر نامعتبر است.");
  }

  const currentPage = parsePositiveInt(orderPage, 1, 100000);
  const currentPageSize = parsePositiveInt(orderPageSize, 10, 50);

  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      username: true,
      phone: true,
      role: true,
      permissions: true,
      isActive: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,

      // آدرس ذخیره‌شده کاربر
      address: {
        select: {
          recipientName: true,
          recipientPhone: true,
          province: true,
          city: true,
          addressLine: true,
          postalCode: true,
          plateNumber: true,
          unitNumber: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const [stats, orderTotal, orders] = await Promise.all([
    prisma.order.aggregate({
      where: {
        userId: id,
        status: "CONFIRMED",
      },
      _count: {
        id: true,
      },
      _max: {
        totalAmount: true,
      },
      _sum: {
        totalAmount: true,
      },
    }),

    prisma.order.count({
      where: {
        userId: id,
        status: "CONFIRMED",
      },
    }),

    prisma.order.findMany({
      where: {
        userId: id,
        status: "CONFIRMED",
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (currentPage - 1) * currentPageSize,
      take: currentPageSize,
      select: {
        id: true,
        status: true,
        totalAmount: true,
        confirmedAt: true,
        createdAt: true,

        items: {
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
      },
    }),
  ]);

  return {
    user: {
      ...user,
      orderCount: stats._count.id,
      maxOrderAmount: stats._max.totalAmount || 0,
      totalSpent: stats._sum.totalAmount || 0,
    },

    orders: {
      items: orders,
      pagination: {
        page: currentPage,
        pageSize: currentPageSize,
        total: orderTotal,
        totalPages: Math.ceil(orderTotal / currentPageSize),
      },
    },
  };
};

// =========================================
// UPDATE USER
// =========================================

export const updateUser = async ({
  targetUserId,
  actorUserId,
  role,
  permissions,
  isActive,
}) => {
  const targetId = Number(targetUserId);
  const actorId = Number(actorUserId);

  if (!Number.isInteger(targetId)) {
    throw new Error("شناسه کاربر نامعتبر است.");
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      id: targetId,
    },
  });

  if (!existingUser) {
    throw new Error("کاربر پیدا نشد.");
  }

  // جلوگیری از تغییر نقش یا غیرفعال‌کردن حساب خود مدیر
  if (targetId === actorId && (role !== undefined || isActive !== undefined)) {
    throw new Error("مدیر نمی‌تواند نقش یا وضعیت حساب خودش را تغییر دهد.");
  }

  let nextRole = existingUser.role;
  let nextPermissions = existingUser.permissions;
  let nextIsActive = existingUser.isActive;

  if (role !== undefined) {
    if (!VALID_ROLES.includes(role)) {
      throw new Error("نقش کاربر نامعتبر است.");
    }

    nextRole = role;
  }

  if (permissions !== undefined) {
    nextPermissions = normalizePermissions(permissions);
  }

  if (isActive !== undefined) {
    if (typeof isActive !== "boolean") {
      throw new Error("وضعیت فعال بودن کاربر نامعتبر است.");
    }

    nextIsActive = isActive;
  }

  // مدیر نیازی به permission جداگانه ندارد.
  if (nextRole === "ADMIN") {
    nextPermissions = [];
  }

  // جلوگیری از حذف یا تنزل آخرین مدیر فعال
  const isLosingAdminStatus =
    existingUser.role === "ADMIN" &&
    existingUser.isActive &&
    (nextRole !== "ADMIN" || nextIsActive === false);

  if (isLosingAdminStatus) {
    const activeAdminCount = await prisma.user.count({
      where: {
        role: "ADMIN",
        isActive: true,
        deletedAt: null,
      },
    });

    if (activeAdminCount <= 1) {
      throw new Error("آخرین مدیر فعال سیستم قابل حذف یا تنزل نیست.");
    }
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: targetId,
    },
    data: {
      role: nextRole,
      permissions: nextPermissions,
      isActive: nextIsActive,
      deletedAt: nextIsActive ? null : existingUser.deletedAt || new Date(),
    },
    select: {
      id: true,
      username: true,
      phone: true,
      role: true,
      permissions: true,
      isActive: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

// =========================================
// SOFT DELETE USER
// =========================================

export const softDeleteUser = async (targetUserId, actorUserId) => {
  const targetId = Number(targetUserId);
  const actorId = Number(actorUserId);

  if (!Number.isInteger(targetId)) {
    throw new Error("شناسه کاربر نامعتبر است.");
  }

  if (targetId === actorId) {
    throw new Error("ادمین نمی‌تواند حساب خودش را حذف کند.");
  }

  const targetUser = await prisma.user.findUnique({
    where: {
      id: targetId,
    },
  });

  if (!targetUser) {
    throw new Error("کاربر پیدا نشد.");
  }

  if (targetUser.role === "ADMIN" && targetUser.isActive) {
    const activeAdminCount = await prisma.user.count({
      where: {
        role: "ADMIN",
        isActive: true,
        deletedAt: null,
      },
    });

    if (activeAdminCount <= 1) {
      throw new Error("آخرین مدیر فعال سیستم قابل حذف نیست.");
    }
  }

  const deletedUser = await prisma.user.update({
    where: {
      id: targetId,
    },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
    select: {
      id: true,
      username: true,
      role: true,
      isActive: true,
      deletedAt: true,
    },
  });

  return deletedUser;
};
