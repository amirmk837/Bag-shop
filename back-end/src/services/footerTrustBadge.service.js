import prisma from "../config/prisma.js";

const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const parseId = (value) => {
  const id = Number(value);

  if (!Number.isSafeInteger(id) || id < 1) {
    throw createError(400, "شناسه نماد اعتماد نامعتبر است.");
  }

  return id;
};

const validateText = (value, max, field) => {
  if (typeof value !== "string") {
    throw createError(400, `${field} الزامی است.`);
  }

  const text = value.trim();

  if (!text || text.length > max) {
    throw createError(400, `${field} باید بین ۱ تا ${max} کاراکتر باشد.`);
  }

  return text;
};

const normalizeLinkUrl = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw createError(400, "لینک نماد معتبر نیست.");
  }

  const link = value.trim();

  if (!link || link.length > 2048 || /[\u0000-\u001F\\]/.test(link)) {
    throw createError(400, "لینک نماد معتبر نیست.");
  }

  if (link.startsWith("/")) {
    if (link.startsWith("//")) {
      throw createError(400, "لینک داخلی معتبر نیست.");
    }

    try {
      const url = new URL(link, "https://internal.invalid");
      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      throw createError(400, "لینک داخلی معتبر نیست.");
    }
  }

  if (/^[a-z][a-z\d+.-]*:/i.test(link) && !/^https?:\/\//i.test(link)) {
    throw createError(400, "فقط لینک HTTP و HTTPS مجاز است.");
  }

  try {
    const url = new URL(/^https?:\/\//i.test(link) ? link : `https://${link}`);

    if (
      !["http:", "https:"].includes(url.protocol) ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      throw new Error("Invalid URL");
    }

    return url.toString();
  } catch {
    throw createError(400, "لینک واردشده معتبر نیست.");
  }
};

const validateImageUrl = (value) => {
  if (
    typeof value !== "string" ||
    !/^\/uploads\/footer-trust\/[a-zA-Z0-9._-]+$/.test(value)
  ) {
    throw createError(400, "آدرس تصویر نماد معتبر نیست.");
  }

  return value;
};

const normalizeSortOrder = (value) => {
  const order = Number(value ?? 0);

  if (!Number.isSafeInteger(order) || order < 0 || order > 100000) {
    throw createError(400, "ترتیب نمایش نامعتبر است.");
  }

  return order;
};

const normalizeBoolean = (value, fallback) => {
  if (value === undefined) return fallback;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;

  throw createError(400, "وضعیت نمایش نامعتبر است.");
};

export const getPublicFooterTrustBadges = () =>
  prisma.footerTrustBadge.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      altText: true,
      linkUrl: true,
      sortOrder: true,
    },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });

export const getAdminFooterTrustBadges = () =>
  prisma.footerTrustBadge.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });

export const createFooterTrustBadge = (input) => {
  return prisma.footerTrustBadge.create({
    data: {
      title: validateText(input.title, 100, "عنوان نماد"),
      imageUrl: validateImageUrl(input.imageUrl),
      altText: validateText(input.altText, 180, "متن جایگزین تصویر"),
      linkUrl: normalizeLinkUrl(input.linkUrl),
      sortOrder: normalizeSortOrder(input.sortOrder),
      isActive: normalizeBoolean(input.isActive, true),
    },
  });
};

export const updateFooterTrustBadge = async (value, input) => {
  const id = parseId(value);

  const existing = await prisma.footerTrustBadge.findUnique({
    where: { id },
  });

  if (!existing) {
    throw createError(404, "نماد اعتماد پیدا نشد.");
  }

  const data = {};

  if (input.title !== undefined) {
    data.title = validateText(input.title, 100, "عنوان نماد");
  }

  if (input.altText !== undefined) {
    data.altText = validateText(input.altText, 180, "متن جایگزین تصویر");
  }

  if (input.imageUrl !== undefined) {
    data.imageUrl = validateImageUrl(input.imageUrl);
  }

  if (input.linkUrl !== undefined) {
    data.linkUrl = normalizeLinkUrl(input.linkUrl);
  }

  if (input.sortOrder !== undefined) {
    data.sortOrder = normalizeSortOrder(input.sortOrder);
  }

  if (input.isActive !== undefined) {
    data.isActive = normalizeBoolean(input.isActive);
  }

  const updated = await prisma.footerTrustBadge.update({
    where: { id },
    data,
  });

  return {
    badge: updated,
    previousImageUrl: existing.imageUrl,
  };
};

export const deleteFooterTrustBadge = async (value) => {
  const id = parseId(value);

  const existing = await prisma.footerTrustBadge.findUnique({
    where: { id },
  });

  if (!existing) {
    throw createError(404, "نماد اعتماد پیدا نشد.");
  }

  await prisma.footerTrustBadge.delete({ where: { id } });

  return existing;
};
