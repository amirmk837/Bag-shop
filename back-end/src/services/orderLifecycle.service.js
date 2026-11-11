import prisma from "../config/prisma.js";
import { reserveStock, releaseStock } from "./stock.service.js";
import { normalizeRequiredReason, requiresPhysicalInventoryReturn } from "./orderLifecycle.rules.js";

const fail = (status, message) => Object.assign(new Error(message), { status });
const idOf = (value) => { const n = Number(value); return Number.isSafeInteger(n) && n > 0 ? n : null; };
const adminOf = (value) => { const id = idOf(value); if (!id) throw fail(401, "شناسه مدیر معتبر نیست."); return id; };

const orderInclude = {
  user: { select: { id: true, username: true, phone: true } },
  items: {
    orderBy: { id: "asc" },
    select: {
      id: true, orderId: true, productId: true, productCode: true, title: true,
      color: true, unitPrice: true, quantity: true, subtotal: true,
      inventoryReturnStatus: true, inventoryReturnedAt: true, inventoryReturnedById: true,
      inventoryReturnReceived: true, inventoryReturnSaleable: true,
      inventoryReturnIssues: {
        orderBy: { createdAt: "desc" },
        select: { id: true, reason: true, status: true, resolutionNote: true, createdAt: true, resolvedAt: true },
      },
    },
  },
};

const serializable = async (callback) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(callback, { isolationLevel: "Serializable" });
    } catch (error) {
      if (error?.code === "P2034" && attempt < 2) continue;
      throw error;
    }
  }
  throw fail(409, "عملیات انجام نشد؛ دوباره تلاش کنید.");
};

const findProduct = async (tx, item) => {
  if (item.productId) {
    const byId = await tx.product.findUnique({ where: { id: item.productId }, select: { id: true } });
    if (byId) return byId;
  }
  if (!item.productCode) return null;
  return tx.product.findFirst({ where: { productCode: item.productCode }, select: { id: true } });
};

const stockBlocker = async (tx, productId, color) => {
  const count = await tx.productColorStock.count({ where: { productId } });
  if (!count) return null;
  if (!color) return "رنگ کالا ثبت نشده و موجودی رنگی قابل شناسایی نیست.";
  const stock = await tx.productColorStock.findUnique({
    where: { productId_color: { productId, color } },
    select: { id: true },
  });
  return stock ? null : "رنگ ثبت‌شده برای این کالا دیگر در موجودی رنگ‌ها وجود ندارد.";
};

const saveIssue = async (tx, { order, item, adminId, reason, received, saleable }) => {
  const claim = await tx.orderItem.updateMany({
    where: { id: item.id, orderId: order.id, inventoryReturnStatus: { not: "RETURNED" } },
    data: { inventoryReturnStatus: "NEEDS_REVIEW", inventoryReturnReceived: received, inventoryReturnSaleable: saleable },
  });
  if (claim.count !== 1) throw fail(409, "وضعیت بازگشت این کالا هم‌زمان تغییر کرده است.");

  const existing = await tx.inventoryReturnIssue.findFirst({
    where: { orderItemId: item.id, status: "OPEN" },
    orderBy: { createdAt: "desc" },
  });
  const issue = existing
    ? await tx.inventoryReturnIssue.update({ where: { id: existing.id }, data: { reason, quantity: item.quantity } })
    : await tx.inventoryReturnIssue.create({
        data: {
          orderId: order.id, orderItemId: item.id, productCode: item.productCode,
          title: item.title, color: item.color || "", quantity: item.quantity, reason, createdById: adminId,
        },
      });

  if (!existing) {
    await tx.adminAuditLog.create({
      data: {
        adminId, action: "ORDER_INVENTORY_RETURN_ISSUE_CREATED",
        targetType: "INVENTORY_RETURN_ISSUE", targetId: issue.id, orderId: order.id,
        details: { orderItemId: item.id, reason },
      },
    });
  }
  return issue;
};

const releaseReservation = async (tx, order) => {
  const claim = await tx.order.updateMany({
    where: { id: order.id, stockReleasedAt: null },
    data: { stockReleasedAt: new Date() },
  });
  if (claim.count !== 1) throw fail(409, "وضعیت رزرو موجودی سفارش هم‌زمان تغییر کرده است.");

  for (const item of order.items) {
    const product = await findProduct(tx, item);
    if (!product) throw fail(409, "محصول «" + item.title + "» پیدا نشد؛ بازگشت موجودی انجام نشد.");
    await releaseStock(tx, { productId: product.id, color: item.color || "", quantity: item.quantity });
  }
};

export const archiveAdminOrder = async (orderId, payload, adminValue) => {
  const id = idOf(orderId), adminId = adminOf(adminValue);
  if (!id) throw fail(400, "شناسه سفارش معتبر نیست.");
  const reason = normalizeRequiredReason(payload?.reason);
  if (!reason) throw fail(400, "علت آرشیو باید بین ۵ تا ۵۰۰ نویسه باشد.");
  if (typeof payload?.returnStock !== "boolean") throw fail(400, "تصمیم بازگشت موجودی مشخص نشده است.");

  return serializable(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: { items: { orderBy: { id: "asc" } }, payments: { select: { id: true, status: true } } },
    });
    if (!order) throw fail(404, "سفارش پیدا نشد.");
    if (order.archivedAt) throw fail(409, "این سفارش قبلاً آرشیو شده است.");
    if (order.payments.some((p) => ["CREATED", "REQUESTING", "REQUESTED"].includes(p.status))) {
      throw fail(409, "برای این سفارش پرداخت تعیین‌تکلیف‌نشده وجود دارد؛ ابتدا وضعیت پرداخت را مشخص کنید.");
    }
    if (payload.returnStock && requiresPhysicalInventoryReturn(order.status)) {
      throw fail(409, "برای سفارش ارسال‌شده یا تحویل‌شده، بازگشت موجودی باید جداگانه و برای هر کالا پس از دریافت فیزیکی تأیید شود.");
    }

    let stockReturned = false;
    if (payload.returnStock && order.stockReleasedAt === null) {
      await releaseReservation(tx, order);
      stockReturned = true;
    }

    const updated = await tx.order.updateMany({
      where: { id, archivedAt: null },
      data: { archivedAt: new Date(), archivedById: adminId, archiveReason: reason },
    });
    if (updated.count !== 1) throw fail(409, "سفارش هم‌زمان آرشیو شده است.");

    await tx.adminAuditLog.create({
      data: {
        adminId, action: "ORDER_ARCHIVED", targetType: "ORDER", targetId: id, orderId: id,
        details: { previousStatus: order.status, reason, stockReturned, paymentStatuses: order.payments.map((p) => p.status) },
      },
    });
    return tx.order.findUnique({ where: { id }, include: orderInclude });
  });
};

export const restoreAdminOrder = async (orderId, adminValue) => {
  const id = idOf(orderId), adminId = adminOf(adminValue);
  if (!id) throw fail(400, "شناسه سفارش معتبر نیست.");

  return serializable(async (tx) => {
    const order = await tx.order.findUnique({ where: { id }, include: { items: { orderBy: { id: "asc" } } } });
    if (!order) throw fail(404, "سفارش پیدا نشد.");
    if (!order.archivedAt) throw fail(409, "این سفارش در آرشیو نیست.");

    let stockReserved = false;
    if (order.stockReleasedAt && order.status !== "CANCELLED" && !requiresPhysicalInventoryReturn(order.status)) {
      for (const item of order.items) {
        const product = await findProduct(tx, item);
        if (!product) throw fail(409, "محصول «" + item.title + "» پیدا نشد؛ بازیابی سفارش انجام نشد.");
        await reserveStock(tx, { productId: product.id, color: item.color || "", quantity: item.quantity, title: item.title });
        if (item.productId !== product.id) await tx.orderItem.update({ where: { id: item.id }, data: { productId: product.id } });
      }
      stockReserved = true;
    }

    const updated = await tx.order.updateMany({
      where: { id, archivedAt: { not: null } },
      data: {
        archivedAt: null, archivedById: null, archiveReason: null,
        ...(stockReserved ? { stockReleasedAt: null } : {}),
      },
    });
    if (updated.count !== 1) throw fail(409, "وضعیت آرشیو سفارش هم‌زمان تغییر کرده است.");

    await tx.adminAuditLog.create({
      data: {
        adminId, action: "ORDER_RESTORED", targetType: "ORDER", targetId: id, orderId: id,
        details: { stockReserved },
      },
    });
    return tx.order.findUnique({ where: { id }, include: orderInclude });
  });
};

export const updateAdminOrderItemInventoryReturn = async (orderId, itemId, payload, adminValue) => {
  const id = idOf(orderId), lineId = idOf(itemId), adminId = adminOf(adminValue);
  if (!id || !lineId) throw fail(400, "شناسه سفارش یا کالا معتبر نیست.");
  const { received, saleable } = payload || {};
  if (typeof received !== "boolean" || typeof saleable !== "boolean" || (!received && saleable)) {
    throw fail(400, "تأیید دریافت فیزیکی و قابل‌فروش بودن کالا معتبر نیست.");
  }
  const suppliedReason = typeof payload?.reason === "string" ? payload.reason.trim() : "";
  if ((!received || !saleable) && !normalizeRequiredReason(suppliedReason)) {
    throw fail(400, "برای کالای دریافت‌نشده یا غیرقابل‌فروش، علت بررسی الزامی است.");
  }

  return serializable(async (tx) => {
    const order = await tx.order.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!order) throw fail(404, "سفارش پیدا نشد.");
    if (!requiresPhysicalInventoryReturn(order.status)) {
      throw fail(409, "بازگشت فیزیکی موجودی فقط برای سفارش ارسال‌شده یا تحویل‌شده مجاز است.");
    }
    const item = await tx.orderItem.findFirst({ where: { id: lineId, orderId: id } });
    if (!item) throw fail(404, "قلم سفارش پیدا نشد.");
    if (item.inventoryReturnStatus === "RETURNED") throw fail(409, "موجودی این کالا قبلاً بازگردانده شده است.");

    let product = null, blocker = null;
    if (received && saleable) {
      product = await findProduct(tx, item);
      blocker = product ? await stockBlocker(tx, product.id, item.color || "") : "محصول دیگر در فروشگاه وجود ندارد.";
    }

    if (!received || !saleable || blocker) {
      await saveIssue(tx, {
        order, item, adminId,
        reason: suppliedReason || blocker || "وضعیت فیزیکی و قابلیت فروش کالا نیازمند بررسی است.",
        received, saleable,
      });
      return tx.order.findUnique({ where: { id }, include: orderInclude });
    }

    const claim = await tx.orderItem.updateMany({
      where: { id: lineId, orderId: id, inventoryReturnStatus: { not: "RETURNED" } },
      data: { inventoryReturnStatus: "NEEDS_REVIEW", inventoryReturnReceived: true, inventoryReturnSaleable: true },
    });
    if (claim.count !== 1) throw fail(409, "وضعیت بازگشت این کالا هم‌زمان تغییر کرده است.");

    await releaseStock(tx, { productId: product.id, color: item.color || "", quantity: item.quantity });
    await tx.orderItem.update({
      where: { id: lineId },
      data: {
        inventoryReturnStatus: "RETURNED", inventoryReturnedAt: new Date(),
        inventoryReturnedById: adminId, inventoryReturnReceived: true, inventoryReturnSaleable: true,
        ...(item.productId !== product.id ? { productId: product.id } : {}),
      },
    });

    const openIssues = await tx.inventoryReturnIssue.findMany({
      where: { orderItemId: lineId, status: "OPEN" }, select: { id: true },
    });
    if (openIssues.length) {
      await tx.inventoryReturnIssue.updateMany({
        where: { id: { in: openIssues.map((x) => x.id) }, status: "OPEN" },
        data: { status: "RESOLVED", resolutionNote: "با تأیید دریافت و سلامت کالا، موجودی بازگردانده شد.", resolvedAt: new Date(), resolvedById: adminId },
      });
      for (const issue of openIssues) {
        await tx.adminAuditLog.create({
          data: { adminId, action: "ORDER_INVENTORY_RETURN_ISSUE_RESOLVED", targetType: "INVENTORY_RETURN_ISSUE", targetId: issue.id, orderId: id, details: { resolution: "RETURN_STOCK" } },
        });
      }
    }

    await tx.adminAuditLog.create({
      data: {
        adminId, action: "ORDER_INVENTORY_RETURNED", targetType: "ORDER_ITEM", targetId: lineId, orderId: id,
        details: { quantity: item.quantity, productCode: item.productCode, color: item.color || "" },
      },
    });
    return tx.order.findUnique({ where: { id }, include: orderInclude });
  });
};

export const resolveInventoryReturnIssue = async (issueId, payload, adminValue) => {
  const id = idOf(issueId), adminId = adminOf(adminValue);
  if (!id) throw fail(400, "شناسه مشکل بازگشت موجودی معتبر نیست.");
  const action = payload?.action;
  const note = normalizeRequiredReason(payload?.resolutionNote, { min: 3, max: 500 });
  if (!["RETURN_STOCK", "DISMISS"].includes(action) || !note) {
    throw fail(400, "نوع تصمیم و توضیح بررسی معتبر و الزامی است.");
  }

  return serializable(async (tx) => {
    const issue = await tx.inventoryReturnIssue.findUnique({ where: { id }, include: { orderItem: true } });
    if (!issue) throw fail(404, "مشکل بازگشت موجودی پیدا نشد.");
    if (issue.status !== "OPEN") throw fail(409, "این مشکل قبلاً تعیین‌تکلیف شده است.");

    if (action === "RETURN_STOCK") {
      const item = issue.orderItem;
      if (!item || !item.inventoryReturnReceived || !item.inventoryReturnSaleable) {
        throw fail(409, "دریافت فیزیکی و قابل‌فروش بودن کالا باید تأیید شده باشد.");
      }
      if (item.inventoryReturnStatus === "RETURNED") throw fail(409, "موجودی این کالا قبلاً بازگردانده شده است.");
      const product = await findProduct(tx, item);
      if (!product) throw fail(409, "محصول هنوز در فروشگاه پیدا نمی‌شود.");
      const blocker = await stockBlocker(tx, product.id, item.color || "");
      if (blocker) throw fail(409, blocker);

      const claim = await tx.orderItem.updateMany({
        where: { id: item.id, inventoryReturnStatus: { not: "RETURNED" }, inventoryReturnReceived: true, inventoryReturnSaleable: true },
        data: { inventoryReturnStatus: "NEEDS_REVIEW" },
      });
      if (claim.count !== 1) throw fail(409, "وضعیت کالا هم‌زمان تغییر کرده است.");
      await releaseStock(tx, { productId: product.id, color: item.color || "", quantity: item.quantity });
      await tx.orderItem.update({
        where: { id: item.id },
        data: {
          inventoryReturnStatus: "RETURNED", inventoryReturnedAt: new Date(), inventoryReturnedById: adminId,
          ...(item.productId !== product.id ? { productId: product.id } : {}),
        },
      });
    }

    const updated = await tx.inventoryReturnIssue.updateMany({
      where: { id, status: "OPEN" },
      data: { status: action === "RETURN_STOCK" ? "RESOLVED" : "DISMISSED", resolutionNote: note, resolvedAt: new Date(), resolvedById: adminId },
    });
    if (updated.count !== 1) throw fail(409, "وضعیت مشکل هم‌زمان تغییر کرده است.");

    await tx.adminAuditLog.create({
      data: {
        adminId, action: "ORDER_INVENTORY_RETURN_ISSUE_RESOLVED", targetType: "INVENTORY_RETURN_ISSUE",
        targetId: id, orderId: issue.orderId, details: { resolution: action, resolutionNote: note },
      },
    });
    if (action === "RETURN_STOCK" && issue.orderItemId) {
      await tx.adminAuditLog.create({
        data: {
          adminId, action: "ORDER_INVENTORY_RETURNED", targetType: "ORDER_ITEM", targetId: issue.orderItemId,
          orderId: issue.orderId, details: { quantity: issue.quantity, productCode: issue.productCode, color: issue.color },
        },
      });
    }
    return tx.inventoryReturnIssue.findUnique({ where: { id } });
  });
};
