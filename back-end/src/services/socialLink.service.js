import prisma from "../config/prisma.js";
import {
  normalizeSocialUrl,
  normalizeChannelName,
  normalizeSortOrder,
  normalizeActive,
} from "../validators/socialLink.validation.js";

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
