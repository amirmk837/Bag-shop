import prisma from "../config/prisma.js";

export const SOCIAL_PLATFORMS = [
  { platform: "INSTAGRAM", label: "اینستاگرام" },
  { platform: "TELEGRAM", label: "تلگرام" },
  { platform: "WHATSAPP", label: "واتساپ" },
  { platform: "BALE", label: "بله" },
  { platform: "RUBIKA", label: "روبیکا" },
];

const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

export const normalizeSocialUrl = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") throw createError(400, "لینک باید متن باشد.");
  const input = value.trim();
  if (!input) return null;
  if (input.length > 2048 || /[\u0000-\u001F\\]/.test(input)) {
    throw createError(400, "لینک نامعتبر است.");
  }
  const normalized = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  try {
    const url = new URL(normalized);
    if (url.protocol !== "https:" || !url.hostname || !url.hostname.includes(".") || url.username || url.password) {
      throw new Error("Invalid URL");
    }
    return url.toString();
  } catch {
    throw createError(400, "لینک معتبر HTTPS وارد کن.");
  }
};

const normalizeChannelName = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") throw createError(400, "نام کانال باید متن باشد.");
  const name = value.trim();
  if (name.length > 100 || /[<>\u0000-\u001F]/.test(name)) {
    throw createError(400, "نام کانال نامعتبر است (حداکثر ۱۰۰ کاراکتر و فقط متن ساده).");
  }
  return name || null;
};

const normalizeSortOrder = (value) => {
  const order = Number(value ?? 0);
  if (!Number.isInteger(order) || order < 0 || order > 10000) {
    throw createError(400, "ترتیب نمایش باید عدد صحیح بین صفر تا ۱۰۰۰۰ باشد.");
  }
  return order;
};

const normalizeActive = (value) => {
  if (value === undefined) return true;
  if (typeof value !== "boolean") throw createError(400, "وضعیت نمایش نامعتبر است.");
  return value;
};

export const getPublicSocialLinks = async () =>
  prisma.socialLink.findMany({
    where: { url: { not: null }, isActive: true },
    select: { platform: true, url: true, channelName: true, sortOrder: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });

export const getAdminSocialLinks = async () => {
  const savedLinks = await prisma.socialLink.findMany();
  return SOCIAL_PLATFORMS.map(({ platform, label }, index) => {
    const saved = savedLinks.find((item) => item.platform === platform);
    return {
      platform,
      label,
      url: saved?.url ?? "",
      channelName: saved?.channelName ?? "",
      isActive: saved?.isActive ?? true,
      sortOrder: saved?.sortOrder ?? index,
    };
  }).sort((a, b) => a.sortOrder - b.sortOrder);
};

export const saveSocialLink = async (platformValue, payload = {}) => {
  const platform = String(platformValue || "").toUpperCase();
  if (!SOCIAL_PLATFORMS.some((item) => item.platform === platform)) {
    throw createError(400, "شبکه اجتماعی نامعتبر است.");
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw createError(400, "اطلاعات شبکه اجتماعی نامعتبر است.");
  }
  const url = normalizeSocialUrl(payload.url);
  const channelName = normalizeChannelName(payload.channelName);
  const isActive = normalizeActive(payload.isActive);
  const sortOrder = normalizeSortOrder(payload.sortOrder);

  return prisma.socialLink.upsert({
    where: { platform },
    create: { platform, url, channelName, isActive, sortOrder },
    update: { url, channelName, isActive, sortOrder },
    select: { platform: true, url: true, channelName: true, isActive: true, sortOrder: true },
  });
};
