import prisma from "../config/prisma.js";
import { hashPassword, isValidPassword } from "./auth.service.js";
import { hardDeleteUser } from "./user.service.js";
import { ADMIN_PERMISSIONS } from "../middlewares/authorization.middleware.js";

const STAFF_SELECT = {
  id: true, username: true, phone: true, role: true, permissions: true,
  isActive: true, createdAt: true, lastLoginAt: true,
};

const fail = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

const parseId = (value) => {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) fail("شناسه مدیر معتبر نیست.");
  return id;
};

const normalizePermissions = (permissions) => {
  if (!Array.isArray(permissions)) fail("فهرست مجوزها معتبر نیست.");
  const unique = [...new Set(permissions)];
  if (unique.some((permission) => !ADMIN_PERMISSIONS.includes(permission))) {
    fail("یکی از مجوزهای انتخاب‌شده معتبر نیست.");
  }
  return unique;
};

const withAdminGuardLock = async (tx) => {
  // Shared transaction-scoped lock serializes all last-super-admin checks.
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(741852963)`;
};

const ensureAnotherActiveSuperAdmin = async (tx) => {
  await withAdminGuardLock(tx);
  const count = await tx.user.count({
    where: { role: "ADMIN", isActive: true, deletedAt: null },
  });
  if (count <= 1) fail("آخرین مدیر کل فعال قابل غیرفعال‌سازی یا حذف نیست.", 409);
};

export const listManagedAdmins = async () => {
  const items = await prisma.user.findMany({
    where: { OR: [{ role: "ADMIN", deletedAt: null }, { role: "ADMIN_STAFF" }] },
    select: STAFF_SELECT,
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
  });
  return {
    items,
    permissions: ADMIN_PERMISSIONS,
    summary: {
      superAdmins: items.filter((item) => item.role === "ADMIN" && item.isActive).length,
      staff: items.filter((item) => item.role === "ADMIN_STAFF").length,
      activeStaff: items.filter((item) => item.role === "ADMIN_STAFF" && item.isActive).length,
    },
  };
};

export const createManagedStaff = async ({ username, phone, password, permissions, actorId }) => {
  if (typeof username !== "string" || username.trim().length < 3 || username.trim().length > 30) {
    fail("نام کاربری باید بین ۳ تا ۳۰ کاراکتر باشد.");
  }
  if (phone !== undefined && phone !== null && (typeof phone !== "string" || phone.trim().length < 7 || phone.trim().length > 20)) {
    fail("شماره تماس معتبر نیست.");
  }
  if (!isValidPassword(password)) fail("رمز عبور باید حداقل ۸ کاراکتر و حداکثر ۷۲ بایت باشد.");
  const normalizedUsername = username.trim();
  const normalizedPhone = typeof phone === "string" && phone.trim() ? phone.trim() : null;
  const normalizedPermissions = normalizePermissions(permissions ?? []);
  const passwordHash = await hashPassword(password);

  try {
    return await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          username: normalizedUsername,
          phone: normalizedPhone,
          passwordHash,
          role: "ADMIN_STAFF",
          permissions: normalizedPermissions,
          isActive: true,
          deletedAt: null,
        },
        select: STAFF_SELECT,
      });
      await tx.adminAuditLog.create({
        data: {
          adminId: Number(actorId),
          action: "ADMIN_ROLE_CHANGED",
          targetType: "ADMIN",
          targetId: created.id,
          details: { operation: "STAFF_CREATED", role: "ADMIN_STAFF", permissions: normalizedPermissions },
        },
      });
      return created;
    });
  } catch (error) {
    if (error?.code === "P2002") fail("نام کاربری یا شماره تماس قبلاً ثبت شده است.", 409);
    throw error;
  }
};

export const updateManagedStaff = async ({ targetId, actorId, permissions, isActive }) => {
  const id = parseId(targetId);
  if (id === Number(actorId)) fail("مدیر نمی‌تواند حساب خودش را از این بخش تغییر دهد.", 403);
  if (permissions === undefined && isActive === undefined) fail("هیچ تغییری ارسال نشده است.");
  if (isActive !== undefined && typeof isActive !== "boolean") fail("وضعیت حساب معتبر نیست.");
  const nextPermissions = permissions === undefined ? undefined : normalizePermissions(permissions);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { id }, select: STAFF_SELECT });
    if (!existing || existing.role !== "ADMIN_STAFF") fail("مدیر محدود پیدا نشد.", 404);
    const data = {};
    if (nextPermissions !== undefined) data.permissions = nextPermissions;
    if (isActive !== undefined) {
      data.isActive = isActive;
      data.deletedAt = isActive ? null : new Date();
      data.tokenVersion = { increment: 1 };
    }
    const updated = await tx.user.update({ where: { id }, data, select: STAFF_SELECT });
    if (nextPermissions !== undefined && JSON.stringify(existing.permissions) !== JSON.stringify(updated.permissions)) {
      await tx.adminAuditLog.create({
        data: { adminId: Number(actorId), action: "ADMIN_PERMISSIONS_CHANGED", targetType: "ADMIN", targetId: id, details: { before: existing.permissions, after: updated.permissions } },
      });
    }
    if (isActive !== undefined && existing.isActive !== updated.isActive) {
      await tx.adminAuditLog.create({
        data: { adminId: Number(actorId), action: "ADMIN_STATUS_CHANGED", targetType: "ADMIN", targetId: id, details: { before: existing.isActive, after: updated.isActive } },
      });
    }
    return updated;
  });
};

export const deleteManagedStaff = async ({ targetId, actorId }) => {
  const id = parseId(targetId);
  if (id === Number(actorId)) fail("مدیر نمی‌تواند حساب خودش را حذف کند.", 403);
  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
  if (!target || target.role !== "ADMIN_STAFF") {
    fail("فقط حساب مدیر محدود از این بخش قابل حذف است.", 404);
  }
  // Reuse the established deletion workflow so linked orders are anonymized safely.
  return hardDeleteUser(id, actorId, "ADMIN");
};
