import prisma from "../config/prisma.js";

const createBannerError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const parseId = (value) => {
  const id = Number(value);

  if (!Number.isSafeInteger(id) || id < 1) {
    throw createBannerError(400, "شناسه بنر نامعتبر است.");
  }

  return id;
};

const validateName = (value) => {
  const name = String(value || "").trim();

  if (!name || name.length > 120) {
    throw createBannerError(400, "نام بنر باید بین ۱ تا ۱۲۰ کاراکتر باشد.");
  }

  return name;
};

const validateFit = (value) => {
  if (!["cover", "contain"].includes(value)) {
    throw createBannerError(400, "حالت نمایش تصویر نامعتبر است.");
  }

  return value;
};

const validateImageUrl = (value) => {
  if (typeof value !== "string" || !value.startsWith("/uploads/banners/")) {
    throw createBannerError(400, "آدرس تصویر بنر نامعتبر است.");
  }

  return value;
};

const normalizeLinkUrl = (value) => {
  const link = String(value ?? "").trim();

  if (!link) return null;

  if (link.length > 2048 || /[\u0000-\u001F\\]/.test(link)) {
    throw createBannerError(400, "لینک بنر نامعتبر است.");
  }

  if (link.startsWith("/")) {
    if (link.startsWith("//")) {
      throw createBannerError(400, "لینک داخلی نامعتبر است.");
    }

    try {
      const url = new URL(link, "https://internal.invalid");
      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      throw createBannerError(400, "لینک بنر نامعتبر است.");
    }
  }

  if (/^[a-z][a-z\d+.-]*:/i.test(link) && !/^https?:\/\//i.test(link)) {
    throw createBannerError(400, "فقط لینک‌های HTTP و HTTPS مجاز هستند.");
  }

  const normalizedInput = /^https?:\/\//i.test(link) ? link : `https://${link}`;

  try {
    const url = new URL(normalizedInput);

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
    throw createBannerError(400, "لینک بنر معتبر نیست.");
  }
};

// PUBLIC: ACTIVE BANNERS
export const getActiveBanners = async () => {
  return prisma.banner.findMany({
    where: { isActive: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
};

// ADMIN: ALL BANNERS
export const getAdminBanners = async () => {
  return prisma.banner.findMany({
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }, { id: "desc" }],
  });
};

// ADMIN: CREATE
export const createBanner = async ({
  name,
  imageUrl,
  desktopImageUrl,
  mobileImageUrl,
  linkUrl,
  fit = "contain",
  isActive = false,
}) => {
  const safeName = validateName(name);
  const safeFit = validateFit(fit);
  const safeLink = normalizeLinkUrl(linkUrl);

  const desktop = validateImageUrl(desktopImageUrl);
  const mobile = validateImageUrl(mobileImageUrl);

  return prisma.banner.create({
    data: {
      name: safeName,
      imageUrl: desktop,
      desktopImageUrl: desktop,
      mobileImageUrl: mobile,
      linkUrl: safeLink,
      fit: safeFit,
      isActive: isActive === true,
    },
  });
};

// ADMIN: UPDATE SETTINGS
export const updateBanner = async (value, input) => {
  const id = parseId(value);

  const existing = await prisma.banner.findUnique({
    where: { id },
  });

  if (!existing) {
    throw createBannerError(404, "بنر پیدا نشد.");
  }

  const data = {};

  if (input.name !== undefined) {
    data.name = validateName(input.name);
  }

  if (input.linkUrl !== undefined) {
    data.linkUrl = normalizeLinkUrl(input.linkUrl);
  }

  if (input.fit !== undefined) {
    data.fit = validateFit(input.fit);
  }

  if (input.isActive !== undefined) {
    if (input.isActive !== true && input.isActive !== false) {
      throw createBannerError(400, "وضعیت فعال‌بودن بنر نامعتبر است.");
    }

    data.isActive = input.isActive;
  }

  return prisma.banner.update({
    where: { id },
    data,
  });
};

// ADMIN: ACTIVATE
export const activateBanner = async (value) => {
  const id = parseId(value);

  const banner = await prisma.banner.findUnique({
    where: { id },
  });

  if (!banner) {
    throw createBannerError(404, "بنر پیدا نشد.");
  }

  return prisma.banner.update({
    where: { id },
    data: { isActive: true },
  });
};

// ADMIN: DELETE
export const deleteBanner = async (value) => {
  const id = parseId(value);

  return prisma.$transaction(async (tx) => {
    const banner = await tx.banner.findUnique({
      where: { id },
    });

    if (!banner) {
      throw createBannerError(404, "بنر پیدا نشد.");
    }

    await tx.banner.delete({ where: { id } });

    return {
      deletedBanner: banner,
      activeBanner: null,
    };
  });
};
