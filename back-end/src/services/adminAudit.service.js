import prisma from "../config/prisma.js";

const ALLOWED_ACTIONS = new Set([
  "PAYMENT_RECONCILIATION",
  "PAYMENT_EXPIRED_UNSENT",
  "ORDER_STATUS_CHANGED",
  "ORDER_SHIPPING_UPDATED",
  "ORDER_DELETED",
  "ADMIN_LOGIN_FAILED",
]);

export const recordAdminAudit = async ({
  adminId,
  action,
  targetType,
  targetId,
  orderId = null,
  details = null,
}) => {
  const normalizedAdminId = Number(adminId);
  const normalizedTargetId = Number(targetId);
  const normalizedOrderId = orderId == null ? null : Number(orderId);

  if (
    !Number.isSafeInteger(normalizedAdminId) || normalizedAdminId < 1 ||
    !ALLOWED_ACTIONS.has(action) ||
    typeof targetType !== "string" || !targetType.trim() ||
    !Number.isSafeInteger(normalizedTargetId) || normalizedTargetId < 1 ||
    (normalizedOrderId !== null &&
      (!Number.isSafeInteger(normalizedOrderId) || normalizedOrderId < 1))
  ) {
    throw new Error("اطلاعات ثبت رویداد مدیریتی معتبر نیست.");
  }

  return prisma.adminAuditLog.create({
    data: {
      adminId: normalizedAdminId,
      action,
      targetType: targetType.trim(),
      targetId: normalizedTargetId,
      orderId: normalizedOrderId,
      details,
    },
    select: { id: true, action: true, createdAt: true },
  });
};


export const getAdminAuditLogs = async ({
  page = 1,
  pageSize = 25,
  action,
  from,
  to,
} = {}) => {
  const parsedPage = Number(page);
  const parsedSize = Number(pageSize);
  const currentPage = Number.isSafeInteger(parsedPage) && parsedPage > 0
    ? Math.min(parsedPage, 100000)
    : 1;
  const currentPageSize = Number.isSafeInteger(parsedSize) && parsedSize > 0
    ? Math.min(parsedSize, 100)
    : 25;

  const where = {};
  if (action) {
    if (!ALLOWED_ACTIONS.has(action)) {
      const error = new Error("نوع رویداد معتبر نیست.");
      error.status = 400;
      throw error;
    }
    where.action = action;
  }

  if (from || to) {
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;
    if (
      (from && Number.isNaN(fromDate.getTime())) ||
      (to && Number.isNaN(toDate.getTime())) ||
      (fromDate && toDate && fromDate > toDate)
    ) {
      const error = new Error("بازه زمانی سوابق معتبر نیست.");
      error.status = 400;
      throw error;
    }
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = fromDate;
    if (toDate) where.createdAt.lte = toDate;
  }

  const [total, items] = await prisma.$transaction([
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.findMany({
      where,
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        orderId: true,
        details: true,
        createdAt: true,
        admin: { select: { id: true, username: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (currentPage - 1) * currentPageSize,
      take: currentPageSize,
    }),
  ]);

  return {
    items,
    pagination: {
      page: currentPage,
      pageSize: currentPageSize,
      total,
      totalPages: Math.ceil(total / currentPageSize),
    },
  };
};
