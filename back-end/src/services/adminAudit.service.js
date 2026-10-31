import prisma from "../config/prisma.js";

const ALLOWED_ACTIONS = new Set([
  "PAYMENT_RECONCILIATION",
  "PAYMENT_EXPIRED_UNSENT",
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
