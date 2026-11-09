import express from "express";
import { z } from "zod";
import prisma from "../config/prisma.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";
import { requireCustomer } from "../middlewares/customer.middleware.js";
import { createRateLimiter } from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

const limitCustomerMessage = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 6,
});

const commentSchema = z.object({
  type: z.enum(["COMMENT", "QUESTION"]).default("COMMENT"),
  content: z.string().trim().min(10).max(1500),
});

const supportCreateSchema = z.object({
  topic: z.enum(["ORDER", "PAYMENT", "PRODUCT", "SHIPPING", "ACCOUNT", "OTHER"]),
  content: z.string().trim().min(5).max(2000),
});

const messageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

const adminCommentSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  priority: z.enum(["URGENT", "HIGH", "NORMAL", "LOW"]).optional(),
  adminReply: z.string().trim().min(1).max(1500).nullable().optional(),
}).refine((value) => Object.keys(value).length > 0);

const adminTicketSchema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "ANSWERED", "CLOSED"]),
}).strict();

const supportDaySchema = z.object({
  enabled: z.boolean(),
  start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
}).strict().refine((day) => !day.enabled || day.start < day.end);

const supportHoursSchema = z.object({
  saturday: supportDaySchema,
  sunday: supportDaySchema,
  monday: supportDaySchema,
  tuesday: supportDaySchema,
  wednesday: supportDaySchema,
  thursday: supportDaySchema,
  friday: supportDaySchema,
}).strict();

const supportSettingsSchema = z.object({
  supportHours: supportHoursSchema,
  supportResponseText: z.string().trim().max(240),
}).strict();

const parseId = (value) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const parsePagination = (query) => {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 50) {
    return null;
  }
  return { page, limit, skip: (page - 1) * limit };
};

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });

const customerOnly = [requireAuth, requireCustomer];

// Public: only approved comments are visible to customers.
router.get("/products/:productCode/comments", async (req, res) => {
  try {
    const productCode = String(req.params.productCode || "").trim();
    if (!productCode || productCode.length > 100) return sendError(res, 400, "شناسه محصول نامعتبر است.");

    const product = await prisma.product.findUnique({
      where: { productCode },
      select: { id: true },
    });
    if (!product) return sendError(res, 404, "محصول پیدا نشد.");

    const pagination = parsePagination(req.query);
    if (!pagination) return sendError(res, 400, "شماره صفحه یا تعداد موارد نامعتبر است.");

    const [items, total] = await prisma.$transaction([
      prisma.productComment.findMany({
        where: { productId: product.id, status: "APPROVED" },
        select: {
          id: true, type: true, content: true, adminReply: true,
          repliedAt: true, createdAt: true,
          user: { select: { username: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.productComment.count({ where: { productId: product.id, status: "APPROVED" } }),
    ]);

    return res.json({
      success: true,
      data: items.map((item) => ({
        ...item,
        author: item.user?.username || "مشتری",
        user: undefined,
      })),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    });
  } catch (error) {
    console.error("Public product comments error:", error);
    return sendError(res, 500, "دریافت دیدگاه‌ها ممکن نیست.");
  }
});

router.post("/products/:productCode/comments", ...customerOnly, limitCustomerMessage, async (req, res) => {
  try {
    const validation = commentSchema.safeParse(req.body);
    if (!validation.success) return sendError(res, 400, "متن دیدگاه باید بین ۱۰ تا ۱۵۰۰ نویسه باشد.");

    const productCode = String(req.params.productCode || "").trim();
    const product = await prisma.product.findUnique({
      where: { productCode },
      select: { id: true },
    });
    if (!product) return sendError(res, 404, "محصول پیدا نشد.");

    const comment = await prisma.productComment.create({
      data: {
        productId: product.id,
        userId: req.user.id,
        type: validation.data.type,
        content: validation.data.content,
      },
      select: { id: true, type: true, content: true, status: true, createdAt: true },
    });

    return res.status(201).json({
      success: true,
      data: comment,
      message: "دیدگاه شما برای بررسی مدیر ثبت شد.",
    });
  } catch (error) {
    console.error("Create product comment error:", error);
    return sendError(res, 500, "ثبت دیدگاه انجام نشد.");
  }
});

// Admin: chronological moderation queue with explicit priority control.
router.get("/admin/product-comments", requireAuth, requireAdmin, async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    if (!pagination) return sendError(res, 400, "صفحه‌بندی نامعتبر است.");

    const where = {};
    if (["PENDING", "APPROVED", "REJECTED"].includes(req.query.status)) where.status = req.query.status;
    if (["URGENT", "HIGH", "NORMAL", "LOW"].includes(req.query.priority)) where.priority = req.query.priority;

    const [items, total] = await prisma.$transaction([
      prisma.productComment.findMany({
        where,
        include: {
          product: { select: { id: true, productCode: true, title: true } },
          user: { select: { id: true, username: true, phone: true } },
          repliedBy: { select: { id: true, username: true } },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.productComment.count({ where }),
    ]);

    return res.json({
      success: true,
      data: items,
      pagination: { page: pagination.page, limit: pagination.limit, total, totalPages: Math.ceil(total / pagination.limit) },
    });
  } catch (error) {
    console.error("Admin product comments error:", error);
    return sendError(res, 500, "دریافت دیدگاه‌ها ممکن نیست.");
  }
});

router.patch("/admin/product-comments/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return sendError(res, 400, "شناسه دیدگاه نامعتبر است.");

    const validation = adminCommentSchema.safeParse(req.body);
    if (!validation.success) return sendError(res, 400, "اطلاعات ویرایش دیدگاه نامعتبر است.");

    const data = { ...validation.data };
    if (Object.hasOwn(data, "adminReply")) {
      if (data.adminReply === null) {
        data.repliedAt = null;
        data.repliedById = null;
      } else {
        data.repliedAt = new Date();
        data.repliedById = req.user.id;
        data.status = "APPROVED";
      }
    }

    const updated = await prisma.productComment.update({
      where: { id },
      data,
      include: {
        product: { select: { id: true, productCode: true, title: true } },
        user: { select: { id: true, username: true, phone: true } },
      },
    });
    return res.json({ success: true, data: updated });
  } catch (error) {
    if (error?.code === "P2025") return sendError(res, 404, "دیدگاه پیدا نشد.");
    console.error("Update product comment error:", error);
    return sendError(res, 500, "ذخیره تغییرات دیدگاه انجام نشد.");
  }
});

router.delete("/admin/product-comments/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return sendError(res, 400, "شناسه دیدگاه نامعتبر است.");

    await prisma.productComment.delete({ where: { id } });
    return res.json({ success: true, message: "دیدگاه حذف شد." });
  } catch (error) {
    if (error?.code === "P2025") return sendError(res, 404, "دیدگاه پیدا نشد.");
    console.error("Delete product comment error:", error);
    return sendError(res, 500, "حذف دیدگاه انجام نشد.");
  }
});

// Public support information. Sending or reading conversations still requires login.
router.get("/support/settings", async (_req, res) => {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 1 },
      select: { supportHours: true, supportResponseText: true },
    });
    return res.json({
      success: true,
      data: {
        supportHours: settings?.supportHours ?? null,
        supportResponseText: settings?.supportResponseText ?? "",
      },
    });
  } catch (error) {
    console.error("Public support settings error:", error);
    return sendError(res, 500, "دریافت وضعیت پشتیبانی ممکن نیست.");
  }
});

router.put("/admin/support/settings", requireAuth, requireAdmin, async (req, res) => {
  try {
    const validation = supportSettingsSchema.safeParse(req.body);
    if (!validation.success) return sendError(res, 400, "ساعات کاری یا متن پاسخگویی نامعتبر است.");

    const saved = await prisma.siteSettings.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        supportHours: validation.data.supportHours,
        supportResponseText: validation.data.supportResponseText,
      },
      update: validation.data,
      select: { supportHours: true, supportResponseText: true },
    });
    return res.json({ success: true, data: saved, message: "تنظیمات پشتیبانی ذخیره شد." });
  } catch (error) {
    console.error("Update support settings error:", error);
    return sendError(res, 500, "ذخیره تنظیمات پشتیبانی انجام نشد.");
  }
});

// Customer support: one ticket per conversation, with a persistent message history.
router.post("/support", ...customerOnly, limitCustomerMessage, async (req, res) => {
  try {
    const validation = supportCreateSchema.safeParse(req.body);
    if (!validation.success) return sendError(res, 400, "موضوع یا متن پیام نامعتبر است.");

    const account = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        username: true,
        phone: true,
        address: {
          select: {
            province: true, city: true, addressLine: true, postalCode: true,
            plateNumber: true, unitNumber: true,
          },
        },
      },
    });
    const customerName = String(account?.username || "").trim();
    const customerPhone = account?.phone ? String(account.phone) : null;
    const address = account?.address;
    const customerAddress = address
      ? [
          address.province,
          address.city,
          address.addressLine,
          address.plateNumber ? `پلاک ${address.plateNumber}` : null,
          address.unitNumber ? `واحد ${address.unitNumber}` : null,
          address.postalCode ? `کدپستی ${address.postalCode}` : null,
        ].filter(Boolean).join("، ")
      : null;
    if (!customerName) return sendError(res, 400, "اطلاعات حساب کاربری کامل نیست.");

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: req.user.id,
        topic: validation.data.topic,
        customerName,
        customerPhone,
        customerAddress,
        messages: {
          create: {
            senderId: req.user.id,
            senderRole: "USER",
            content: validation.data.content,
          },
        },
      },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    return res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    console.error("Create support ticket error:", error);
    return sendError(res, 500, "ثبت درخواست پشتیبانی انجام نشد.");
  }
});

router.get("/support", ...customerOnly, async (req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: req.user.id },
      orderBy: { lastMessageAt: "desc" },
      take: 50,
      select: {
        id: true, topic: true, status: true,
        lastMessageAt: true, createdAt: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true, senderRole: true, createdAt: true } },
      },
    });
    return res.json({ success: true, data: tickets });
  } catch (error) {
    console.error("Customer support list error:", error);
    return sendError(res, 500, "دریافت درخواست‌های پشتیبانی ممکن نیست.");
  }
});

router.get("/support/:id", ...customerOnly, async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return sendError(res, 400, "شناسه درخواست نامعتبر است.");
    const ticket = await prisma.supportTicket.findFirst({
      where: { id, userId: req.user.id },
      include: { messages: { orderBy: { createdAt: "asc" }, select: { id: true, senderRole: true, content: true, createdAt: true } } },
    });
    if (!ticket) return sendError(res, 404, "درخواست پشتیبانی پیدا نشد.");
    return res.json({ success: true, data: ticket });
  } catch (error) {
    console.error("Customer support detail error:", error);
    return sendError(res, 500, "دریافت گفت‌وگو ممکن نیست.");
  }
});

router.post("/support/:id/messages", ...customerOnly, limitCustomerMessage, async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return sendError(res, 400, "شناسه درخواست نامعتبر است.");
    const validation = messageSchema.safeParse(req.body);
    if (!validation.success) return sendError(res, 400, "متن پیام نامعتبر است.");

    const ticket = await prisma.supportTicket.findFirst({
      where: { id, userId: req.user.id },
      select: { id: true, status: true },
    });
    if (!ticket) return sendError(res, 404, "درخواست پشتیبانی پیدا نشد.");
    if (ticket.status === "CLOSED") return sendError(res, 409, "این گفت‌وگو بسته شده است.");

    const [message] = await prisma.$transaction([
      prisma.supportMessage.create({
        data: { ticketId: id, senderId: req.user.id, senderRole: "USER", content: validation.data.content },
      }),
      prisma.supportTicket.update({
        where: { id },
        data: { status: "IN_PROGRESS", lastMessageAt: new Date() },
      }),
    ]);
    return res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error("Customer support message error:", error);
    return sendError(res, 500, "ارسال پیام انجام نشد.");
  }
});

// Admin support inbox.
router.get("/admin/support", requireAuth, requireAdmin, async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    if (!pagination) return sendError(res, 400, "صفحه‌بندی نامعتبر است.");

    const where = {};
    if (req.query.status === "OPEN") where.status = { in: ["NEW", "IN_PROGRESS"] };
    else if (["NEW", "IN_PROGRESS", "ANSWERED", "CLOSED"].includes(req.query.status)) where.status = req.query.status;
    if (["ORDER", "PAYMENT", "PRODUCT", "SHIPPING", "ACCOUNT", "OTHER"].includes(req.query.topic)) where.topic = req.query.topic;

    const [items, total] = await prisma.$transaction([
      prisma.supportTicket.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, phone: true } },
          messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true, senderRole: true, createdAt: true } },
        },
        orderBy: [{ lastMessageAt: "desc" }, { id: "desc" }],
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.supportTicket.count({ where }),
    ]);
    return res.json({ success: true, data: items, pagination: { page: pagination.page, limit: pagination.limit, total, totalPages: Math.ceil(total / pagination.limit) } });
  } catch (error) {
    console.error("Admin support inbox error:", error);
    return sendError(res, 500, "دریافت پیام‌های پشتیبانی ممکن نیست.");
  }
});

router.get("/admin/support/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return sendError(res, 400, "شناسه درخواست نامعتبر است.");
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, phone: true } },
        messages: { orderBy: { createdAt: "asc" }, include: { sender: { select: { id: true, username: true } } } },
      },
    });
    if (!ticket) return sendError(res, 404, "درخواست پشتیبانی پیدا نشد.");
    return res.json({ success: true, data: ticket });
  } catch (error) {
    console.error("Admin support detail error:", error);
    return sendError(res, 500, "دریافت گفت‌وگو ممکن نیست.");
  }
});

router.post("/admin/support/:id/messages", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return sendError(res, 400, "شناسه درخواست نامعتبر است.");
    const validation = messageSchema.safeParse(req.body);
    if (!validation.success) return sendError(res, 400, "متن پاسخ نامعتبر است.");

    const ticket = await prisma.supportTicket.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!ticket) return sendError(res, 404, "درخواست پشتیبانی پیدا نشد.");

    const [message] = await prisma.$transaction([
      prisma.supportMessage.create({
        data: { ticketId: id, senderId: req.user.id, senderRole: "ADMIN", content: validation.data.content },
      }),
      prisma.supportTicket.update({
        where: { id },
        data: { status: "ANSWERED", lastMessageAt: new Date() },
      }),
    ]);
    return res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error("Admin support reply error:", error);
    return sendError(res, 500, "ارسال پاسخ انجام نشد.");
  }
});

router.patch("/admin/support/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return sendError(res, 400, "شناسه درخواست نامعتبر است.");
    const validation = adminTicketSchema.safeParse(req.body);
    if (!validation.success) return sendError(res, 400, "وضعیت نامعتبر است.");
    const ticket = await prisma.supportTicket.update({ where: { id }, data: validation.data });
    return res.json({ success: true, data: ticket });
  } catch (error) {
    if (error?.code === "P2025") return sendError(res, 404, "درخواست پشتیبانی پیدا نشد.");
    console.error("Admin support update error:", error);
    return sendError(res, 500, "ذخیره تغییرات انجام نشد.");
  }
});

router.delete("/admin/support/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return sendError(res, 400, "شناسه درخواست نامعتبر است.");

    await prisma.supportTicket.delete({ where: { id } });
    return res.json({ success: true, message: "گفت‌وگو و پیام‌های آن حذف شدند." });
  } catch (error) {
    if (error?.code === "P2025") return sendError(res, 404, "درخواست پشتیبانی پیدا نشد.");
    console.error("Delete support ticket error:", error);
    return sendError(res, 500, "حذف گفت‌وگو انجام نشد.");
  }
});

router.get("/admin/feedback-summary", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const [pendingComments, newTickets, unansweredTickets] = await prisma.$transaction([
      prisma.productComment.count({ where: { status: "PENDING" } }),
      prisma.supportTicket.count({ where: { status: "NEW" } }),
      prisma.supportTicket.count({ where: { status: { in: ["NEW", "IN_PROGRESS"] } } }),
    ]);
    return res.json({ success: true, data: { pendingComments, newTickets, unansweredTickets } });
  } catch (error) {
    console.error("Admin feedback summary error:", error);
    return sendError(res, 500, "دریافت خلاصه پیام‌ها ممکن نیست.");
  }
});

export default router;
