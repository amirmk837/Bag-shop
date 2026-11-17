import prisma from "../config/prisma.js";

const RETENTION_DAYS = 90;
const MAX_VISITS_PER_ADMIN = 50;
const DEDUPE_WINDOW_MS = 30_000;

const STATIC_ADMIN_PAGES = new Set([
  "/admin",
  "/admin/products",
  "/admin/products/create",
  "/admin/discounts",
  "/admin/categories",
  "/admin/orders",
  "/admin/product-comments",
  "/admin/support",
  "/admin/analytics",
  "/admin/users",
  "/admin/banners",
  "/admin/footer-trust-badges",
  "/admin/social-links",
  "/admin/payment-settings",
  "/admin/faq",
  "/admin/about",
  "/admin/site-settings",
  "/admin/shipping-methods",
]);

export const normalizeAdminPagePath = (value) => {
  if (typeof value !== "string" || value.length > 500) return null;
  const path = value.split(/[?#]/, 1)[0];
  if (!path.startsWith("/admin") || path.startsWith("//")) return null;

  if (STATIC_ADMIN_PAGES.has(path)) return path;

  // Dynamic route parameters are represented by templates, never stored verbatim.
  if (/^\/admin\/products\/[a-zA-Z0-9_-]{1,80}\/edit$/.test(path)) {
    return "/admin/products/:productCode/edit";
  }
  if (/^\/admin\/categories\/[a-z0-9-]{1,80}$/i.test(path)) {
    return "/admin/categories/:slug";
  }
  return null;
};

const purgeExpiredVisits = (db, cutoff) => db.adminPageVisit.deleteMany({
  where: { createdAt: { lt: cutoff } },
});

export const recordAdminPageVisit = async ({ adminId, path }) => {
  const normalizedAdminId = Number(adminId);
  const safePath = normalizeAdminPagePath(path);
  if (!Number.isSafeInteger(normalizedAdminId) || normalizedAdminId < 1 || !safePath) {
    return false;
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const recent = await prisma.adminPageVisit.findFirst({
    where: {
      adminId: normalizedAdminId,
      path: safePath,
      createdAt: { gte: new Date(now.getTime() - DEDUPE_WINDOW_MS) },
    },
    select: { id: true },
  });
  if (recent) {
    await purgeExpiredVisits(prisma, cutoff);
    return false;
  }

  await prisma.$transaction(async (tx) => {
    await tx.adminPageVisit.create({
      data: { adminId: normalizedAdminId, path: safePath },
    });
    await purgeExpiredVisits(tx, cutoff);

    const overflow = await tx.adminPageVisit.findMany({
      where: { adminId: normalizedAdminId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: MAX_VISITS_PER_ADMIN,
      select: { id: true },
    });
    if (overflow.length) {
      await tx.adminPageVisit.deleteMany({
        where: { id: { in: overflow.map((item) => item.id) } },
      });
    }
  });

  return true;
};

export const getRecentAdminPageVisits = async (adminId) => {
  const normalizedAdminId = Number(adminId);
  if (!Number.isSafeInteger(normalizedAdminId) || normalizedAdminId < 1) {
    const error = new Error("شناسه مدیر معتبر نیست.");
    error.status = 400;
    throw error;
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  await purgeExpiredVisits(prisma, cutoff);

  return prisma.adminPageVisit.findMany({
    where: { adminId: normalizedAdminId, createdAt: { gte: cutoff } },
    select: { path: true, createdAt: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: MAX_VISITS_PER_ADMIN,
  });
};
