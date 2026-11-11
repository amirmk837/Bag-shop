import prisma from "../config/prisma.js";
import {
  normalizeSocialUrl,
  normalizeChannelName,
  normalizeSortOrder,
  normalizeActive,
  normalizeSocialPlatform,
  normalizeSocialLabel,
} from "../validators/socialLink.validation.js";

const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const selectSocialLink = {
  id: true,
  platform: true,
  label: true,
  url: true,
  channelName: true,
  isActive: true,
  sortOrder: true,
};

export const getPublicSocialLinks = () =>
  prisma.socialLink.findMany({
    where: { url: { not: null }, isActive: true },
    select: selectSocialLink,
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });

export const getAdminSocialLinks = () =>
  prisma.socialLink.findMany({
    select: selectSocialLink,
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });

const normalizePayload = (payload = {}, existing = {}) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw createError(400, "اطلاعات شبکه اجتماعی نامعتبر است.");
  }
  return {
    label: payload.label === undefined ? existing.label : normalizeSocialLabel(payload.label),
    url: payload.url === undefined ? existing.url ?? null : normalizeSocialUrl(payload.url),
    channelName: payload.channelName === undefined
      ? existing.channelName ?? null
      : normalizeChannelName(payload.channelName),
    isActive: payload.isActive === undefined ? existing.isActive ?? true : normalizeActive(payload.isActive),
    sortOrder: payload.sortOrder === undefined ? existing.sortOrder ?? 0 : normalizeSortOrder(payload.sortOrder),
  };
};

export const createSocialLink = async (payload = {}) => {
  const platform = normalizeSocialPlatform(payload.platform);
  const data = normalizePayload(payload);
  if (!data.label) throw createError(400, "نام پلتفرم الزامی است.");
  return prisma.socialLink.create({
    data: { platform, ...data },
    select: selectSocialLink,
  });
};

export const saveSocialLink = async (platformValue, payload = {}) => {
  const platform = normalizeSocialPlatform(platformValue);
  const existing = await prisma.socialLink.findUnique({ where: { platform } });
  if (!existing) throw createError(404, "پلتفرم شبکه اجتماعی پیدا نشد.");
  const data = normalizePayload(payload, existing);
  return prisma.socialLink.update({
    where: { platform },
    data,
    select: selectSocialLink,
  });
};

export const deleteSocialLink = async (platformValue) => {
  const platform = normalizeSocialPlatform(platformValue);
  const existing = await prisma.socialLink.findUnique({ where: { platform } });
  if (!existing) throw createError(404, "پلتفرم شبکه اجتماعی پیدا نشد.");
  await prisma.socialLink.delete({ where: { platform } });
  return { platform };
};
